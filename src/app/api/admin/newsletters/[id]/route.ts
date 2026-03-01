import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/adminAuth";
import { adminDb } from "@/lib/firebaseAdmin";

function serializeDoc(doc: { id: string; data: () => Record<string, unknown> | undefined }) {
  const data = doc.data();
  if (!data) return null;
  const out: Record<string, unknown> = { id: doc.id, ...data };
  const created = data.created_at as { toDate?: () => Date } | undefined;
  if (created && typeof created.toDate === "function") {
    out.created_at = created.toDate().toISOString();
  }
  return out;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromRequest(_request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing newsletter id" }, { status: 400 });

  const ref = adminDb.collection("newsletters").doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Newsletter not found" }, { status: 404 });
  }

  const newsletter = serializeDoc(snap);
  return NextResponse.json({ newsletter });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing newsletter id" }, { status: 400 });

  const ref = adminDb.collection("newsletters").doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Newsletter not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const { title, description, category, file_path } = body;

  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = String(title).trim();
  if (description !== undefined) updates.description = description === "" ? null : String(description).trim();
  if (category !== undefined) updates.category = String(category).trim();
  if (file_path !== undefined) updates.file_path = String(file_path).trim();

  if (Object.keys(updates).length === 0) {
    const current = serializeDoc(snap);
    return NextResponse.json({ newsletter: current });
  }

  if (updates.title !== undefined && !(updates.title as string)) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (updates.category !== undefined && !(updates.category as string)) {
    return NextResponse.json({ error: "Category is required" }, { status: 400 });
  }

  await ref.update(updates);
  const updated = await ref.get();
  const newsletter = serializeDoc(updated);
  return NextResponse.json({ newsletter });
}
