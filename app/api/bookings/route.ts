import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";
import { sendBookingEmails } from "@/lib/email";
import pool from "@/lib/db";

interface ServiceRow {
  id: number;
  name: string;
  duration_minutes: number;
  price: string | number;
}

interface AddOnRow {
  id: number;
  name: string;
  price: string | number;
  duration_minutes: number | null;
}

interface SelectedAddOn {
  id: number;
  name: string;
  price: number;
  durationMinutes: number;
}

interface EligiblePair {
  therapist_id: number;
  location_id: number;
  location_name: string;
}

interface AvailabilityRule {
  start_time: string;
  end_time: string;
}

interface AvailabilityException {
  is_available: number | boolean;
  start_time: string | null;
  end_time: string | null;
}

function isValidDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T12:00:00`);

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function isValidTime(value: unknown): value is string {
  return typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

interface BookingRow {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  service_name: string;
  duration_minutes: number;
  price: string | number;
  starts_at: string;
  ends_at: string;
  status: string;
  customer_notes: string | null;
  location_name: string;
}

interface BookingAddOnRow {
  appointment_id: number;
  add_on_id: number;
  add_on_name: string;
  price: string | number;
  duration_minutes: number;
}

export async function GET() {
  try {
    const [bookingRows] = await pool.execute(
      `SELECT
          a.id,
          a.customer_name,
          a.customer_email,
          a.customer_phone,
          a.service_name,
          a.duration_minutes,
          a.price,
          a.starts_at,
          a.ends_at,
          a.status,
          a.customer_notes,
          l.name AS location_name
       FROM appointments a
       LEFT JOIN locations l ON l.id = a.location_id
       ORDER BY a.starts_at DESC`
    );

    const bookings = bookingRows as BookingRow[];

    if (bookings.length === 0) {
      return NextResponse.json({ bookings: [] });
    }

    const bookingIds = bookings.map((booking) => booking.id);
    const placeholders = bookingIds.map(() => "?").join(",");

    const [addOnRows] = await pool.execute(
      `SELECT
          appointment_id,
          add_on_id,
          add_on_name,
          price,
          duration_minutes
       FROM appointment_add_ons
       WHERE appointment_id IN (${placeholders})`,
      bookingIds
    );

    const addOns = addOnRows as BookingAddOnRow[];

    const bookingsWithAddOns = bookings.map((booking) => ({
      ...booking,
      price: Number(booking.price),
      addOns: addOns
        .filter((addOn) => addOn.appointment_id === booking.id)
        .map((addOn) => ({
          id: addOn.add_on_id,
          name: addOn.add_on_name,
          price: Number(addOn.price),
          durationMinutes: addOn.duration_minutes,
        })),
    }));

    return NextResponse.json({
      bookings: bookingsWithAddOns,
    });
  } catch (error) {
    console.error("Failed to retrieve bookings:", error);

    return NextResponse.json(
      { error: "Unable to retrieve bookings." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let body: {
    serviceId?: unknown;
    selectedAddOnIds?: unknown;
    date?: unknown;
    time?: unknown;
    customerName?: unknown;
    customerEmail?: unknown;
    customerPhone?: unknown;
    customerNotes?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const serviceId = Number(body.serviceId);
  const date = body.date;
  const time = body.time;

  const customerName =
    typeof body.customerName === "string" ? body.customerName.trim() : "";

  const customerEmail =
    typeof body.customerEmail === "string"
      ? body.customerEmail.trim().toLowerCase()
      : "";

  const customerPhone =
    typeof body.customerPhone === "string" ? body.customerPhone.trim() : "";

  const customerNotes =
    typeof body.customerNotes === "string" ? body.customerNotes.trim() : "";

  // Add-ons are optional. Validate that IDs are positive integers.
  let selectedAddOnIds: number[] = [];

  if (body.selectedAddOnIds !== undefined && body.selectedAddOnIds !== null) {
    if (
      !Array.isArray(body.selectedAddOnIds) ||
      !body.selectedAddOnIds.every(
        (id) => Number.isSafeInteger(id) && Number(id) > 0
      )
    ) {
      return NextResponse.json(
        { error: "Invalid add-on selection." },
        { status: 400 }
      );
    }

    selectedAddOnIds = [...new Set(body.selectedAddOnIds as number[])];
  }

  if (
    !Number.isSafeInteger(serviceId) ||
    serviceId <= 0 ||
    !isValidDate(date) ||
    !isValidTime(time) ||
    !customerName ||
    customerName.length > 150 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) ||
    customerEmail.length > 254 ||
    !customerPhone ||
    customerPhone.length > 40 ||
    customerNotes.length > 2000
  ) {
    return NextResponse.json(
      { error: "Please provide valid service, appointment, and contact details." },
      { status: 400 }
    );
  }

  // Barbados local appointment date.
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Barbados",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  if (date < today) {
    return NextResponse.json(
      { error: "Appointments cannot be booked in the past." },
      { status: 400 }
    );
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Fetch service details from the database.
    const [serviceRows] = await connection.execute(
      `SELECT id, name, duration_minutes, price
       FROM services
       WHERE id = ? AND is_active = TRUE
       LIMIT 1`,
      [serviceId]
    );

    const service = (serviceRows as ServiceRow[])[0];

    if (!service) {
      await connection.rollback();

      return NextResponse.json(
        { error: "The selected service is unavailable." },
        { status: 404 }
      );
    }

    // Fetch selected add-ons from the database.
    // Never trust client-provided prices or durations.
    let selectedAddOns: SelectedAddOn[] = [];

    if (selectedAddOnIds.length > 0) {
      const placeholders = selectedAddOnIds.map(() => "?").join(",");

      const [addOnRows] = await connection.execute(
        `SELECT id, name, price, duration_minutes
         FROM add_ons
         WHERE id IN (${placeholders})
           AND is_active = TRUE`,
        selectedAddOnIds
      );

      const databaseAddOns = addOnRows as AddOnRow[];

      // Ensure every selected add-on exists and is active.
      if (databaseAddOns.length !== selectedAddOnIds.length) {
        await connection.rollback();

        return NextResponse.json(
          { error: "One or more selected add-ons are unavailable." },
          { status: 400 }
        );
      }

      selectedAddOns = databaseAddOns.map((addOn) => ({
        id: addOn.id,
        name: addOn.name,
        price: Number(addOn.price),
        durationMinutes: Number(addOn.duration_minutes ?? 0),
      }));
    }

    const servicePrice = Number(service.price);
    const serviceDuration = Number(service.duration_minutes);

    const addOnPrice = selectedAddOns.reduce(
      (total, addOn) => total + addOn.price,
      0
    );

    const addOnDuration = selectedAddOns.reduce(
      (total, addOn) => total + addOn.durationMinutes,
      0
    );

    const totalPrice = servicePrice + addOnPrice;
    const totalDurationMinutes = serviceDuration + addOnDuration;

    // Determine therapist/location combinations offering this service.
    const [pairRows] = await connection.execute(
      `SELECT DISTINCT
          t.id AS therapist_id,
          tl.location_id,
          l.name AS location_name
       FROM therapists t
       INNER JOIN users u ON u.id = t.user_id
       INNER JOIN therapist_services ts ON ts.therapist_id = t.id
       INNER JOIN therapist_locations tl ON tl.therapist_id = t.id
       INNER JOIN locations l ON l.id = tl.location_id
       WHERE ts.service_id = ?
         AND t.is_active = TRUE
         AND u.is_active = TRUE
         AND l.is_active = TRUE
       ORDER BY t.id, tl.location_id`,
      [serviceId]
    );

    const pairs = pairRows as EligiblePair[];

    if (pairs.length !== 1) {
      await connection.rollback();

      return NextResponse.json(
        {
          error:
            pairs.length === 0
              ? "No active therapist and location are configured for this service."
              : "Multiple therapists or locations offer this service. Therapist and location selection must be added before booking.",
        },
        { status: 409 }
      );
    }

    const {
      therapist_id: therapistId,
      location_id: locationId,
      location_name: locationName,
    } = pairs[0];

    // Serialize booking attempts for this therapist.
    const [lockedRows] = await connection.execute(
      `SELECT id
       FROM therapists
       WHERE id = ? AND is_active = TRUE
       FOR UPDATE`,
      [therapistId]
    );

    if ((lockedRows as { id: number }[]).length === 0) {
      await connection.rollback();

      return NextResponse.json(
        { error: "The therapist is no longer available." },
        { status: 409 }
      );
    }

    const weekdayDate = new Date(`${date}T12:00:00`);
    const weekday = weekdayDate.getDay() === 0 ? 7 : weekdayDate.getDay();

    const [ruleRows] = await connection.execute(
      `SELECT start_time, end_time
       FROM availability_rules
       WHERE therapist_id = ?
         AND location_id = ?
         AND day_of_week = ?
         AND is_active = TRUE
         AND effective_from <= ?
         AND (effective_until IS NULL OR effective_until >= ?)`,
      [therapistId, locationId, weekday, date, date]
    );

    let periods = (ruleRows as AvailabilityRule[]).map((rule) => ({
      start: String(rule.start_time).slice(0, 5),
      end: String(rule.end_time).slice(0, 5),
    }));

    const [exceptionRows] = await connection.execute(
      `SELECT is_available, start_time, end_time
       FROM availability_exceptions
       WHERE therapist_id = ?
         AND location_id = ?
         AND exception_date = ?
       LIMIT 1`,
      [therapistId, locationId, date]
    );

    const exception = (exceptionRows as AvailabilityException[])[0];

    if (exception && !exception.is_available) {
      periods = [];
    } else if (exception?.start_time && exception?.end_time) {
      periods = [
        {
          start: String(exception.start_time).slice(0, 5),
          end: String(exception.end_time).slice(0, 5),
        },
      ];
    }

    const startMinutes =
      Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

    // Important: availability uses service + add-on duration.
    const endMinutes = startMinutes + totalDurationMinutes;

    if (endMinutes > 24 * 60) {
      await connection.rollback();

      return NextResponse.json(
        { error: "The appointment would extend beyond the end of the day." },
        { status: 400 }
      );
    }

    const endTime =
      `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:` +
      `${String(endMinutes % 60).padStart(2, "0")}`;

    const fitsAvailability = periods.some((period) => {
      const periodStart =
        Number(period.start.slice(0, 2)) * 60 +
        Number(period.start.slice(3, 5));

      const periodEnd =
        Number(period.end.slice(0, 2)) * 60 +
        Number(period.end.slice(3, 5));

      return startMinutes >= periodStart && endMinutes <= periodEnd;
    });

    if (!fitsAvailability) {
      await connection.rollback();

      return NextResponse.json(
        {
          error:
            "The selected time is outside the therapist's availability for the full appointment duration.",
        },
        { status: 409 }
      );
    }

    // MySQL DATETIME strings represent Barbados local wall-clock times.
    const startsAt = `${date} ${time}:00`;
    const endsAt = `${date} ${endTime}:00`;

    if (date === today) {
      const currentTime = new Intl.DateTimeFormat("en-GB", {
        timeZone: "America/Barbados",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(new Date());

      if (time <= currentTime) {
        await connection.rollback();

        return NextResponse.json(
          { error: "Please choose a future appointment time." },
          { status: 400 }
        );
      }
    }

    // Check conflicts using the full appointment duration.
    const [appointmentRows] = await connection.execute(
      `SELECT id
       FROM appointments
       WHERE therapist_id = ?
         AND status = 'CONFIRMED'
         AND starts_at < ?
         AND ends_at > ?
       LIMIT 1`,
      [therapistId, endsAt, startsAt]
    );

    if ((appointmentRows as { id: number }[]).length > 0) {
      await connection.rollback();

      return NextResponse.json(
        {
          error:
            "That appointment time has just been booked. Please choose another.",
        },
        { status: 409 }
      );
    }

    // Store the combined duration and total price in the appointment.
    const [insertResult] = await connection.execute(
      `INSERT INTO appointments (
         therapist_id,
         service_id,
         location_id,
         customer_name,
         customer_email,
         customer_phone,
         starts_at,
         ends_at,
         service_name,
         duration_minutes,
         price,
         status,
         customer_notes
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?)`,
      [
        therapistId,
        serviceId,
        locationId,
        customerName,
        customerEmail,
        customerPhone,
        startsAt,
        endsAt,
        service.name,
        totalDurationMinutes,
        totalPrice,
        customerNotes || null,
      ]
    );

    const bookingId = (insertResult as ResultSetHeader).insertId;

    // Save individual add-ons associated with this appointment.
    for (const addOn of selectedAddOns) {
      await connection.execute(
        `INSERT INTO appointment_add_ons (
          appointment_id,
          add_on_id,
          add_on_name,
          price,
          duration_minutes
        )
        VALUES (?, ?, ?, ?, ?)`,
        [
          bookingId,
          addOn.id,
          addOn.name,
          addOn.price,
          addOn.durationMinutes,
        ]
      );
    }

    // Save booking before attempting email delivery.
    await connection.commit();

    // Email errors should not undo a successful booking.
    try {
      await sendBookingEmails({
        bookingId,
        customerName,
        customerEmail,
        customerPhone,
        serviceName: service.name,
        durationMinutes: serviceDuration,
        price: servicePrice,
        addOns: selectedAddOns.map((addOn) => ({
          name: addOn.name,
          price: addOn.price,
          durationMinutes: addOn.durationMinutes,
        })),
        totalDurationMinutes,
        totalPrice,
        date,
        time,
        locationName,
      });
    } catch (emailError) {
      console.error(
        `Booking ${bookingId} was saved, but confirmation emails failed:`,
        emailError
      );
    }

    return NextResponse.json(
      {
        success: true,
        bookingId,
        message: "Your appointment has been confirmed.",
      },
      { status: 201 }
    );
  } catch (error) {
    await connection.rollback();

    console.error("Booking creation failed:", error);

    return NextResponse.json(
      { error: "Unable to create the booking. Please try again." },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}