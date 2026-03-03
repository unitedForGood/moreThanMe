import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/adminAuth";
import { adminDb } from "@/lib/firebaseAdmin";
import bcrypt from "bcrypt";
import type { AdminRole } from "@/lib/adminRoles";
import { requireAdminRole } from "@/lib/adminRoleServer";

export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await requireAdminRole(admin.email, ["super"]);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden. Super admin only." }, { status: 403 });
  }

  const body = await request.json();
  const { email, password, role } = body as {
    email?: unknown;
    password?: unknown;
    role?: unknown;
  };
  if (!email || !password || typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const emailLower = email.trim().toLowerCase();
  if (emailLower === "monu2feb2004@gmail.com") {
    return NextResponse.json({ error: "Cannot modify super admin via this API" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  let adminRole: AdminRole | null = null;
  if (typeof role === "string" && ["finance", "events", "media", "super"].includes(role)) {
    adminRole = role as AdminRole;
  }

  const password_hash = await bcrypt.hash(password, 10);

  const existing = await adminDb.collection("admin_users").where("email", "==", emailLower).limit(1).get();
  if (!existing.empty) {
    return NextResponse.json({ error: "Email already exists" }, { status: 400 });
  }

  const ref = await adminDb.collection("admin_users").add({
    email: emailLower,
    password_hash,
    created_at: new Date(),
    role: adminRole,
  });
  const doc = await ref.get();
  const d = doc.data()!;
  return NextResponse.json({
    ok: true,
    admin: { id: doc.id, email: d.email, created_at: d.created_at?.toDate?.()?.toISOString?.() },
  });
}
