import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/adminAuth";
import { adminDb } from "@/lib/firebaseAdmin";
import type { AdminRole } from "@/lib/adminRoles";
import { requireAdminRole } from "@/lib/adminRoleServer";

export async function PATCH(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await requireAdminRole(admin.email, ["super"]);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden. Super admin only." }, { status: 403 });
  }

  const body = await request.json();
  const { id, role, roles } = body as { id?: unknown; role?: unknown; roles?: unknown };

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Admin id required" }, { status: 400 });
  }

  let newRoles: AdminRole | AdminRole[] = null;
  const validRoles = ["finance", "events", "media", "super"];

  if (Array.isArray(roles)) {
    newRoles = roles.filter(r => validRoles.includes(r)) as AdminRole[];
  } else if (typeof role === "string") {
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    newRoles = [role as AdminRole];
  }

  const doc = await adminDb.collection("admin_users").doc(id).get();
  if (!doc.exists) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }

  await adminDb.collection("admin_users").doc(id).update({ role: newRoles });
  return NextResponse.json({ ok: true });
}

