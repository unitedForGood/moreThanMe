import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/adminAuth";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdminRole } from "@/lib/adminRoleServer";
import { sendEmail, wrapEmailContent, EMAIL_BRAND } from "@/lib/brevo";

export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await requireAdminRole(admin.email, ["super"]);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { memberIds, time, venue } = body;

  if (!time || !venue) {
    return NextResponse.json({ error: "Time and venue are required." }, { status: 400 });
  }

  let query = adminDb.collection("team_members").where("approval_status", "==", "pending");
  const snap = await query.get();
  let pendingMembers = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));

  // If specific member IDs are provided, filter the list
  if (Array.isArray(memberIds) && memberIds.length > 0) {
    pendingMembers = pendingMembers.filter(m => memberIds.includes(m.id));
  }

  if (pendingMembers.length === 0) {
    return NextResponse.json({ error: "No pending members found to send emails to." }, { status: 404 });
  }

  let sentCount = 0;
  let errorCount = 0;

  let firstError = "";

  for (const member of pendingMembers) {
    const targetEmail = member.email || member.university_email;
    if (!targetEmail) {
      errorCount++;
      continue;
    }

    const name = member.name || "Volunteer";
    const emailHtml = `
      <h2 style="color: ${EMAIL_BRAND.primary}; margin-top: 0;">Welcome to MoreThanMe, ${name}!</h2>
      <p>Thank you for expressing your interest in joining the <strong>MoreThanMe</strong> team. We are thrilled to see your passion for our cause and would love to get to know you better!</p>
      
      <p>Before we officially bring you on board, we would like to invite you for a brief onboarding and introductory discussion.</p>
      
      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <h3 style="margin-top: 0; color: ${EMAIL_BRAND.primaryDark}; font-size: 16px;">Meeting Details</h3>
        <p style="margin: 0 0 8px 0;"><strong>Date & Time:</strong> ${time}</p>
        <p style="margin: 0;"><strong>Venue / Link:</strong> ${venue}</p>
      </div>
      
      <p>Please make sure to join on time. If you have any scheduling conflicts, feel free to reply directly to this email so we can accommodate you.</p>
      
      <p>We look forward to meeting you and exploring how we can make a difference together!</p>
      
      <p style="margin-top: 24px;">Warm regards,<br/><strong>The MoreThanMe Team</strong></p>
    `;

    try {
      const result = await sendEmail({
        to: [{ email: targetEmail, name: name }],
        subject: "Invitation: MoreThanMe Onboarding Discussion 🌟",
        htmlContent: wrapEmailContent(emailHtml),
      });
      if (result.error) {
        console.error(`Failed to send onboarding email to ${targetEmail}:`, result.error);
        if (!firstError) firstError = result.error;
        errorCount++;
      } else {
        sentCount++;
      }
    } catch (err: any) {
      console.error(`Failed to send onboarding email to ${targetEmail}:`, err);
      if (!firstError) firstError = err.message || "Unknown error";
      errorCount++;
    }
  }

  if (sentCount === 0 && errorCount > 0) {
    return NextResponse.json({ error: firstError || "Failed to send emails. Check your Brevo API key and sender email." }, { status: 500 });
  }

  return NextResponse.json({ success: true, sent: sentCount, errors: errorCount });
}
