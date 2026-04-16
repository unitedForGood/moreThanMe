import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { sendEmail, wrapEmailContent, EMAIL_BRAND, HANDBOOK_URL } from "@/lib/brevo";

const DEFAULT_ROLE = "Volunteer";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { name, email, phone, enrollment, batch, course, why_join, image_url } = body;
    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }
    const emailTrimmed = String(email).trim();
    const nameTrimmed = String(name).trim();

    const existing = await adminDb
      .collection("team_members")
      .where("email", "==", emailTrimmed)
      .limit(1)
      .get();
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
      phone: phone ? String(phone).trim() : null,
      enrollment: enrollment ? String(enrollment).trim() : null,
      batch: batch || null,
      course: course || null,
      why_join: why_join ? String(why_join).trim() : null,
      image_url: image_url ? String(image_url).trim() : null,
      role: DEFAULT_ROLE,
      sort_order: nextSortOrder,
      is_founding_member: false,
      is_core_member: false,
      approval_status: "pending",
      created_at: new Date(),
    });

    // Send thank you email (non-blocking; don't fail registration if email fails)
    const thankYouBody = `
      <h2 style="color: ${EMAIL_BRAND.primary}; margin-top: 0;">Thank you for joining us, ${nameTrimmed}!</h2>
      <p>We're thrilled to welcome you to <strong>MoreThanMe</strong> — our student-led initiative giving back to India.</p>
      <p>Your commitment to creating positive change means a lot to us. Together, we can make a real difference—one act of kindness at a time.</p>
      <p><strong>Important:</strong> Please read our <a href="${HANDBOOK_URL}" style="color: ${EMAIL_BRAND.primary}; font-weight: 600;">Team Instruction Handbook</a> — it contains all necessary policies and guidelines that all volunteers must follow.</p>
      <p>Stay tuned for updates on upcoming initiatives, events, and ways to get involved.</p>
      <p>For any query or doubt, please reply to this email or contact us at <a href="mailto:morethanme.ngo@gmail.com" style="color: ${EMAIL_BRAND.primary}; font-weight: 600;">morethanme.ngo@gmail.com</a>.</p>
      <p style="margin-top: 24px;">With gratitude,<br/><strong>The MoreThanMe Team</strong></p>
    `;
    sendEmail({
      to: [{ email: emailTrimmed, name: nameTrimmed }],
      subject: "Thank you for joining MoreThanMe! 🎉",
      htmlContent: wrapEmailContent(thankYouBody),
    }).catch((err) => console.error("Join thank-you email failed:", err));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Join error:", e);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
