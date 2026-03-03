import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/adminAuth";
import { adminDb } from "@/lib/firebaseAdmin";
import bcrypt from "bcrypt";
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
  const { id, password } = body;
  if (!id || !password || typeof id !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Admin id and new password required" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const doc = await adminDb.collection("admin_users").doc(id).get();
  if (!doc.exists) return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  if (doc.data()?.email?.toLowerCase() === "monu2feb2004@gmail.com") {
    return NextResponse.json({ error: "Cannot change super admin password via this API" }, { status: 400 });
  }

  const password_hash = await bcrypt.hash(password, 10);
  await adminDb.collection("admin_users").doc(id).update({ password_hash });
  return NextResponse.json({ ok: true });
}
