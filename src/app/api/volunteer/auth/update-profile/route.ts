import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { adminDb } from "@/lib/firebaseAdmin";
import {
  getVolunteerFromRequest,
  findTeamMemberByEmail,
} from "@/lib/volunteerAuth";

/**
 * PUT /api/volunteer/auth/update-profile
 *
 * Authenticated endpoint. Allows volunteers to update:
 *  - phone
 *  - why_join
 *  - image_url
 *  - password (requires currentPassword)
 *
 * Name, email, role, and membership flags are NOT editable by volunteers.
 */
export async function PUT(request: Request) {
  try {
    const volunteer = await getVolunteerFromRequest(request);
    if (!volunteer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const member = await findTeamMemberByEmail(volunteer.email);
    if (!member) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { phone, why_join, image_url, currentPassword, newPassword } = body;

    // Build updates (only allowed fields)
    const updates: Record<string, unknown> = {};

    if (phone !== undefined) {
      updates.phone = phone ? String(phone).trim() : null;
    }
    if (why_join !== undefined) {
      updates.why_join = why_join ? String(why_join).trim() : null;
    }
    if (image_url !== undefined) {
      updates.image_url = image_url ? String(image_url).trim() : null;
    }

    // Password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to change your password" },
          { status: 400 }
        );
      }

      if (typeof newPassword !== "string" || newPassword.length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters" },
          { status: 400 }
        );
      }

      // Fetch current password_hash
      const snap = await adminDb
        .collection("team_members")
        .where("email", "==", member.email.toLowerCase())
        .limit(1)
        .get();

      const doc = snap.docs[0];
      if (!doc) {
        return NextResponse.json(
          { error: "Account not found" },
          { status: 404 }
        );
      }

      const data = doc.data();
      let currentHash = data.password_hash || "";

      // If no hash exists yet, default password is the email
      if (!currentHash) {
        currentHash = await bcrypt.hash(member.email.toLowerCase(), 10);
      }

      const match = await bcrypt.compare(currentPassword, currentHash);
      if (!match) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 401 }
        );
      }

      updates.password_hash = await bcrypt.hash(newPassword, 10);
      updates.has_default_password = false;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    updates.updated_at = new Date();

    await adminDb
      .collection("team_members")
      .doc(member.id)
      .update(updates);

    // Return updated profile
    const updatedMember = await findTeamMemberByEmail(volunteer.email);

    return NextResponse.json({
      ok: true,
      message: newPassword
        ? "Profile and password updated successfully"
        : "Profile updated successfully",
      volunteer: updatedMember,
    });
  } catch (e) {
    console.error("Update profile error:", e);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
