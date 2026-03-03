import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/adminAuth";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdminRole } from "@/lib/adminRoleServer";

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await requireAdminRole(admin.email, ["media"]);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const snap = await adminDb.collection("media_assets").orderBy("sort_order", "asc").get();
  const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await requireAdminRole(admin.email, ["media"]);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { url, public_id, type, title, alt, category, description, tags, show_on_home, sort_order } = body;
  if (!url || !type) return NextResponse.json({ error: "url and type required" }, { status: 400 });
  if (!["image", "video"].includes(type)) return NextResponse.json({ error: "type must be image or video" }, { status: 400 });

  const ref = await adminDb.collection("media_assets").add({
    url: String(url),
    public_id: public_id ? String(public_id) : null,
    type,
    title: title ? String(title) : null,
    alt: alt ? String(alt) : null,
    category: category ? String(category) : "General",
    description: description ? String(description) : null,
    tags: Array.isArray(tags) ? tags : [],
    show_on_home: show_on_home !== false,
    sort_order: typeof sort_order === "number" ? sort_order : 0,
    created_at: new Date(),
  });
  const doc = await ref.get();
  return NextResponse.json({ id: doc.id, ...doc.data() });
}

export async function PATCH(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await requireAdminRole(admin.email, ["media"]);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title ? String(body.title) : null;
  if (body.alt !== undefined) updates.alt = body.alt ? String(body.alt) : null;
  if (body.category !== undefined) updates.category = body.category ? String(body.category) : "General";
  if (body.description !== undefined) updates.description = body.description ? String(body.description) : null;
  if (body.tags !== undefined) updates.tags = Array.isArray(body.tags) ? body.tags : [];
  if (body.show_on_home !== undefined) updates.show_on_home = !!body.show_on_home;
  if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order);

  await adminDb.collection("media_assets").doc(id).update(updates);
  const doc = await adminDb.collection("media_assets").doc(id).get();
  return NextResponse.json({ id: doc.id, ...doc.data() });
}

export async function DELETE(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await requireAdminRole(admin.email, ["media"]);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await adminDb.collection("media_assets").doc(id).delete();
  return NextResponse.json({ ok: true });
}
