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
  const { id, role } = body as { id?: unknown; role?: unknown };

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Admin id required" }, { status: 400 });
  }

  let newRole: AdminRole | null = null;
  if (typeof role === "string") {
    if (!["finance", "events", "media", "super"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    newRole = role as AdminRole;
  }

  const doc = await adminDb.collection("admin_users").doc(id).get();
  if (!doc.exists) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }

  await adminDb.collection("admin_users").doc(id).update({ role: newRole });
  return NextResponse.json({ ok: true });
}

