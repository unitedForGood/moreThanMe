import { NextResponse } from "next/server";
import { uploadFile } from "@/lib/cloudinary";

/** Allowed folder for public uploads (e.g. Join Us profile photos). No auth required. */
const PUBLIC_UPLOAD_FOLDER = "morethanme/team";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) || PUBLIC_UPLOAD_FOLDER;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Restrict to allowed folder and images only (no PDFs/videos via public endpoint)
  if (folder !== PUBLIC_UPLOAD_FOLDER) {
    return NextResponse.json({ error: "Invalid folder for public upload" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = buffer.toString("base64");
  const mimeType = file.type || "application/octet-stream";
  const dataUri = `data:${mimeType};base64,${base64}`;

  const result = await uploadFile(dataUri, {
    folder: PUBLIC_UPLOAD_FOLDER,
    resource_type: "image",
  });

  if (!result) {
    return NextResponse.json({ error: "Upload failed. Check Cloudinary config." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    url: result.secure_url,
    public_id: result.public_id,
  });
}
