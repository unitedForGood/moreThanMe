import { NextResponse } from "next/server";
import * as jose from "jose";
import { adminDb } from "@/lib/firebaseAdmin";
import { findTeamMemberByEmail } from "@/lib/volunteerAuth";

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = "volunteer_token";

/**
 * POST /api/volunteer/auth/verify-otp
 * Body: { email: string, otp: string }
 *
 * Verifies the OTP, issues a JWT, and sets the volunteer_token cookie.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = (body.email || "").trim().toLowerCase();
    const otp = (body.otp || "").trim();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    // Find valid OTP using an index-free query (email only), then filter in code.
    const now = new Date();
    const otpSnap = await adminDb
      .collection("volunteer_otps")
      .where("email", "==", email)
      .get();

    const candidates = otpSnap.docs
      .filter((doc) => {
        const data = doc.data();
        return data.otp === otp && data.used === false;
      })
      .sort((a, b) => {
        const aRaw = a.get("createdAt") as
          | Date
          | { toDate?: () => Date }
          | string
          | number
          | null
          | undefined;
        const bRaw = b.get("createdAt") as
          | Date
          | { toDate?: () => Date }
          | string
          | number
          | null
          | undefined;

        const toMs = (
          value:
            | Date
            | { toDate?: () => Date }
            | string
            | number
            | null
            | undefined
        ) => {
          if (value instanceof Date) return value.getTime();
          if (typeof value === "number") return value;
          if (typeof value === "string") return new Date(value).getTime();
          if (value && typeof value.toDate === "function") return value.toDate().getTime();
          return 0;
        };

        return toMs(bRaw) - toMs(aRaw);
      });

    if (!candidates.length) {
      return NextResponse.json(
        { error: "Invalid or expired OTP. Please request a new one." },
        { status: 401 }
      );
    }

    const otpDoc = candidates[0];
    const otpData = otpDoc.data();

    // Check expiry
    const expiresAt = otpData.expiresAt?.toDate
      ? otpData.expiresAt.toDate()
      : new Date(otpData.expiresAt);
    if (expiresAt < now) {
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 401 }
      );
    }

    // Mark OTP as used
    await adminDb
      .collection("volunteer_otps")
      .doc(otpDoc.id)
      .update({ used: true });

    // Find the team member
    const member = await findTeamMemberByEmail(email);
    if (!member) {
      return NextResponse.json(
        { error: "Volunteer account not found" },
        { status: 404 }
      );
    }

    // Issue JWT
    if (!JWT_SECRET) {
      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 }
      );
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const token = await new jose.SignJWT({
      email: member.email,
      name: member.name,
      type: "volunteer",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(member.id)
      .setExpirationTime("7d")
      .sign(secret);

    const res = NextResponse.json({
      ok: true,
      volunteer: {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        is_founding_member: member.is_founding_member,
        is_core_member: member.is_core_member,
      },
    });

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return res;
  } catch (e) {
    console.error("Verify OTP error:", e);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
