import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/adminAuth";
import { sendEmail } from "@/lib/brevo";

export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { subject, htmlContent, newsletterId, newsletterTitle, newsletterUrl, newsletterDescription, recipients, testMode } = body;

  const TEST_EMAIL = "monu2feb2004@gmail.com";

  const isTest = testMode === true;
  const effectiveRecipients = isTest ? [TEST_EMAIL] : recipients;

  if (!effectiveRecipients || !Array.isArray(effectiveRecipients) || effectiveRecipients.length === 0) {
    return NextResponse.json(
      { error: isTest ? "Test mode requires no recipient selection" : "Select at least one recipient" },
      { status: 400 }
    );
  }

  const validEmails = effectiveRecipients.filter((e: unknown) => typeof e === "string" && e.includes("@"));
  if (validEmails.length === 0) {
    return NextResponse.json(
      { error: "No valid recipient emails" },
      { status: 400 }
    );
  }

  const finalSubject = subject || "New Newsletter from More Than Me";
  const desc = newsletterDescription ? `<p>${newsletterDescription}</p>` : "";
  const finalHtml =
    htmlContent ||
    `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #A51C30;">More Than Me</h2>
  <p>Hello!</p>
  <p>${newsletterTitle ? `We've published a new newsletter: <strong>${newsletterTitle}</strong>.` : "A new newsletter has been published."}</p>
  ${desc}
  ${newsletterUrl ? `<p><a href="${newsletterUrl}" style="color: #A51C30; font-weight: bold;">Read the newsletter →</a></p>` : ""}
  <p>Thank you for being part of our community.</p>
  <p style="color: #666; font-size: 12px; margin-top: 40px;">— More Than Me · Rishihood University</p>
</body>
</html>`;

  const recipientsList = validEmails.map((email: string) => ({ email, name: undefined }));

  const BATCH_SIZE = 50;
  let sent = 0;
  for (let i = 0; i < recipientsList.length; i += BATCH_SIZE) {
    const batch = recipientsList.slice(i, i + BATCH_SIZE);
    const result = await sendEmail({
      to: batch,
      subject: finalSubject,
      htmlContent: finalHtml,
    });
    if (result.error) {
      return NextResponse.json(
        { error: result.error, sent: i > 0 ? i : undefined },
        { status: 500 }
      );
    }
    sent += batch.length;
  }

  if (!isTest) {
    try {
      const { adminDb } = await import("@/lib/firebaseAdmin");
      await adminDb.collection("newsletter_sends").add({
        newsletter_id: body.newsletterId || null,
        subject: finalSubject,
        html_content: finalHtml,
        recipient_count: sent,
        recipient_emails: validEmails,
        sent_by: admin.email,
        sent_at: new Date(),
      });
    } catch (logErr) {
      console.error("Newsletter send log error:", logErr);
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    ...(isTest && { testMode: true, preview: { subject: finalSubject, html: finalHtml } }),
  });
}
