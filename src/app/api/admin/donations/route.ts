import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/adminAuth";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdminRole } from "@/lib/adminRoleServer";

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await requireAdminRole(admin.email, ["finance"]);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const snap = await adminDb.collection("donations").orderBy("created_at", "desc").limit(200).get();
  const donations = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json(donations);
}

export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await requireAdminRole(admin.email, ["finance"]);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { name, amount, transaction_id, phone, message, status } = body;

  if (!name || amount == null || !transaction_id) {
    return NextResponse.json({ error: "name, amount, and transaction_id are required" }, { status: 400 });
  }

  const existing = await adminDb
    .collection("donations")
    .where("transaction_id", "==", String(transaction_id))
    .limit(1)
    .get();
  if (!existing.empty) {
    return NextResponse.json({ error: "Transaction ID already exists" }, { status: 409 });
  }

  const finalStatus = typeof status === "string" && status ? status : "pending_verification";

  const ref = await adminDb.collection("donations").add({
    name: String(name),
    amount: Number(amount),
    transaction_id: String(transaction_id),
    phone: phone ? String(phone) : null,
    message: message ? String(message) : null,
    status: finalStatus,
    verified_at: finalStatus === "verified" ? new Date() : null,
    created_at: new Date(),
    created_manually: true,
    created_by: admin.email,
  });
  const doc = await ref.get();
  return NextResponse.json({ id: doc.id, ...doc.data() }, { status: 201 });
}

export async function PATCH(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await requireAdminRole(admin.email, ["finance"]);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { id, status, name, amount, transaction_id, phone, message } = body;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (status !== undefined) {
    updates.status = status || "pending";
    updates.verified_at = status === "verified" ? new Date() : null;
  }
  if (name !== undefined) updates.name = String(name);
  if (amount !== undefined) updates.amount = Number(amount);
  if (phone !== undefined) updates.phone = phone ? String(phone) : null;
  if (message !== undefined) updates.message = message ? String(message) : null;

  if (transaction_id !== undefined) {
    const newTx = String(transaction_id);
    if (!newTx) {
      return NextResponse.json({ error: "transaction_id cannot be empty" }, { status: 400 });
    }

    const existing = await adminDb
      .collection("donations")
      .where("transaction_id", "==", newTx)
      .limit(1)
      .get();
    if (!existing.empty && existing.docs[0].id !== id) {
      return NextResponse.json({ error: "Another donation already uses this transaction_id" }, { status: 409 });
    }
    updates.transaction_id = newTx;
  }

  if (Object.keys(updates).length === 0) {
    const current = await adminDb.collection("donations").doc(id).get();
    if (!current.exists) return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    return NextResponse.json({ id: current.id, ...current.data() });
  }

  await adminDb.collection("donations").doc(id).update(updates);
  const doc = await adminDb.collection("donations").doc(id).get();
  return NextResponse.json({ id: doc.id, ...doc.data() });
}

export async function DELETE(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await requireAdminRole(admin.email, ["finance"]);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const doc = await adminDb.collection("donations").doc(id).get();
  if (!doc.exists) {
    return NextResponse.json({ error: "Donation not found" }, { status: 404 });
  }

  await adminDb.collection("donations").doc(id).delete();
  return NextResponse.json({ ok: true });
}

