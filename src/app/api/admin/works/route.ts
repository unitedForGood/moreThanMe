import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/adminAuth";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdminRole } from "@/lib/adminRoleServer";

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await requireAdminRole(admin.email, ["events"]);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const snap = await adminDb.collection("works").orderBy("date", "desc").get();
  const data = snap.docs.map((d) => {
    const doc = d.data();
    const date = doc.date;
    const media = Array.isArray(doc.media) ? doc.media : [];
    const image_url = media[0]?.url ?? doc.image_url ?? "";
    return {
      id: d.id,
      ...doc,
      image_url,
      media,
      date: date?.toDate ? date.toDate().toISOString().slice(0, 10) : (typeof date === "string" ? date.slice(0, 10) : null),
    };
  });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await requireAdminRole(admin.email, ["events"]);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { title, date, image_url, media, location, description, sort_order } = body;
  if (!title || !date) {
    return NextResponse.json({ error: "title and date required" }, { status: 400 });
  }

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return NextResponse.json({ error: "invalid date" }, { status: 400 });
  }

  const mediaList = Array.isArray(media)
    ? media
        .filter((m: { url?: string; type?: string }) => m && m.url)
        .map((m: { url: string; type?: string; featured?: boolean }) => ({
          url: String(m.url).trim(),
          type: m.type === "video" ? "video" : "image",
          featured: !!m.featured,
        }))
    : image_url
      ? [{ url: String(image_url).trim(), type: "image" as const, featured: false }]
      : [];
  const firstImage = mediaList.find((m: { type: string }) => m.type === "image")?.url ?? mediaList[0]?.url ?? "";

  const ref = await adminDb.collection("works").add({
    title: String(title).trim(),
    date: dateObj,
    image_url: firstImage,
    media: mediaList,
    location: location ? String(location).trim() : null,
    description: description ? String(description).trim() : "",
    sort_order: typeof sort_order === "number" ? sort_order : 0,
    created_at: new Date(),
  });
  const doc = await ref.get();
  const d = doc.data();
  const dateVal = d?.date;
  return NextResponse.json({
    id: doc.id,
    ...d,
    date: dateVal?.toDate ? dateVal.toDate().toISOString().slice(0, 10) : (typeof dateVal === "string" ? dateVal.slice(0, 10) : date),
  });
}

export async function PATCH(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await requireAdminRole(admin.email, ["events"]);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = String(body.title).trim();
  if (body.date !== undefined) {
    const dateObj = new Date(body.date);
    if (!isNaN(dateObj.getTime())) updates.date = dateObj;
  }
  if (body.media !== undefined) {
    const mediaList = Array.isArray(body.media)
      ? body.media
          .filter((m: { url?: string; type?: string }) => m && m.url)
          .map((m: { url: string; type?: string; featured?: boolean }) => ({
            url: String(m.url).trim(),
            type: m.type === "video" ? "video" : "image",
            featured: !!m.featured,
          }))
      : [];
    updates.media = mediaList;
    const firstImage = mediaList.find((m: { type: string }) => m.type === "image")?.url ?? mediaList[0]?.url ?? "";
    updates.image_url = firstImage;
  } else if (body.image_url !== undefined) {
    updates.image_url = body.image_url ? String(body.image_url).trim() : "";
  }
  if (body.location !== undefined) updates.location = body.location ? String(body.location).trim() : null;
  if (body.description !== undefined) updates.description = String(body.description).trim();
  if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order);

  await adminDb.collection("works").doc(id).update(updates);
  const doc = await adminDb.collection("works").doc(id).get();
  const d = doc.data();
  const dateVal = d?.date;
  return NextResponse.json({
    id: doc.id,
    ...d,
    date: dateVal?.toDate ? dateVal.toDate().toISOString().slice(0, 10) : (typeof dateVal === "string" ? dateVal.slice(0, 10) : null),
  });
}

export async function DELETE(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await requireAdminRole(admin.email, ["events"]);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await adminDb.collection("works").doc(id).delete();
  return NextResponse.json({ ok: true });
}
