import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/adminAuth";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdminRole } from "@/lib/adminRoleServer";
import type { AdminRole } from "@/lib/adminRoles";

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hasFinance = await requireAdminRole(admin.email, ["finance"]);

  let financeData = null;
  if (hasFinance) {
    // get verified donations for the last 6 months
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const snap = await adminDb.collection("donations").get();
    
    let totalVerifiedAmount = 0;
    let pendingDonationsCount = 0;
    
    // Sort logic to create chronological array
    const monthKeys: string[] = [];
    const monthlyDataMap: Record<string, number> = {};
    
    // Build array from earliest to current
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(now.getMonth() - i);
      const key = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      monthKeys.push(key);
      monthlyDataMap[key] = 0;
    }

    snap.docs.forEach((doc) => {
      const data = doc.data();
      const amount = Number(data.amount) || 0;
      
      if (data.status === "verified") {
        totalVerifiedAmount += amount;
        
        // date validation for chart
        if (data.created_at && typeof data.created_at.toDate === 'function') {
          const dateDate = data.created_at.toDate();
          if (dateDate >= sixMonthsAgo) {
            const key = dateDate.toLocaleString('default', { month: 'short', year: 'numeric' });
            if (monthlyDataMap[key] !== undefined) {
              monthlyDataMap[key] += amount;
            }
          }
        }
      } else {
        pendingDonationsCount++;
      }
    });

    financeData = {
      totalVerifiedAmount,
      pendingDonationsCount,
      chartData: monthKeys.map(month => ({ month, amount: monthlyDataMap[month] }))
    };
  }

  // Find upcoming weekend dates (Saturday and Sunday)
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 is Sunday, 6 is Saturday
  
  const upcomingSaturday = new Date(today);
  upcomingSaturday.setDate(today.getDate() + ((6 - dayOfWeek + 7) % 7)); 
  if (dayOfWeek === 6) upcomingSaturday.setDate(today.getDate()); // If today is Sat, it's today
  
  const upcomingSunday = new Date(upcomingSaturday);
  upcomingSunday.setDate(upcomingSaturday.getDate() + 1);

  const formatYMD = (d: Date) => d.toISOString().split("T")[0];
  const satStr = formatYMD(upcomingSaturday);
  const sunStr = formatYMD(upcomingSunday);

  const availabilitySnap = await adminDb
    .collection("availability")
    .where("date", "in", [satStr, sunStr])
    .where("isAvailable", "==", true)
    .get();

  const weekendAvailabilityCount = availabilitySnap.size;

  return NextResponse.json({
    financeData,
    availability: {
      weekendDates: `${satStr} and ${sunStr}`,
      weekendAvailabilityCount
    }
  });
}
