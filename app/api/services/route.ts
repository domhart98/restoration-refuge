import { NextResponse } from "next/server";
import pool from "@/lib/db";

interface ServiceRow {
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
       FROM services
       WHERE is_active = TRUE
       ORDER BY sort_order ASC, name ASC, duration_minutes ASC`
    );

    const services = (rows as ServiceRow[]).map((service) => ({
      ...service,
      price: Number(service.price),
    }));

    return NextResponse.json({ services });
  } catch (error) {
    console.error("Failed to retrieve services:", error);

    return NextResponse.json(
      { error: "Unable to retrieve services at this time." },
      { status: 500 }
    );
  }
}
