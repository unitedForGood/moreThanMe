/**
 * Shared newsletter email HTML builder.
 * Used for both sending (API) and preview (admin UI).
 * Designed to connect emotionally with readers and support fundraising.
 * Description supports Markdown: bold, italic, strikethrough, code, highlight,
 * lists, links, headers, blockquotes, horizontal rules.
 */

import { marked } from "marked";

const BRAND = {
  primary: "#A51C30",
  primaryDark: "#8B1538",
  text: "#27272a",
  textMuted: "#52525b",
  quoteBg: "#fef2f2",
} as const;

/** Website URL for links (safe to use on client via NEXT_PUBLIC_SITE_URL) */
export const NEWSLETTER_WEBSITE_URL =
  typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SITE_URL
    ? process.env.NEXT_PUBLIC_SITE_URL
    : "https://morethanme.ngo";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br>");
}

/** Allowed HTML tags for description (safe subset after markdown) */
const ALLOWED_TAG_NAMES = new Set([
  "p", "strong", "b", "em", "i", "ul", "ol", "li", "br", "a", "mark", "code", "del",
  "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "hr",
]);

/** Strip any tag not in the allow list; keep <a> but only href attribute for links */
function sanitizeDescriptionHtml(html: string): string {
  return html.replace(/<\/?([a-z][a-z0-9]*)(\s[^>]*)?\/?>/gi, (match, name, attrs = "") => {
    const tag = name.toLowerCase();
    if (!ALLOWED_TAG_NAMES.has(tag)) return "";
    if (tag === "a") {
      const hrefMatch = /href\s*=\s*["']([^"']*)["']/i.exec(attrs);
      const href = hrefMatch ? hrefMatch[1] : "#";
      return match.startsWith("</") ? "</a>" : `<a href="${escapeHtml(href)}">`;
    }
    return match.startsWith("</") ? `</${tag}>` : `<${tag}>`;
  });
}

const HIGHLIGHT_PLACEHOLDER = "\u200B\u200B\u200B"; // zero-width, won't affect markdown

/**
 * Converts description to HTML: Markdown (bold, italic, lists, links) + ==highlight==.
 * Result is sanitized to a safe tag set.
 */
function descriptionToHtml(description: string): string {
  const trimmed = description.trim();
  if (!trimmed) return "";

  // Support ==highlight==: wrap in placeholder so marked doesn't touch it
  let pre = trimmed.replace(/==([^=]+)==/g, `${HIGHLIGHT_PLACEHOLDER}$1${HIGHLIGHT_PLACEHOLDER}`);

  marked.setOptions({ gfm: true, breaks: true });
  let html = marked(pre, { async: false }) as string;

  // Restore highlight as <mark>
  html = html.replace(
    new RegExp(`${HIGHLIGHT_PLACEHOLDER}([\\s\\S]*?)${HIGHLIGHT_PLACEHOLDER}`, "g"),
    "<mark>$1</mark>"
  );

  let out = sanitizeDescriptionHtml(html);
  // Add email-friendly inline styles for blockquote, code, hr
  out = out.replace(
    /<blockquote(\s[^>]*)?>/gi,
    `<blockquote style="margin: 1em 0; padding-left: 1em; border-left: 3px solid ${BRAND.primary}; color: ${BRAND.textMuted};">`
  );
  out = out.replace(
    /<code(\s[^>]*)?>/gi,
    '<code style="background: #f1f5f9; padding: 0.2em 0.4em; border-radius: 4px; font-size: 0.9em;">'
  );
  out = out.replace(
    /<hr(\s[^>]*)?\/?>/gi,
    '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 1em 0;">'
  );
  return out;
}

export interface NewsletterEmailOptions {
  newsletterTitle?: string;
  newsletterDescription?: string;
  newsletterUrl?: string;
  /** Optional quote (admin-editable). When set, shown in the email; when empty, quote block is hidden. */
  quote?: string;
  /** Optional footer HTML (e.g. from getEmailFooter()) - used when sending via API */
  footerHtml?: string;
}

