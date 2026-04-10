import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getVolunteerFromRequest } from "@/lib/volunteerAuth";

/**
 * POST /api/volunteer/availability
 * Body: { date: "YYYY-MM-DD", isAvailable: boolean, reason?: string }
 *
 * Mark or update volunteer availability for a specific date.
 * Constraint: if changing from available→not available, reason is REQUIRED.
 */
export async function POST(request: Request) {
  try {
    const volunteer = await getVolunteerFromRequest(request);
    if (!volunteer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { date, isAvailable, reason } = body;

    // Validate date format
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Valid date in YYYY-MM-DD format is required" },
        { status: 400 }
      );
    }

    if (typeof isAvailable !== "boolean") {
      return NextResponse.json(
        { error: "isAvailable must be a boolean" },
        { status: 400 }
      );
    }

    // Don't allow marking dates in the past.
    // Today's date remains available until 6:00 PM local time.
    const [year, month, day] = date.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const isToday =
      dateObj.getFullYear() === today.getFullYear() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getDate() === today.getDate();
    const isTodayBeforeCutoff = isToday && today.getHours() < 18;

    if (dateObj < startOfToday || (isToday && !isTodayBeforeCutoff)) {
      return NextResponse.json(
        {
          error:
            isToday && !isTodayBeforeCutoff
              ? "Today's availability closes at 6:00 PM"
              : "Cannot mark availability for past dates",
        },
        { status: 400 }
      );
    }

    // Compound document ID: memberId_YYYY-MM-DD
    const docId = `${volunteer.memberId}_${date}`;
    const docRef = adminDb.collection("availability").doc(docId);
    const existingDoc = await docRef.get();

    // Constraint: if switching from available → not available, reason is required
    if (existingDoc.exists) {
      const existingData = existingDoc.data();
      if (existingData?.isAvailable === true && isAvailable === false) {
        if (!reason || !String(reason).trim()) {
          return NextResponse.json(
            {
              error:
                "Reason is required when changing from available to not available",
            },
            { status: 400 }
          );
        }
      }
    }

    const now = new Date();
    const payload = {
      memberId: volunteer.memberId,
      date,
      isAvailable,
      reason: isAvailable ? null : reason ? String(reason).trim() : null,
      updatedAt: now,
      ...(existingDoc.exists ? {} : { createdAt: now }),
    };

    await docRef.set(payload, { merge: true });

    return NextResponse.json({ ok: true, availability: payload });
  } catch (e) {
    console.error("Availability POST error:", e);
    return NextResponse.json(
      { error: "Failed to update availability" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/volunteer/availability?month=2026-04
 *
 * Get current volunteer's availability records for a given month.
 */
export async function GET(request: Request) {
  try {
    const volunteer = await getVolunteerFromRequest(request);
    if (!volunteer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // e.g., "2026-04"

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: "month query parameter required (YYYY-MM)" },
        { status: 400 }
      );
    }

    const snap = await adminDb
      .collection("availability")
      .where("memberId", "==", volunteer.memberId)
      .get();

    const records = snap.docs
      .map((d) => {
        const data = d.data() as {
          date?: string;
          updatedAt?: unknown;
          createdAt?: unknown;
          [key: string]: unknown;
        };

        return {
          id: d.id,
          ...data,
          updatedAt:
            // Firestore timestamp values expose toDate()
            (data.updatedAt as { toDate?: () => Date })?.toDate?.()
              ? (data.updatedAt as { toDate: () => Date }).toDate().toISOString()
              : data.updatedAt,
          createdAt:
            (data.createdAt as { toDate?: () => Date })?.toDate?.()
              ? (data.createdAt as { toDate: () => Date }).toDate().toISOString()
              : data.createdAt,
        };
      })
      .filter((record) => String(record.date || "").startsWith(`${month}-`));

    return NextResponse.json({ records });
  } catch (e) {
    console.error("Availability GET error:", e);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}
