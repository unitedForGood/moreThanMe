import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/adminAuth";
import { adminDb } from "@/lib/firebaseAdmin";

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snap = await adminDb.collection("team_members").orderBy("created_at", "desc").get();
  const volunteers = snap.docs
    .filter((d) => d.data().email)
    .map((d) => {
      const data = d.data();
      return { id: d.id, ...data, name: data.name, university_email: data.email, course: data.course, batch: data.batch };
    });
  return NextResponse.json({ volunteers });
}
