import { cookies } from "next/headers";
import * as jose from "jose";
import { adminDb } from "./firebaseAdmin";

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = "volunteer_token";

export interface VolunteerProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  is_founding_member: boolean;
  is_core_member: boolean;
  image_url: string | null;
}

/**
 * Extract volunteer identity from JWT cookie or Authorization header.
 * Returns null if not authenticated.
 */
export async function getVolunteerFromRequest(
  request: Request
): Promise<{ memberId: string; email: string } | null> {
  const cookieStore = await cookies();
  const token =
    cookieStore.get(COOKIE_NAME)?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token || !JWT_SECRET) return null;

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    const email = payload.email as string;
    const memberId = payload.sub as string;
    return email && memberId ? { memberId, email } : null;
  } catch {
    return null;
  }
}

/**
 * Look up a team member by email. Only returns non-donor members
 * (Volunteers, Core, Founding).
 */
export async function findTeamMemberByEmail(
  email: string
): Promise<VolunteerProfile | null> {
  const snap = await adminDb
    .collection("team_members")
    .where("email", "==", email.trim().toLowerCase())
    .limit(1)
    .get();

  if (snap.empty) {
    // Also try case-insensitive (email stored as entered)
    const snapAlt = await adminDb
      .collection("team_members")
      .where("email", "==", email.trim())
      .limit(1)
      .get();
    if (snapAlt.empty) return null;
    const doc = snapAlt.docs[0];
    const d = doc.data();
    return mapDocToProfile(doc.id, d);
  }

  const doc = snap.docs[0];
  const d = doc.data();
  return mapDocToProfile(doc.id, d);
}

function mapDocToProfile(
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  d: Record<string, any>
): VolunteerProfile {
  return {
    id,
    name: d.name || "",
    email: d.email || "",
    phone: d.phone || null,
    role: d.role || "Volunteer",
    is_founding_member: !!d.is_founding_member,
    is_core_member: !!d.is_core_member,
    image_url: d.image_url || null,
  };
}

/**
 * Get volunteer's display role label.
 */
export function getVolunteerRoleLabel(profile: VolunteerProfile): string {
  const tags: string[] = [];
  if (profile.is_founding_member) tags.push("Founding");
  if (profile.is_core_member) tags.push("Core");
  if (!tags.length) tags.push(profile.role || "Volunteer");
  return tags.join(" · ");
}
