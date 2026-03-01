import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

/** GET: Returns only featured media for the home page gallery.
 * - Assets with show_on_home !== false
 * - Works/events media items with featured === true
 */
export async function GET() {
  try {
    const out: { src: string; alt: string; category: string; tags: string[]; description: string }[] = [];

    // Featured assets
    const assetsSnap = await adminDb.collection("media_assets").orderBy("sort_order", "asc").get();
    type AssetRow = { id: string; url?: string; show_on_home?: boolean; alt?: string; title?: string; category?: string; description?: string; tags?: string[] };
    const assets = assetsSnap.docs
      .map((d) => ({ id: d.id, ...d.data() } as AssetRow))
      .filter((a) => a.show_on_home !== false);
    const isValidUrl = (u: string) => typeof u === "string" && u.trim().length > 0 && (u.startsWith("http://") || u.startsWith("https://"));

    for (const a of assets) {
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

    // Featured media from works/events (only images for photo gallery; videos handled separately in component)
    const worksSnap = await adminDb.collection("works").orderBy("date", "desc").get();
    for (const doc of worksSnap.docs) {
      const d = doc.data();
      const title = d.title || "Event";
      const media = Array.isArray(d.media) ? d.media : [];
      for (const m of media as { url: string; type?: string; featured?: boolean }[]) {
        if (m.featured && isValidUrl(m.url)) {
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
    console.error("Gallery featured error:", e);
    return NextResponse.json([], { status: 200 });
  }
}
