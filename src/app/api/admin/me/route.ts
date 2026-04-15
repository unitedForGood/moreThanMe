import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as jose from "jose";
import type { AdminRole } from "@/lib/adminRoles";
import { getRoleForAdminEmail } from "@/lib/adminRoleServer";

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = "admin_token";

export async function GET(request: Request) {
  try {
    if (!JWT_SECRET) {
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }
    const cookieStore = await cookies();
    const token =
      cookieStore.get(COOKIE_NAME)?.value ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    const email = payload.email as string;
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role: AdminRole | AdminRole[] = await getRoleForAdminEmail(email);
    const superAdmin = Array.isArray(role) ? role.includes("super") : role === "super";

    return NextResponse.json({
      ok: true,
      email,
      sub: payload.sub,
      is_super_admin: superAdmin,
      super_admin_email: process.env.SUPER_ADMIN_EMAIL?.trim() || null,
      role,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

