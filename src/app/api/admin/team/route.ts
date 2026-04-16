import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/adminAuth";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdminRole } from "@/lib/adminRoleServer";

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await requireAdminRole(admin.email, ["super"]);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const snap = await adminDb.collection("team_members").orderBy("sort_order", "asc").get();
  const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await requireAdminRole(admin.email, ["super"]);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const {
    name,
    role,
    email,
    phone,
    image_url,
    sort_order,
    is_founding_member,
    is_core_member,
    enrollment,
    batch,
    course,
    why_join,
    approval_status,
  } = body;
  if (!name || !role) {
    return NextResponse.json({ error: "name and role required" }, { status: 400 });
  }

  const ref = await adminDb.collection("team_members").add({
    name: String(name).trim(),
    role: String(role).trim(),
    email: email ? String(email).trim() : null,
    phone: phone ? String(phone).trim() : null,
    image_url: image_url ? String(image_url).trim() : null,
    sort_order: typeof sort_order === "number" ? sort_order : 0,
    is_founding_member: !!is_founding_member,
    is_core_member: !!is_core_member,
    enrollment: enrollment ? String(enrollment).trim() : null,
    batch: batch ? String(batch).trim() : null,
    course: course ? String(course).trim() : null,
    why_join: why_join ? String(why_join).trim() : null,
    approval_status: approval_status ? String(approval_status).trim() : "approved",
    created_at: new Date(),
  });
  const doc = await ref.get();
  return NextResponse.json({ id: doc.id, ...doc.data() });
}

export async function PATCH(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await requireAdminRole(admin.email, ["super"]);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = String(body.name).trim();
  if (body.role !== undefined) updates.role = String(body.role).trim();
  if (body.email !== undefined) updates.email = body.email ? String(body.email).trim() : null;
  if (body.phone !== undefined) updates.phone = body.phone ? String(body.phone).trim() : null;
  if (body.image_url !== undefined) updates.image_url = body.image_url ? String(body.image_url).trim() : null;
  if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order);
  if (body.is_founding_member !== undefined) updates.is_founding_member = !!body.is_founding_member;
  if (body.is_core_member !== undefined) updates.is_core_member = !!body.is_core_member;
  if (body.enrollment !== undefined) updates.enrollment = body.enrollment ? String(body.enrollment).trim() : null;
  if (body.batch !== undefined) updates.batch = body.batch ? String(body.batch).trim() : null;
  if (body.course !== undefined) updates.course = body.course ? String(body.course).trim() : null;
  if (body.why_join !== undefined) updates.why_join = body.why_join ? String(body.why_join).trim() : null;
  if (body.approval_status !== undefined) updates.approval_status = String(body.approval_status).trim();

  await adminDb.collection("team_members").doc(id).update(updates);
  const doc = await adminDb.collection("team_members").doc(id).get();
  return NextResponse.json({ id: doc.id, ...doc.data() });
}

export async function DELETE(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await requireAdminRole(admin.email, ["super"]);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await adminDb.collection("team_members").doc(id).delete();
  return NextResponse.json({ ok: true });
}
