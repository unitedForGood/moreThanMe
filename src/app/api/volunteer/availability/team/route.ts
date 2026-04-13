import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getVolunteerFromRequest } from "@/lib/volunteerAuth";

/**
 * GET /api/volunteer/availability/team?month=2026-04
 *
 * Volunteer view: Returns per-date available-volunteer count for the month.
 *
 * GET /api/volunteer/availability/team?date=2026-04-18
 *
 * Volunteer view: Returns list of available volunteers for a specific date (names + photos only, no cancellations).
 */
export async function GET(request: Request) {
  const volunteer = await getVolunteerFromRequest(request);
  if (!volunteer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const date = searchParams.get("date");

  try {
    // ── Per-date detail (date=YYYY-MM-DD) ──
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const snap = await adminDb
        .collection("availability")
        .where("date", "==", date)
        .get();

      const memberIds = snap.docs
        .filter((d) => d.data().isAvailable === true)
        .map((d) => d.data().memberId as string);

      if (memberIds.length === 0) {
        return NextResponse.json({ date, available: [], count: 0 });
      }

      // Fetch member profiles in chunks of 30 (Firestore limit)
      const profiles: {
        name: string;
        image_url: string | null;
        is_founding_member: boolean;
        is_core_member: boolean;
        role: string;
      }[] = [];

      for (let i = 0; i < memberIds.length; i += 30) {
        const chunk = memberIds.slice(i, i + 30);
        const refs = chunk.map((id) =>
          adminDb.collection("team_members").doc(id)
        );
        const docs = await adminDb.getAll(...refs);
        docs.forEach((doc) => {
          if (doc.exists) {
            const d = doc.data()!;
            profiles.push({
              name: d.name || "",
              image_url: d.image_url || null,
              is_founding_member: !!d.is_founding_member,
              is_core_member: !!d.is_core_member,
              role: d.role || "Volunteer",
            });
          }
        });
      }

      // Sort: founding first, then core, then volunteer, then alphabetical
      profiles.sort((a, b) => {
        const order = (p: typeof a) =>
          p.is_founding_member ? 0 : p.is_core_member ? 1 : 2;
        const diff = order(a) - order(b);
        if (diff !== 0) return diff;
        return a.name.localeCompare(b.name);
      });

      return NextResponse.json({
        date,
        available: profiles,
        count: profiles.length,
      });
    }

    // ── Monthly summary (month=YYYY-MM) ──
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: "month or date parameter required" },
        { status: 400 }
      );
    }

    const startDate = `${month}-01`;
    const [year, mon] = month.split("-").map(Number);
    const lastDay = new Date(year, mon, 0).getDate();
    const endDate = `${month}-${String(lastDay).padStart(2, "0")}`;

    const snap = await adminDb
      .collection("availability")
      .where("date", ">=", startDate)
      .where("date", "<=", endDate)
      .get();

    // Count available volunteers per date
    const countMap: Record<string, number> = {};
    snap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.isAvailable !== true) return;
      const d = data.date as string;
      countMap[d] = (countMap[d] || 0) + 1;
    });

    return NextResponse.json({ month, counts: countMap });
  } catch (e) {
    console.error("Volunteer team availability GET error:", e);
    return NextResponse.json(
      { error: "Failed to fetch team availability" },
      { status: 500 }
    );
  }
}
