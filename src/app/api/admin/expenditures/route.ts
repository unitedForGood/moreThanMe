import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/adminAuth";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdminRole } from "@/lib/adminRoleServer";

function toDateString(d: unknown): string | null {
  if (!d) return null;
  if (typeof d === "string") return d.slice(0, 10);
  if (d && typeof d === "object" && "toDate" in d && typeof (d as { toDate: () => Date }).toDate === "function")
    return (d as { toDate: () => Date }).toDate().toISOString().slice(0, 10);
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return null;
}

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await requireAdminRole(admin.email, ["finance"]);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const snap = await adminDb.collection("expenditures").orderBy("date", "desc").get();
  const data = snap.docs.map((d) => {
    const doc = d.data();
    return { id: d.id, ...doc, date: toDateString(doc.date) ?? doc.date };
  });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await requireAdminRole(admin.email, ["finance"]);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { amount, reason, date } = body;
  if (reason == null || reason === "" || amount == null || date == null) {
    return NextResponse.json({ error: "amount, reason and date required" }, { status: 400 });
  }
  const amountNum = Number(amount);
  if (isNaN(amountNum) || amountNum < 0) {
    return NextResponse.json({ error: "amount must be a non-negative number" }, { status: 400 });
  }
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return NextResponse.json({ error: "invalid date" }, { status: 400 });
  }

  const ref = await adminDb.collection("expenditures").add({
    amount: amountNum,
    reason: String(reason).trim(),
    date: dateObj,
    created_at: new Date(),
  });
  const doc = await ref.get();
  const d = doc.data();
  return NextResponse.json({ id: doc.id, ...d, date: toDateString(d?.date) ?? d?.date });
}

export async function PATCH(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await requireAdminRole(admin.email, ["finance"]);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const updates: Record<string, unknown> = {};
  if (body.amount !== undefined) {
    const n = Number(body.amount);
    if (!isNaN(n) && n >= 0) updates.amount = n;
  }
  if (body.reason !== undefined) updates.reason = String(body.reason).trim();
  if (body.date !== undefined) {
    const dateObj = new Date(body.date);
    if (!isNaN(dateObj.getTime())) updates.date = dateObj;
  }

  if (Object.keys(updates).length === 0) {
    const doc = await adminDb.collection("expenditures").doc(id).get();
    const d = doc.data();
    return NextResponse.json({ id: doc.id, ...d, date: toDateString(d?.date) ?? d?.date });
  }
  await adminDb.collection("expenditures").doc(id).update(updates);
  const doc = await adminDb.collection("expenditures").doc(id).get();
  const d = doc.data();
  return NextResponse.json({ id: doc.id, ...d, date: toDateString(d?.date) ?? d?.date });
}

export async function DELETE(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await requireAdminRole(admin.email, ["finance"]);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await adminDb.collection("expenditures").doc(id).delete();
  return NextResponse.json({ ok: true });
}
