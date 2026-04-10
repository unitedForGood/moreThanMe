import { NextResponse } from "next/server";
import { getVolunteerFromRequest, findTeamMemberByEmail } from "@/lib/volunteerAuth";

/**
 * GET /api/volunteer/auth/me
 * Returns the current volunteer's profile if authenticated.
 */
export async function GET(request: Request) {
  try {
    const volunteer = await getVolunteerFromRequest(request);
    if (!volunteer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const member = await findTeamMemberByEmail(volunteer.email);
    if (!member) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      volunteer: {
        id: member.id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        role: member.role,
        is_founding_member: member.is_founding_member,
        is_core_member: member.is_core_member,
        image_url: member.image_url,
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
