import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/adminAuth";
import { adminDb } from "@/lib/firebaseAdmin";

function toISO(data: Record<string, unknown>, key: string) {
  const v = data[key] as { toDate?: () => Date } | undefined;
  if (v && typeof v.toDate === "function") return v.toDate().toISOString();
  return data[key];
}

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snap = await adminDb.collection("newsletter_sends").orderBy("sent_at", "desc").limit(50).get();
  const sends = snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    const out: Record<string, unknown> = { id: d.id, ...data };
    out.sent_at = toISO(data, "sent_at") ?? data.sent_at;
    return out;
  });
  return NextResponse.json({ sends });
}
