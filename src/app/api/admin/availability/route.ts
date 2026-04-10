import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getAdminFromRequest } from "@/lib/adminAuth";

/**
 * GET /api/admin/availability?month=2026-04
 *
 * Admin: Get monthly availability overview.
 * Returns per-date summary with available count.
 */
export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json(
      { error: "month query parameter required (YYYY-MM)" },
      { status: 400 }
    );
  }

  try {
    const startDate = `${month}-01`;
    const [year, mon] = month.split("-").map(Number);
    const lastDay = new Date(year, mon, 0).getDate();
    const endDate = `${month}-${String(lastDay).padStart(2, "0")}`;

    // Fetch all availability records for this month
    const snap = await adminDb
      .collection("availability")
      .where("date", ">=", startDate)
      .where("date", "<=", endDate)
      .get();

    // Get total non-donor team members count
    const teamSnap = await adminDb.collection("team_members").get();
    const totalMembers = teamSnap.size;

    // Aggregate per date
    const dateMap: Record<
      string,
      { availableCount: number; totalRecords: number }
    > = {};

    for (let d = 1; d <= lastDay; d++) {
      const dateStr = `${month}-${String(d).padStart(2, "0")}`;
      dateMap[dateStr] = { availableCount: 0, totalRecords: 0 };
    }

    snap.docs.forEach((doc) => {
      const data = doc.data();
      const dateStr = data.date;
      if (dateMap[dateStr]) {
        dateMap[dateStr].totalRecords++;
        if (data.isAvailable) {
          dateMap[dateStr].availableCount++;
        }
      }
    });

    const summary = Object.entries(dateMap).map(([date, counts]) => ({
      date,
      availableCount: counts.availableCount,
      totalMembers,
    }));

    return NextResponse.json({ summary, totalMembers });
  } catch (e) {
    console.error("Admin availability GET error:", e);
    return NextResponse.json(
      { error: "Failed to fetch availability data" },
      { status: 500 }
    );
  }
}
