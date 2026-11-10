import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

interface ServiceRow {
  id: number;
  duration_minutes: number;
}

interface AddOnRow {
  id: number;
  duration_minutes: number | null;
}

interface TherapistRow {
  id: number;
  location_id: number;
}

interface AvailabilityRuleRow {
  start_time: string;
  end_time: string;
}

interface AppointmentRow {
  starts_at: string;
  ends_at: string;
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

function formatTime(minutes: number): string {
  return (
    `${String(Math.floor(minutes / 60)).padStart(2, "0")}:` +
    `${String(minutes % 60).padStart(2, "0")}`
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const serviceId = Number(searchParams.get("serviceId"));
  const date = searchParams.get("date");
  const rawAddOnIds = searchParams.get("addOnIds");

  if (
    !Number.isInteger(serviceId) ||
    serviceId <= 0 ||
    !date ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    return NextResponse.json(
      { error: "A valid serviceId and date are required." },
      { status: 400 }
    );
  }

  const requestedDate = new Date(`${date}T12:00:00`);

  if (
    Number.isNaN(requestedDate.getTime()) ||
    requestedDate.toISOString().slice(0, 10) !== date
  ) {
    return NextResponse.json(
      { error: "Invalid date." },
      { status: 400 }
    );
  }

  // Parse comma-separated add-on IDs, e.g. ?addOnIds=1,2
  let addOnIds: number[] = [];

  if (rawAddOnIds) {
    const parsedIds = rawAddOnIds.split(",").map(Number);

    if (
      !parsedIds.every(
        (id) => Number.isSafeInteger(id) && id > 0
      )
    ) {
      return NextResponse.json(
        { error: "Invalid add-on selection." },
        { status: 400 }
      );
    }

    addOnIds = [...new Set(parsedIds)];
  }

  try {
    const [serviceRows] = await pool.execute(
      `SELECT id, duration_minutes
       FROM services
       WHERE id = ? AND is_active = TRUE
       LIMIT 1`,
      [serviceId]
    );

    const service = (serviceRows as ServiceRow[])[0];

    if (!service) {
      return NextResponse.json(
        { error: "Service not found." },
        { status: 404 }
      );
    }

    // Get selected add-on durations from the database.
    let addOnDuration = 0;

    if (addOnIds.length > 0) {
      const placeholders = addOnIds.map(() => "?").join(",");

      const [addOnRows] = await pool.execute(
        `SELECT id, duration_minutes
         FROM add_ons
         WHERE id IN (${placeholders})
           AND is_active = TRUE`,
        addOnIds
      );

      const addOns = addOnRows as AddOnRow[];

      if (addOns.length !== addOnIds.length) {
        return NextResponse.json(
          { error: "One or more selected add-ons are unavailable." },
          { status: 400 }
        );
      }

      addOnDuration = addOns.reduce(
        (total, addOn) => total + Number(addOn.duration_minutes ?? 0),
        0
      );
    }

    const totalDuration = Number(service.duration_minutes) + addOnDuration;

    // Find active therapist/location combinations that offer this service.
    const [therapistRows] = await pool.execute(
      `SELECT DISTINCT t.id, tl.location_id
       FROM therapists t
       INNER JOIN users u
         ON u.id = t.user_id
       INNER JOIN therapist_services ts
         ON ts.therapist_id = t.id
       INNER JOIN therapist_locations tl
         ON tl.therapist_id = t.id
       INNER JOIN locations l
         ON l.id = tl.location_id
       WHERE ts.service_id = ?
         AND t.is_active = TRUE
         AND u.is_active = TRUE
         AND l.is_active = TRUE
       ORDER BY t.id, tl.location_id`,
      [serviceId]
    );

    const therapists = therapistRows as TherapistRow[];
    const slots: string[] = [];

    const weekday =
      requestedDate.getDay() === 0
        ? 7
        : requestedDate.getDay();

    for (const therapist of therapists) {
      const [ruleRows] = await pool.execute(
        `SELECT start_time, end_time
         FROM availability_rules
         WHERE therapist_id = ?
           AND location_id = ?
           AND day_of_week = ?
           AND is_active = TRUE
           AND effective_from <= ?
           AND (effective_until IS NULL OR effective_until >= ?)`,
        [
          therapist.id,
          therapist.location_id,
          weekday,
          date,
          date,
        ]
      );

      const rules = ruleRows as AvailabilityRuleRow[];

      const [exceptionRows] = await pool.execute(
        `SELECT is_available, start_time, end_time
         FROM availability_exceptions
         WHERE therapist_id = ?
           AND location_id = ?
           AND exception_date = ?
         LIMIT 1`,
        [therapist.id, therapist.location_id, date]
      );

      const exceptions = exceptionRows as {
        is_available: number | boolean;
        start_time: string | null;
        end_time: string | null;
      }[];

      const exception = exceptions[0];

      if (exception && !exception.is_available) {
        continue;
      }

      let workingPeriods = rules.map((rule) => ({
        start: String(rule.start_time).slice(0, 5),
        end: String(rule.end_time).slice(0, 5),
      }));

      if (exception?.start_time && exception?.end_time) {
        workingPeriods = [
          {
            start: String(exception.start_time).slice(0, 5),
            end: String(exception.end_time).slice(0, 5),
          },
        ];
      }

      if (workingPeriods.length === 0) {
        continue;
      }

      // Load appointments for this therapist on the requested date.
      const [appointmentRows] = await pool.execute(
        `SELECT starts_at, ends_at
         FROM appointments
         WHERE therapist_id = ?
           AND status = 'CONFIRMED'
           AND starts_at < ?
           AND ends_at > ?`,
        [
          therapist.id,
          `${date} 23:59:59`,
          `${date} 00:00:00`,
        ]
      );

      const appointments = appointmentRows as AppointmentRow[];

      for (const period of workingPeriods) {
        const periodStart = toMinutes(period.start);
        const periodEnd = toMinutes(period.end);

        // Offer appointments every 30 minutes.
        for (
          let start = periodStart;
          start + totalDuration <= periodEnd;
          start += 30
        ) {
          const end = start + totalDuration;

          const startTime = formatTime(start);
          const endTime = formatTime(end);

          const proposedStart = start;
          const proposedEnd = end;

          const overlaps = appointments.some((appointment) => {
            const existingStart = toMinutes(
              String(appointment.starts_at).slice(11, 16)
            );

            const existingEnd = toMinutes(
              String(appointment.ends_at).slice(11, 16)
            );

            return (
              proposedStart < existingEnd &&
              proposedEnd > existingStart
            );
          });

          if (!overlaps) {
            slots.push(startTime);
          }
        }
      }
    }

    const uniqueSlots = [...new Set(slots)].sort();

    return NextResponse.json({
      date,
      serviceId,
      addOnIds,
      durationMinutes: totalDuration,
      availableTimes: uniqueSlots,
    });
  } catch (error) {
    console.error("Failed to retrieve availability:", error);

    return NextResponse.json(
      { error: "Unable to retrieve availability." },
      { status: 500 }
    );
  }
}