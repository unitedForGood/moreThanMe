import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/adminAuth";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdminRole } from "@/lib/adminRoleServer";

export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await requireAdminRole(admin.email, ["finance"]);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json();
    const { donations } = body;

    if (!Array.isArray(donations)) {
      return NextResponse.json({ error: "Expected an array of donations" }, { status: 400 });
    }

    let importedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    // Process sequentially to easily handle checking for duplicates
    for (const item of donations) {
      const { name, amount, transaction_id, phone, message, status, date } = item;

      if (!name || amount == null || !transaction_id) {
        errors.push(`Row missing required fields: ${JSON.stringify(item)}`);
        skippedCount++;
        continue;
      }

      const existing = await adminDb
        .collection("donations")
        .where("transaction_id", "==", String(transaction_id))
        .limit(1)
        .get();

      if (!existing.empty) {
        skippedCount++;
        continue; // Skip duplicate
      }

      const finalStatus = typeof status === "string" && status ? status : "pending_verification";
      
      let createdAt = new Date();
      if (date) {
        const parsedDate = new Date(date);
        if (!Number.isNaN(parsedDate.getTime())) {
          createdAt = parsedDate;
        }
      }

      await adminDb.collection("donations").add({
        name: String(name),
        amount: Number(amount),
        transaction_id: String(transaction_id),
        phone: phone ? String(phone) : null,
        message: message ? String(message) : null,
        status: finalStatus,
        verified_at: finalStatus === "verified" ? createdAt : null,
        created_at: createdAt,
        created_manually: true,
        created_by: admin.email,
        is_bulk_import: true,
      });

      importedCount++;
    }

    return NextResponse.json({ 
      success: true, 
      imported: importedCount, 
      skipped: skippedCount,
      errors: errors.length > 0 ? errors : undefined 
    });
  } catch (error: any) {
    console.error("Bulk upload error:", error);
    return NextResponse.json({ error: "Internal server error during bulk upload" }, { status: 500 });
  }
}
