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
const CONTACT_EMAIL = "morethanme@rishihood.edu.in";

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
  const senderEmail = process.env.BREVO_SENDER_EMAIL || "morethanme@rishihood.edu.in";
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

export interface NewsletterCampaignOptions {
  recipients: Array<{ email: string; name?: string }>;
  subject: string;
  htmlContent: string;
  sender?: { email: string; name: string };
}

/**
 * Get existing list ID from env or find/create 'MoreThanMe Newsletter' list in Brevo
 */
export async function getOrCreateNewsletterList(apiKey: string): Promise<{ listId?: number; error?: string }> {
  if (process.env.BREVO_NEWSLETTER_LIST_ID) {
    const envId = Number(process.env.BREVO_NEWSLETTER_LIST_ID);
    if (!isNaN(envId) && envId > 0) return { listId: envId };
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/contacts/lists?limit=50", {
      method: "GET",
      headers: { "api-key": apiKey, "Content-Type": "application/json" },
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      const existing = (data.lists || []).find((l: { name: string; id: number }) => l.name === "MoreThanMe Newsletter");
      if (existing?.id) {
        return { listId: existing.id };
      }
    }

    // Get first available folder ID
    let folderId = 1;
    const folderRes = await fetch("https://api.brevo.com/v3/contacts/folders?limit=1", {
      method: "GET",
      headers: { "api-key": apiKey, "Content-Type": "application/json" },
    });
    if (folderRes.ok) {
      const folderData = await folderRes.json().catch(() => ({}));
      if (folderData.folders && folderData.folders.length > 0) {
        folderId = folderData.folders[0].id;
      }
    }

    // Create the list
    const createRes = await fetch("https://api.brevo.com/v3/contacts/lists", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "MoreThanMe Newsletter", folderId }),
    });
    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      return { error: err.message || "Failed to create Brevo contact list" };
    }
    const createData = await createRes.json();
    return { listId: createData.id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: `Brevo list lookup error: ${msg}` };
  }
}

/**
 * Send bulk newsletter via Brevo Campaign & List APIs (no long-running HTTP loop)
 */
export async function sendNewsletterCampaign(options: NewsletterCampaignOptions): Promise<{ sent?: number; campaignId?: number; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || "morethanme@rishihood.edu.in";
  const senderName = process.env.BREVO_SENDER_NAME || "MoreThanMe";

  if (!apiKey) {
    return { error: "BREVO_API_KEY is not configured" };
  }

  const listResult = await getOrCreateNewsletterList(apiKey);
  if (listResult.error || !listResult.listId) {
    return { error: listResult.error || "Unable to determine Brevo list ID" };
  }
  const listId = listResult.listId;

  // 1. Bulk import/upsert recipients into the Brevo List
  const jsonBody = options.recipients.map((r) => ({
    email: r.email,
    attributes: r.name ? { FIRSTNAME: r.name } : undefined,
  }));

  const importRes = await fetch("https://api.brevo.com/v3/contacts/import", {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonBody,
      listIds: [listId],
      updateExistingContacts: true,
    }),
  });

  if (!importRes.ok && importRes.status !== 202) {
    const err = await importRes.json().catch(() => ({}));
    return { error: err.message || `Brevo import contacts failed: ${importRes.status}` };
  }

  // 2. Create the email campaign
  const createCampaignRes = await fetch("https://api.brevo.com/v3/emailCampaigns", {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: `Newsletter - ${new Date().toISOString().slice(0, 16)}`,
      subject: options.subject,
      sender: options.sender || { email: senderEmail, name: senderName },
      htmlContent: options.htmlContent,
      recipients: { listIds: [listId] },
    }),
  });

  if (!createCampaignRes.ok) {
    const err = await createCampaignRes.json().catch(() => ({}));
    return { error: err.message || `Brevo create campaign failed: ${createCampaignRes.status}` };
  }

  const campaignData = await createCampaignRes.json();
  const campaignId = campaignData.id;

  // 3. Trigger immediate send
  const sendRes = await fetch(`https://api.brevo.com/v3/emailCampaigns/${campaignId}/sendNow`, {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json" },
  });

  if (!sendRes.ok && sendRes.status !== 204) {
    const err = await sendRes.json().catch(() => ({}));
    return { error: err.message || `Brevo sendNow failed: ${sendRes.status}` };
  }

  return { sent: options.recipients.length, campaignId };
}
