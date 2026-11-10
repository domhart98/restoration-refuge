import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { requireApiAuth } from "@/lib/auth";

interface TherapistRow extends RowDataPacket {
  id: number;
  display_name: string;
  bio: string | null;
}

export async function GET() {
  try {
    const user = await requireApiAuth();

    if (user.role !== "OWNER") {
      return NextResponse.json(
        { error: "Owner access required." },
        { status: 403 }
      );
    }

    const [therapists] = await pool.execute<TherapistRow[]>(`
      SELECT
        id,
        display_name,
        bio
      FROM therapists
      WHERE is_active = TRUE
      ORDER BY display_name ASC
    `);

    return NextResponse.json({ therapists });
  } catch (error) {
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

    console.error("Get therapists error:", error);

    return NextResponse.json(
      { error: "Failed to retrieve therapists." },
      { status: 500 }
    );
  }
}