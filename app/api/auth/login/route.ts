import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import jwt from "jsonwebtoken";
import { createAuthToken, type UserRole } from "@/lib/auth";

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  role: UserRole;
  is_active: number | boolean;
}

export async function POST(req: NextRequest) {
  try {
    // Ensure the signing secret is configured.
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("JWT_SECRET is not configured.");

      return NextResponse.json(
        {
          success: false,
          error: "Login is temporarily unavailable.",
        },
        { status: 500 }
      );
    }

    // Parse and validate the request body.
    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      !("email" in body) ||
      !("password" in body) ||
      typeof body.email !== "string" ||
      typeof body.password !== "string" ||
      !body.email.trim() ||
      !body.password ||
      body.password.length > 1024
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Email and password are required.",
        },
        { status: 400 }
      );
    }

    const { email, password } = body;

    // Only allow active users to authenticate.
    const [rows]: any = await pool.query(
      `
      SELECT *
      FROM users
      WHERE email = ?
        AND is_active = 1
      LIMIT 1
      `,
      [email.trim()]
    );

    // Use the same message for unknown users and incorrect passwords.
    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    const user = rows[0];

    const validPassword = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!validPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    // Create a JWT that expires after seven days.
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        platform_role: user.platform_role,
      },
      jwtSecret,
      {
        expiresIn: "7d",
      }
    );

    const response = NextResponse.json({
      success: true,
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Login failed:", error);

    return NextResponse.json(
      { error: "Unable to log in at this time." },
      { status: 500 }
    );
  }
}