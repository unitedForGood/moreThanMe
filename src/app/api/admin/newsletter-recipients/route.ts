import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/adminAuth";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdminRole } from "@/lib/adminRoleServer";

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await requireAdminRole(admin.email, ["media"]);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const snap = await adminDb.collection("newsletter_recipients").orderBy("created_at", "asc").get();
  const recipients = snap.docs.map((d) => {
    const data = d.data() as { email?: string; name?: string | null } | undefined;
    return {
      id: d.id,
      email: data?.email ?? "",
      name: data?.name ?? null,
    };
  });

  return NextResponse.json({ recipients });
}

export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await requireAdminRole(admin.email, ["media"]);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const rawEmails: unknown[] = Array.isArray(body.emails) ? body.emails : [];
  const cleanEmails = Array.from(
    new Set(
      rawEmails
        .map((e: unknown) => String(e ?? "").trim().toLowerCase())
        .filter((e: string) => e && e.includes("@"))
    )
  );

  if (cleanEmails.length === 0) {
    return NextResponse.json({ error: "No valid emails provided" }, { status: 400 });
  }

  const existingSnap = await adminDb.collection("newsletter_recipients").get();
  const existing = new Set(
    existingSnap.docs
      .map((d) => (d.data() as { email?: string }).email?.toLowerCase())
      .filter((e): e is string => !!e)
  );

  const toCreate = cleanEmails.filter((email) => !existing.has(email));
  if (toCreate.length === 0) {
    return NextResponse.json({ ok: true, created: 0 });
  }

  const batch = adminDb.batch();
  toCreate.forEach((email) => {
    const ref = adminDb.collection("newsletter_recipients").doc();
    batch.set(ref, {
      email,
      name: null,
      created_at: new Date(),
      added_by: admin.email,
    });
  });
  await batch.commit();

  return NextResponse.json({ ok: true, created: toCreate.length });
}

