import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import * as jose from "jose";
import { adminDb } from "@/lib/firebaseAdmin";
import { findTeamMemberByEmail } from "@/lib/volunteerAuth";

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = "volunteer_token";

/**
 * POST /api/volunteer/auth/login
 * Body: { email: string, password: string }
 *
 * Validates email + password. On first login the default password equals
 * the volunteer's email address — a bcrypt hash is created lazily.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = (body.email || "").trim().toLowerCase();
    const password = (body.password || "").trim();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find volunteer in team_members
    const member = await findTeamMemberByEmail(email);
    if (!member) {
      return NextResponse.json(
        {
          error:
            "No volunteer account found with this email. Please make sure you use the same email you registered with.",
        },
        { status: 404 }
      );
    }

    // Fetch the raw Firestore doc to check password_hash
    const snap = await adminDb
      .collection("team_members")
      .where("email", "==", email)
      .limit(1)
      .get();

    let doc = snap.docs[0];
    if (!doc) {
      // Try original casing
      const snapAlt = await adminDb
        .collection("team_members")
        .where("email", "==", (body.email || "").trim())
        .limit(1)
        .get();
      doc = snapAlt.docs[0];
    }

    if (!doc) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    const data = doc.data();
    const approvalStatus = data.approval_status;

    if (approvalStatus === "pending") {
      return NextResponse.json(
        { error: "Your account is currently pending approval by an admin. We'll be in touch soon!" },
        { status: 403 }
      );
    } else if (approvalStatus === "rejected") {
      return NextResponse.json(
        { error: "Your volunteer application was not approved." },
        { status: 403 }
      );
    }

    let passwordHash: string = data.password_hash || "";

    // Lazy migration: if no password_hash exists yet, the default password
    // is the volunteer's email. Hash it and save.
    if (!passwordHash) {
      const defaultPassword = data.email.toLowerCase();
      passwordHash = await bcrypt.hash(defaultPassword, 10);
      await adminDb
        .collection("team_members")
        .doc(doc.id)
        .update({ password_hash: passwordHash, has_default_password: true });
    }

    // Verify password
    const match = await bcrypt.compare(password, passwordHash);
    if (!match) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
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
    console.error("Volunteer login error:", e);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
