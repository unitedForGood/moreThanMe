import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, category, file_path, quote } = body;

    if (!title || !category) {
      return NextResponse.json({ error: "Missing required fields: title, category" }, { status: 400 });
    }

    const ref = await adminDb.collection("newsletters").add({
      title,
      description: description || null,
      category,
      file_path: file_path || null,
      quote: quote && String(quote).trim() ? String(quote).trim() : null,
      created_at: new Date(),
    });
    const doc = await ref.get();
    return NextResponse.json({ id: doc.id, ...doc.data() }, { status: 201 });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

