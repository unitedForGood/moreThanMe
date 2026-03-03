import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/adminAuth";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdminRole } from "@/lib/adminRoleServer";

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await requireAdminRole(admin.email, ["media"]);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const snap = await adminDb.collection("newsletters").orderBy("created_at", "desc").get();
  const newsletters = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ newsletters });
}
