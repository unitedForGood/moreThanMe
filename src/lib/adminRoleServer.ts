import type { AdminRole } from "./adminRoles";
import { adminDb } from "./firebaseAdmin";

export async function getRoleForAdminEmail(email: string): Promise<AdminRole | AdminRole[]> {
  if (!email) return null;

  const snap = await adminDb
    .collection("admin_users")
    .where("email", "==", email.toLowerCase())
    .limit(1)
    .get();

  const doc = snap.docs[0];
  if (!doc) {
    // Fallback: treat configured SUPER_ADMIN_EMAIL as super even if not in collection
    const superEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
    if (superEmail && email.toLowerCase() === superEmail) {
      return "super";
    }
    return null;
  }

  const data = doc.data() as { role?: AdminRole | AdminRole[]; email?: string } | undefined;
  const role = data?.role ?? null;

  // Check if it's "super" even if stored as an array
  const roles = Array.isArray(role) ? role : [role];
  if (roles.includes("super")) return "super";

  // Also treat any row whose email matches SUPER_ADMIN_EMAIL as super
  const superEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  if (superEmail && data && typeof data.email === "string" && data.email.toLowerCase() === superEmail) {
    return "super";
  }

  return role;
}

export async function requireAdminRole(
  email: string,
  allowedRoles: AdminRole[]
): Promise<boolean> {
  const role = await getRoleForAdminEmail(email);
  const roles = Array.isArray(role) ? role : [role];

  if (roles.includes("super")) return true;

  // Check if any of the user's roles are in the allowedRoles list
  return roles.some(r => allowedRoles.includes(r as AdminRole));
}