/**
 * Builds the full newsletter email HTML: quote, student-led messaging,
 * description, CTA, thanks, and website link.
 */
export function buildNewsletterEmailHtml(opts: NewsletterEmailOptions): string {
  const { newsletterTitle, newsletterDescription, newsletterUrl, quote, footerHtml } = opts;
  const descriptionHtml = newsletterDescription
    ? descriptionToHtml(newsletterDescription)
    : "";
  const safeQuote = quote ? escapeHtml(quote).trim() : "";
  const displayTitle = newsletterTitle?.trim() || "our latest update";
  const hasNewsletterLink = Boolean(newsletterUrl?.trim());

  const quoteBlock = safeQuote
    ? `
  <blockquote style="margin: 20px 0; padding: 16px 20px; background: ${BRAND.quoteBg}; border-left: 4px solid ${BRAND.primary}; border-radius: 0 8px 8px 0; font-style: italic; color: ${BRAND.text};">
    &ldquo;${safeQuote}&rdquo;
  </blockquote>`
    : "";

  const descriptionBlock = descriptionHtml
    ? `
  <div style="background: ${BRAND.quoteBg}; border-left: 4px solid ${BRAND.primary}; padding: 16px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
    <div style="color: ${BRAND.text}; font-size: 15px; line-height: 1.6;">${descriptionHtml}</div>
  </div>`
    : "";

  const ctaBlock = hasNewsletterLink
    ? `
  <p style="margin: 24px 0 20px 0;">
    <a href="${escapeHtml(newsletterUrl!.trim())}" style="display: inline-block; background: ${BRAND.primary}; color: #fff !important; padding: 12px 24px; border-radius: 8px; font-weight: 600; text-decoration: none;">Read the newsletter →</a>
  </p>`
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: ${BRAND.text}; font-size: 16px; line-height: 1.5;">
  <div style="margin-bottom: 8px;">
    <h1 style="color: ${BRAND.primary}; margin: 0; font-size: 24px; font-weight: 700;">MoreThanMe</h1>
    <p style="margin: 4px 0 0 0; font-size: 13px; color: ${BRAND.textMuted}; font-weight: 500;">A student-led community · Hearts for India</p>
  </div>

  <p style="margin: 24px 0 16px 0;">Hello!</p>
  ${quoteBlock}

  <p style="margin: 16px 0 8px 0;">We&rsquo;ve published a new newsletter: <strong>${escapeHtml(displayTitle)}</strong>.</p>
  ${descriptionBlock}
  ${ctaBlock}

  <p style="margin: 28px 0 16px 0; padding: 16px; background: #f8fafc; border-radius: 8px; font-size: 14px; color: ${BRAND.text};">
    <strong>Your support matters.</strong> Every contribution helps us reach more people through MoreThanMe. Together we can do more than any one of us alone.
  </p>

  <p style="margin: 24px 0 8px 0;">Thank you for being part of our community. Your belief in what we do keeps us going.</p>
  <p style="margin: 0 0 24px 0;">With gratitude,<br><strong>The MoreThanMe Team</strong></p>

  <p style="margin: 24px 0 16px 0; font-size: 14px;">
    <a href="${NEWSLETTER_WEBSITE_URL}" style="color: ${BRAND.primary}; font-weight: 600; text-decoration: none;">Visit our website →</a>
  </p>

  <p>for any query or doubt, please reply to this email or contact us at <a href="mailto:morethanme.ngo@gmail.com" style="color: ${BRAND.primary}; font-weight: 600;">morethanme.ngo@gmail.com</a>.</p>

  <p style="color: ${BRAND.textMuted}; font-size: 12px; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
    — MoreThanMe · Rishihood University <span style="color: ${BRAND.primary};">&</span> Newton School of Technology
  </p>
  ${footerHtml ?? ""}
</body>
</html>`;
}
