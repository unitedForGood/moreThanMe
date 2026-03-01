import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

/** GET: Returns all gallery media for the /gallery page.
 * - All assets from media_assets
 * - All media from all works/events (flattened)
 */
export async function GET() {
  try {
    const out: { src: string; alt: string; category: string; tags: string[]; description: string }[] = [];
    const isValidUrl = (u: string) => typeof u === "string" && u.trim().length > 0 && (u.startsWith("http://") || u.startsWith("https://"));

    // All assets
    const assetsSnap = await adminDb.collection("media_assets").orderBy("sort_order", "asc").get();
    for (const d of assetsSnap.docs) {
      const a = d.data() as { url?: string; alt?: string; title?: string; category?: string; description?: string; tags?: string[] };
      if (isValidUrl(a.url || "")) {
        out.push({
          src: (a.url as string).trim(),
          alt: a.alt || a.title || "Gallery",
          category: a.category || "General",
          tags: Array.isArray(a.tags) ? a.tags : [],
          description: a.description || "",
        });
      }
    }

    // All media from works/events
    const worksSnap = await adminDb.collection("works").orderBy("date", "desc").get();
    for (const doc of worksSnap.docs) {
      const d = doc.data();
      const title = d.title || "Event";
      const media = Array.isArray(d.media) ? d.media : [];
      for (const m of media as { url: string; type?: string }[]) {
        if (isValidUrl(m.url)) {
          out.push({
            src: m.url.trim(),
            alt: title,
            category: "Events",
            tags: [title],
            description: title,
          });
        }
      }
    }

    return NextResponse.json(out);
  } catch (e) {
    console.error("Gallery all error:", e);
    return NextResponse.json([], { status: 200 });
  }
}
