import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

const DEFAULT_ROLE = "Volunteer";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { name, universityEmail, enrollment, batch, course, phone, message } = body;
    if (!name || !universityEmail) {
      return NextResponse.json({ error: "Name and email required" }, { status: 400 });
    }
    const emailTrimmed = String(universityEmail).trim().toLowerCase();
    const nameTrimmed = String(name).trim();

    const existing = await adminDb.collection("team_members").where("email", "==", emailTrimmed).limit(1).get();
    if (!existing.empty) {
      return NextResponse.json({ error: "already_registered" }, { status: 409 });
    }

    const lastByOrder = await adminDb
      .collection("team_members")
      .orderBy("sort_order", "desc")
      .limit(1)
      .get();
    const nextSortOrder = lastByOrder.empty ? 0 : (lastByOrder.docs[0].data().sort_order ?? 0) + 1;

    await adminDb.collection("team_members").add({
      name: nameTrimmed,
      email: emailTrimmed,
      enrollment: enrollment ? String(enrollment).trim() : null,
      batch: batch || null,
      course: course || null,
      phone: phone ? String(phone).trim() : null,
      why_join: message ? String(message).trim() : null,
      role: DEFAULT_ROLE,
      sort_order: nextSortOrder,
      is_founding_member: false,
      is_core_member: false,
      approval_status: "pending",
      created_at: new Date(),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Volunteer join error:", e);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
