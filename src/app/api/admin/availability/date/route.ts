import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getAdminFromRequest } from "@/lib/adminAuth";

interface AvailabilityUser {
  memberId: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  is_founding_member: boolean;
  is_core_member: boolean;
  image_url: string | null;
  isAvailable: boolean;
  reason: string | null;
  updatedAt: string | null;
}

/**
 * GET /api/admin/availability/date?date=2026-04-12&role=Volunteer
 *
 * Admin: Get detailed availability for a specific date.
 * Returns:
 *  - available: users who are available
 *  - cancellations: users who changed from available → not available (with reason)
 */
export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const roleFilter = searchParams.get("role"); // optional: "Volunteer" | "Core" | "Founding"
  const sortBy = searchParams.get("sort") || "name"; // "name" | "role"

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "date query parameter required (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  try {
    // Fetch all availability records for this date
    const availSnap = await adminDb
      .collection("availability")
      .where("date", "==", date)
      .get();

    // Collect unique member IDs
    const memberIds = new Set<string>();
    const availMap: Record<
      string,
      { isAvailable: boolean; reason: string | null; updatedAt: string | null }
    > = {};

    availSnap.docs.forEach((doc) => {
      const data = doc.data();
      memberIds.add(data.memberId);
      availMap[data.memberId] = {
        isAvailable: data.isAvailable,
        reason: data.reason || null,
        updatedAt: data.updatedAt?.toDate?.()
          ? data.updatedAt.toDate().toISOString()
          : data.updatedAt || null,
      };
    });

    // Batch fetch member profiles
    const memberProfiles: Record<
      string,
      {
        name: string;
        email: string;
        phone: string | null;
        role: string;
        is_founding_member: boolean;
        is_core_member: boolean;
        image_url: string | null;
      }
    > = {};

    if (memberIds.size > 0) {
      // Firestore 'in' query supports max 30 items at a time
      const idArray = Array.from(memberIds);
      const chunks: string[][] = [];
      for (let i = 0; i < idArray.length; i += 30) {
        chunks.push(idArray.slice(i, i + 30));
      }

      for (const chunk of chunks) {
        // Get docs by ID
        const refs = chunk.map((id) =>
          adminDb.collection("team_members").doc(id)
        );
        const docs = await adminDb.getAll(...refs);
        docs.forEach((doc) => {
          if (doc.exists) {
            const d = doc.data()!;
            memberProfiles[doc.id] = {
              name: d.name || "",
              email: d.email || "",
              phone: d.phone || null,
              role: d.role || "Volunteer",
              is_founding_member: !!d.is_founding_member,
              is_core_member: !!d.is_core_member,
              image_url: d.image_url || null,
            };
          }
        });
      }
    }

    // Build response lists
    const available: AvailabilityUser[] = [];
    const cancellations: AvailabilityUser[] = [];

    Object.entries(availMap).forEach(([memberId, avail]) => {
      const profile = memberProfiles[memberId];
      if (!profile) return;

      // Apply role filter
      if (roleFilter) {
        if (roleFilter === "Founding" && !profile.is_founding_member) return;
        if (roleFilter === "Core" && !profile.is_core_member) return;
        if (
          roleFilter === "Volunteer" &&
          (profile.is_founding_member || profile.is_core_member)
        )
          return;
      }

      const user: AvailabilityUser = {
        memberId,
        ...profile,
        isAvailable: avail.isAvailable,
        reason: avail.reason,
        updatedAt: avail.updatedAt,
      };

      if (avail.isAvailable) {
        available.push(user);
      } else {
        // Show in cancellations if they have a reason (meaning they were previously available)
        if (avail.reason) {
          cancellations.push(user);
        }
      }
    });

    // Sort
    const sortFn = (a: AvailabilityUser, b: AvailabilityUser) => {
      if (sortBy === "role") {
        const roleOrder = (u: AvailabilityUser) => {
          if (u.is_founding_member) return 0;
          if (u.is_core_member) return 1;
          return 2;
        };
        const diff = roleOrder(a) - roleOrder(b);
        if (diff !== 0) return diff;
      }
      return (a.name || "").localeCompare(b.name || "");
    };

    available.sort(sortFn);
    cancellations.sort(sortFn);

    return NextResponse.json({
      date,
      availableCount: available.length,
      cancellationCount: cancellations.length,
      available,
      cancellations,
    });
  } catch (e) {
    console.error("Admin availability date GET error:", e);
    return NextResponse.json(
      { error: "Failed to fetch date details" },
      { status: 500 }
    );
  }
}
