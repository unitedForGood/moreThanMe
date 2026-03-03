import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/adminAuth";
import { adminDb } from "@/lib/firebaseAdmin";
import type { AdminRole } from "@/lib/adminRoles";
import { requireAdminRole } from "@/lib/adminRoleServer";

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await requireAdminRole(admin.email, ["super"]);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden. Super admin only." }, { status: 403 });
  }

  const snap = await adminDb.collection("admin_users").orderBy("created_at", "desc").get();
  const admins = snap.docs.map((d) => {
    const data = d.data() as {
      email?: string;
      created_at?: { toDate?: () => Date } | string;
      role?: AdminRole;
    };
    return {
      id: d.id,
      email: data.email,
      role: data.role ?? null,
      created_at: data.created_at && typeof (data.created_at as any).toDate === "function"
        ? (data.created_at as any).toDate().toISOString()
        : (data.created_at as string | undefined),
    };
  });
  return NextResponse.json({ admins });
}
