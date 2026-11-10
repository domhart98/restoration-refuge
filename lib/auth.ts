import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export interface AuthUser {
  id: number;
  email: string;
  role: string;
  is_active: number;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token");

  if (!token) {
    return null;
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  let decoded: jwt.JwtPayload;

  // Invalid or expired tokens are treated as unauthenticated.
  try {
    const verified = jwt.verify(
      token.value, 
      jwtSecret
    );

    if (typeof verified === "string") return null;

    decoded = verified;
  } catch (error) {
    return null;
  }

  if (!Number.isSafeInteger(decoded.userId) || decoded.userId <= 0) {
    return null;
  }

  const [rows]: any = await pool.query(
    `SELECT id, email, role, is_active
      FROM users
      WHERE id = ?
      LIMIT 1`,
    [decoded.userId]
  );

  return rows[0] ?? null;
}

export async function requireAuth(): Promise<AuthUser> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  return currentUser;
}

// For API routes: return JSON 401 instead of redirecting.
export async function requireApiAuth(): Promise<AuthUser> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error("UNAUTHORIZED");
  }

  return currentUser;
}

export async function requireOwner(): Promise<AuthUser> {
  const user = await requireAuth();

  if (user.role !== "OWNER") {
    throw new Error("FORBIDDEN");
  }

  return user;
}