import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { requireApiAuth } from "@/lib/auth";

interface ExceptionRow extends RowDataPacket {
  id: number;
  therapist_id: number;
  therapist_name: string;
  location_id: number;
  location_name: string;
  exception_date: string;
  is_available: number | boolean;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
}

interface EntityRow extends RowDataPacket {
  id: number;
}

function handleAuthError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  if (error instanceof Error && error.message === "FORBIDDEN") {
    return NextResponse.json(
      { error: "Owner access required." },
      { status: 403 }
    );
  }

  console.error("Owner availability exceptions API error:", error);

  return NextResponse.json(
    { error: "An unexpected error occurred." },
    { status: 500 }
  );
}

function isValidDate(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value
  );
}

// GET: Return availability exceptions.
export async function GET() {
  try {
    const user = await requireApiAuth();

    if (user.role !== "OWNER") {
      return NextResponse.json(
        { error: "Owner access required." },
        { status: 403 }
      );
    }

    const [rows] = await pool.execute<ExceptionRow[]>(`
      SELECT
        ae.id,
        ae.therapist_id,
        t.display_name AS therapist_name,
        ae.location_id,
        l.name AS location_name,
        DATE_FORMAT(ae.exception_date, '%Y-%m-%d') AS exception_date,
        ae.is_available,
        TIME_FORMAT(ae.start_time, '%H:%i') AS start_time,
        TIME_FORMAT(ae.end_time, '%H:%i') AS end_time,
        ae.reason
      FROM availability_exceptions ae
      JOIN therapists t ON t.id = ae.therapist_id
      JOIN locations l ON l.id = ae.location_id
      ORDER BY ae.exception_date, t.display_name, l.name
    `);

    return NextResponse.json({ exceptions: rows });
  } catch (error) {
    return handleAuthError(error);
  }
}

// POST: Create an availability exception.
export async function POST(request: NextRequest) {
  try {
    const user = await requireApiAuth();

    if (user.role !== "OWNER") {
      return NextResponse.json(
        { error: "Owner access required." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const therapistId = Number(body.therapistId);
    const locationId = Number(body.locationId);
    const exceptionDate = String(body.exceptionDate ?? "");
    const isAvailable = body.isAvailable === true;
    const startTime = String(body.startTime ?? "");
    const endTime = String(body.endTime ?? "");
    const reason = body.reason ? String(body.reason).trim() : null;

    if (
      !Number.isSafeInteger(therapistId) ||
      therapistId <= 0 ||
      !Number.isSafeInteger(locationId) ||
      locationId <= 0 ||
      !isValidDate(exceptionDate) ||
      (reason !== null && reason.length > 255)
    ) {
      return NextResponse.json(
        { error: "Please provide valid exception details." },
        { status: 400 }
      );
    }

    // Unavailable exceptions block the entire day.
    // Available exceptions must specify a valid time window.
    if (
      isAvailable &&
      (
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime) ||
        startTime >= endTime
      )
    ) {
      return NextResponse.json(
        {
          error:
            "For limited availability, provide valid start and end times, with the end after the start.",
        },
        { status: 400 }
      );
    }

    const [therapists] = await pool.execute<EntityRow[]>(
      `SELECT id
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

    const [locations] = await pool.execute<EntityRow[]>(
      `SELECT id
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
      `INSERT INTO availability_exceptions
        (
          therapist_id,
          location_id,
          exception_date,
          is_available,
          start_time,
          end_time,
          reason
        )
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        therapistId,
        locationId,
        exceptionDate,
        isAvailable,
        isAvailable ? startTime : null,
        isAvailable ? endTime : null,
        reason || null,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        id: result.insertId,
        message: "Availability exception created.",
      },
      { status: 201 }
    );
  } catch (error) {
    return handleAuthError(error);
  }
}