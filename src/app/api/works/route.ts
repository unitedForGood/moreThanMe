import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function GET() {
  const snap = await adminDb.collection("works").orderBy("date", "desc").get();
  const data = snap.docs.map((d) => {
    const doc = d.data();
    const dateVal = doc.date;
    const dateStr =
      dateVal?.toDate ? dateVal.toDate().toISOString().slice(0, 10) : typeof dateVal === "string" ? dateVal.slice(0, 10) : null;
    const media = Array.isArray(doc.media) ? doc.media : doc.image_url ? [{ url: doc.image_url, type: "image" }] : [];
    const image_url = media[0]?.url ?? doc.image_url ?? "";
    return { id: d.id, ...doc, image_url, media, date: dateStr ?? dateVal };
  });
  return NextResponse.json(data);
}
