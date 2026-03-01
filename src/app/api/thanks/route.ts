import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { sendEmail, wrapEmailContent, EMAIL_BRAND } from "@/lib/brevo";

const TEAM_EMAIL_FALLBACK = "morethanme.ngo@gmail.com";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { name, message } = body;

  const nameVal = name ? String(name).trim() : null;
  const messageVal = message ? String(message).trim() : null;

  await adminDb.collection("thanks_submissions").add({
    name: nameVal,
    message: messageVal,
    created_at: new Date(),
  });

  // Notify team by email (non-blocking; don't fail the request if email fails)
  (async () => {
    const contactDoc = await adminDb.collection("site_settings").doc("contact_email").get();
    const toEmail = (contactDoc.data()?.value as string)?.trim() || TEAM_EMAIL_FALLBACK;
    const html = wrapEmailContent(`
      <h2 style="color: ${EMAIL_BRAND.primary}; margin: 0 0 16px 0;">Someone said thanks</h2>
      <p style="margin: 0 0 8px 0; color: ${EMAIL_BRAND.text};">
        A visitor used the &ldquo;Thanks MoreThanMe team&rdquo; section on the Contact page.
      </p>
      ${nameVal ? `<p style="margin: 0 0 4px 0;"><strong>Name:</strong> ${escapeHtml(nameVal)}</p>` : ""}
      ${messageVal ? `<p style="margin: 0 0 8px 0;"><strong>Message:</strong></p><p style="margin: 0; white-space: pre-wrap;">${escapeHtml(messageVal)}</p>` : "<p style=\"margin: 0;\"><em>No name or message provided.</em></p>"}
    `);
    await sendEmail({
      to: [{ email: toEmail }],
      subject: "MoreThanMe — Someone said thanks",
      htmlContent: html,
    });
  })().catch((err) => console.error("Thanks notification email failed:", err));

  return NextResponse.json({ ok: true });
}
