import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/adminAuth";
import { adminDb } from "@/lib/firebaseAdmin";

function serializeSendDoc(doc: { id: string; data: () => Record<string, unknown> | undefined }) {
  const data = doc.data();
  if (!data) return null;
  const out: Record<string, unknown> = { id: doc.id, ...data };
  const sentAt = data.sent_at as { toDate?: () => Date } | undefined;
  if (sentAt && typeof sentAt.toDate === "function") {
    out.sent_at = sentAt.toDate().toISOString();
  }
  return out;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing send id" }, { status: 400 });

  const sendRef = adminDb.collection("newsletter_sends").doc(id);
  const sendSnap = await sendRef.get();
  if (!sendSnap.exists) {
    return NextResponse.json({ error: "Send not found" }, { status: 404 });
  }

  const send = serializeSendDoc(sendSnap) as Record<string, unknown> & { newsletter_id?: string | null };
  const newsletterId = send?.newsletter_id;

  let newsletter = null;
  if (newsletterId) {
    const newsletterSnap = await adminDb.collection("newsletters").doc(newsletterId).get();
    if (newsletterSnap.exists) {
      const nd = newsletterSnap.data();
      newsletter = {
        id: newsletterSnap.id,
        ...nd,
        created_at: nd?.created_at && typeof (nd as { created_at: { toDate?: () => Date } }).created_at?.toDate === "function"
          ? (nd as { created_at: { toDate: () => Date } }).created_at.toDate().toISOString()
          : nd?.created_at,
      };
    }
  }

  return NextResponse.json({ send, newsletter });
}
