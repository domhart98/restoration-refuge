import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { requireOwner } from "@/lib/auth";

interface AvailabilityRow extends RowDataPacket {
  id: number;
  therapist_id: number;
  therapist_name: string;
  location_id: number;
  location_name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  effective_from: string | null;
  effective_until: string | null;
  is_active: number | boolean;
}

interface LocationRow extends RowDataPacket {
  id: number;
  name: string;
}

interface TherapistRow extends RowDataPacket {
  id: number;
  display_name: string;
}

function handleAuthError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (error instanceof Error && error.message === "FORBIDDEN") {
    return NextResponse.json({ error: "Owner access required." }, { status: 403 });
  }

  console.error("Owner availability API error:", error);

  return NextResponse.json(
    { error: "An unexpected error occurred." },
    { status: 500 }
  );
}

// GET: Return the current weekly availability rules.
export async function GET() {
  try {
    await requireOwner();

    const [rows] = await pool.execute<AvailabilityRow[]>(`
      SELECT
        ar.id,
        ar.therapist_id,
        t.display_name AS therapist_name,
        ar.location_id,
        l.name AS location_name,
        ar.day_of_week,
        TIME_FORMAT(ar.start_time, '%H:%i') AS start_time,
        TIME_FORMAT(ar.end_time, '%H:%i') AS end_time,
        ar.effective_from,
        ar.effective_until,
        ar.is_active
      FROM availability_rules ar
      JOIN therapists t ON t.id = ar.therapist_id
      JOIN locations l ON l.id = ar.location_id
      ORDER BY t.display_name, ar.day_of_week, ar.start_time
    `);

    return NextResponse.json({ availability: rows });
  } catch (error) {
    return handleAuthError(error);
  }
}

// POST: Create one weekly availability rule.
export async function POST(request: NextRequest) {
  try {
    await requireOwner();

    const body = await request.json();

    const therapistId = Number(body.therapistId);
    const locationId = Number(body.locationId);
    const dayOfWeek = Number(body.dayOfWeek);
    const startTime = String(body.startTime ?? "");
    const endTime = String(body.endTime ?? "");
    const effectiveFrom = body.effectiveFrom
      ? String(body.effectiveFrom)
      : null;
    const effectiveUntil = body.effectiveUntil
      ? String(body.effectiveUntil)
      : null;

    if (
      !Number.isSafeInteger(therapistId) ||
      therapistId <= 0 ||
      !Number.isSafeInteger(locationId) ||
      locationId <= 0 ||
      !Number.isInteger(dayOfWeek) ||
      dayOfWeek < 1 ||
      dayOfWeek > 7 ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime) ||
      startTime >= endTime
    ) {
      return NextResponse.json(
        { error: "Please provide valid availability details." },
        { status: 400 }
      );
    }

    const validDate = (value: string) =>
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
      new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

    if (
      (effectiveFrom && !validDate(effectiveFrom)) ||
      (effectiveUntil && !validDate(effectiveUntil)) ||
      (effectiveFrom && effectiveUntil && effectiveFrom > effectiveUntil)
    ) {
      return NextResponse.json(
        { error: "Please provide a valid effective date range." },
        { status: 400 }
      );
    }

    const [therapists] = await pool.execute<TherapistRow[]>(
      `SELECT id, display_name
       FROM therapists
       WHERE id = ? AND is_active = TRUE
       LIMIT 1`,
      [therapistId]
    );

    if (!therapists.length) {
      return NextResponse.json(
        { error: "The selected therapist was not found or is inactive." },
        { status: 400 }
      );
    }

    const [locations] = await pool.execute<LocationRow[]>(
      `SELECT id, name
       FROM locations
       WHERE id = ? AND is_active = TRUE
       LIMIT 1`,
      [locationId]
    );

    if (!locations.length) {
      return NextResponse.json(
        { error: "The selected location was not found or is inactive." },
        { status: 400 }
      );
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO availability_rules
        (
          therapist_id,
          location_id,
          day_of_week,
          start_time,
          end_time,
          effective_from,
          effective_until,
          is_active
        )
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        therapistId,
        locationId,
        dayOfWeek,
        startTime,
        endTime,
        effectiveFrom,
        effectiveUntil,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        id: result.insertId,
        message: "Availability rule created.",
      },
      { status: 201 }
    );
  } catch (error) {
    return handleAuthError(error);
  }
}