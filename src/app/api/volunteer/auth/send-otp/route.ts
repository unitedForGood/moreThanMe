import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { findTeamMemberByEmail } from "@/lib/volunteerAuth";
import { sendEmail, wrapEmailContent, EMAIL_BRAND } from "@/lib/brevo";

/**
 * POST /api/volunteer/auth/send-otp
 * Body: { email: string }
 *
 * Validates the email exists in team_members, generates a 6-digit OTP,
 * stores it in Firestore, and sends it via Brevo.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = (body.email || "").trim();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if this email belongs to a team member
    const member = await findTeamMemberByEmail(email);
    if (!member) {
      return NextResponse.json(
        { error: "No volunteer account found with this email. Please make sure you use the same email you registered with." },
        { status: 404 }
      );
    }

    // Rate limit: max 5 OTPs per email in the last hour.
    // Query by email only to avoid requiring a composite Firestore index.
    const oneHourAgoMs = Date.now() - 60 * 60 * 1000;
    const allOtpsForEmail = await adminDb
      .collection("volunteer_otps")
      .where("email", "==", email.toLowerCase())
      .get();

    const recentCount = allOtpsForEmail.docs.reduce((count, doc) => {
      const createdAt = doc.get("createdAt") as
        | Date
        | { toDate?: () => Date }
        | string
        | number
        | null
        | undefined;

      let createdAtMs = 0;
      if (createdAt instanceof Date) createdAtMs = createdAt.getTime();
      else if (typeof createdAt === "number") createdAtMs = createdAt;
      else if (typeof createdAt === "string") createdAtMs = new Date(createdAt).getTime();
      else if (createdAt && typeof createdAt.toDate === "function") createdAtMs = createdAt.toDate().getTime();

      return Number.isFinite(createdAtMs) && createdAtMs >= oneHourAgoMs ? count + 1 : count;
    }, 0);

    if (recentCount >= 5) {
      return NextResponse.json(
        { error: "Too many OTP requests. Please try again later." },
        { status: 429 }
      );
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    // Store OTP in Firestore (expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await adminDb.collection("volunteer_otps").add({
      email: email.toLowerCase(),
      otp,
      expiresAt,
      used: false,
      createdAt: new Date(),
    });

    // Send OTP via email
    const htmlContent = `
      <h2 style="color: ${EMAIL_BRAND.primary}; margin-top: 0;">Your Login Code</h2>
      <p>Hi <strong>${member.name}</strong>,</p>
      <p>Use this code to log in to your MoreThanMe Volunteer Portal:</p>
      <div style="text-align: center; margin: 24px 0;">
        <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: ${EMAIL_BRAND.primary}; background: #fef2f2; padding: 16px 32px; border-radius: 12px; display: inline-block;">
          ${otp}
        </span>
      </div>
      <p style="color: #6b7280; font-size: 14px;">This code expires in 10 minutes. If you didn't request this, please ignore this email.</p>
      <p style="margin-top: 24px;">With gratitude,<br/><strong>The MoreThanMe Team</strong></p>
    `;

    sendEmail({
      to: [{ email: email.toLowerCase(), name: member.name }],
      subject: "Your MoreThanMe Login Code",
      htmlContent: wrapEmailContent(htmlContent),
    }).catch((err) => console.error("OTP email send failed:", err));

    return NextResponse.json({
      ok: true,
      message: "OTP sent to your email",
      // Don't expose the OTP in production — for debugging only
      ...(process.env.NODE_ENV === "development" ? { _debugOtp: otp } : {}),
    });
  } catch (e) {
    console.error("Send OTP error:", e);
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}
