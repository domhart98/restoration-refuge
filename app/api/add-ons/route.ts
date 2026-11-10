import { NextResponse } from "next/server";
import pool from "@/lib/db";

interface AddOnRow {
  id: number;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: string | number;
}

export async function GET() {
  try {
    const [rows] = await pool.execute(
      `SELECT id, name, description, duration_minutes, price
       FROM add_ons
       WHERE is_active = 1
       ORDER BY name ASC, duration_minutes ASC`
    );

    const addOns = (rows as AddOnRow[]).map((addOn) => ({
      ...addOn,
      price: Number(addOn.price),
    }));

    return NextResponse.json({ addOns });
  } catch (error) {
    console.error("Failed to retrieve add-ons:", error);

    return NextResponse.json(
      { error: "Unable to retrieve add-ons at this time." },
      { status: 500 }
    );
  }
}
