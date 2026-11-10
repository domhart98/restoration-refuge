import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { requireApiAuth } from "@/lib/auth";

interface LocationRow extends RowDataPacket {
  id: number;
  name: string;
  address: string | null;
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

    const [locations] = await pool.execute<LocationRow[]>(`
      SELECT
        id,
        name,
        address
      FROM locations
      WHERE is_active = TRUE
      ORDER BY name ASC
    `);

    return NextResponse.json({ locations });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    console.error("Get locations error:", error);

    return NextResponse.json(
      { error: "Failed to retrieve locations." },
      { status: 500 }
    );
  }
}