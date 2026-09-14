import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function GET() {
  const snap = await adminDb.collection("team_members").orderBy("sort_order", "asc").get();
  const data = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((m: any) => m.approval_status === "approved" || !m.approval_status);
  return NextResponse.json(data);
}
