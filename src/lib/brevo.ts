/**
 * Brevo (formerly Sendinblue) email client.
 * Sender email must be verified in your Brevo account.
 * Shared branding: brand colors, website link, contact email, footer.
 */

const API_URL = "https://api.brevo.com/v3/smtp/email";

/** Brand colors (matches tailwind primary) */
export const EMAIL_BRAND = {
  primary: "#A51C30",
  primaryDark: "#8B1538",
  primaryDarker: "#742A2A",
  text: "#27272a",
  textMuted: "#52525b",
} as const;

const WEBSITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://morethanme.in";
const CONTACT_EMAIL = "morethanme.ngo@gmail.com";

/** Rule handbook URL (Team Instruction Handbook) - configurable via HANDBOOK_URL in .env.local */
export const HANDBOOK_URL =
  process.env.HANDBOOK_URL ||
  "https://drive.google.com/file/d/1VJ1ZD1xgEtfNbJYELEC037biJr_xhden/view?usp=sharing";

/** Standard footer for all emails: website link + contact email, in brand styling */
export function getEmailFooter(): string {
  return `
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #fee2e2; font-size: 13px; color: ${EMAIL_BRAND.textMuted};">
      <p style="margin: 0 0 8px 0;">
        <a href="${WEBSITE_URL}" style="color: ${EMAIL_BRAND.primary}; font-weight: 600; text-decoration: none;">Visit our website</a>
        &nbsp;·&nbsp;
        <a href="mailto:${CONTACT_EMAIL}" style="color: ${EMAIL_BRAND.primary}; font-weight: 600; text-decoration: none;">${CONTACT_EMAIL}</a>
      </p>
      <p style="margin: 0; font-size: 12px;">MoreThanMe — Hearts for India</p>
    </div>
  `;
}

/** Wrap body HTML in a consistent container and append the standard footer */
export function wrapEmailContent(bodyHtml: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: ${EMAIL_BRAND.text};">
      ${bodyHtml}
      ${getEmailFooter()}
    </div>
  `;
}

export interface SendEmailOptions {
  to: Array<{ email: string; name?: string }>;
  subject: string;
  htmlContent: string;
  sender?: { email: string; name: string };
}

export async function sendEmail(options: SendEmailOptions): Promise<{ messageId?: string; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || "unitedforgood2025@gmail.com";
  const senderName = process.env.BREVO_SENDER_NAME || "MoreThanMe";

  if (!apiKey) {
    return { error: "BREVO_API_KEY is not configured" };
  }

  const body = {
    sender: options.sender || { email: senderEmail, name: senderName },
    to: options.to,
    subject: options.subject,
    htmlContent: options.htmlContent,
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { error: err.message || `Brevo API error: ${res.status}` };
  }

  const data = await res.json().catch(() => ({}));
  return { messageId: data.messageId };
}
