"use client";

import { useState, useEffect } from "react";
import { Mail, Send, Users, ChevronDown, ChevronUp, FlaskConical, Eye, X } from "lucide-react";

const TEST_EMAIL = "monu2feb2004@gmail.com";

function buildNewsletterHtml(opts: {
  newsletterTitle?: string;
  newsletterDescription?: string;
  newsletterUrl?: string;
}) {
  const { newsletterTitle, newsletterDescription, newsletterUrl } = opts;
  const desc = newsletterDescription ? `<p>${newsletterDescription}</p>` : "";
  return `<!DOCTYPE html>
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
}

interface Newsletter {
  id: string;
  title: string;
  description: string | null;
  category: string;
  file_path: string;
  created_at: string;
}

interface Volunteer {
  id: string;
  name: string | null;
  university_email: string;
  course?: string;
  batch?: string;
}

export default function SendNewsletterEmail() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [selectedNewsletterId, setSelectedNewsletterId] = useState<string>("");
  const [subject, setSubject] = useState("New Newsletter from More Than Me");
  const [description, setDescription] = useState("");
  const [newsletterUrl, setNewsletterUrl] = useState("");
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [showUserList, setShowUserList] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);
  const [previewOnly, setPreviewOnly] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/newsletters-list", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/admin/volunteers-list", { credentials: "include" }).then((r) => r.json()),
    ]).then(([newsData, volData]) => {
      setNewsletters(newsData.newsletters || []);
      setVolunteers(volData.volunteers || []);
      setLoadingData(false);
    }).catch(() => setLoadingData(false));
  }, []);

  useEffect(() => {
    if (selectedNewsletterId && newsletters.length) {
      const n = newsletters.find((x) => x.id === selectedNewsletterId);
      if (n) {
        setSubject(`New: ${n.title}`);
        setDescription(n.description || "");
        // Auto-fill link if file_path is a full URL (e.g. Cloudinary)
        if (n.file_path?.startsWith("http://") || n.file_path?.startsWith("https://")) {
          setNewsletterUrl(n.file_path);
        }
      }
    }
  }, [selectedNewsletterId, newsletters]);

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmails(new Set(volunteers.map((v) => v.university_email)));
    } else {
      setSelectedEmails(new Set());
    }
  };

  const toggleOne = (email: string) => {
    const next = new Set(selectedEmails);
    if (next.has(email)) next.delete(email);
    else next.add(email);
    setSelectedEmails(next);
  };

  const newsletterTitle = newsletters.find((n) => n.id === selectedNewsletterId)?.title;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmails.size === 0) {
      setMessage({ type: "error", text: "Select at least one recipient." });
      return;
    }
    setLoading(true);
    setMessage(null);
    setPreview(null);
    try {
      const res = await fetch("/api/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          subject,
          newsletterId: selectedNewsletterId || undefined,
          newsletterTitle,
          newsletterDescription: description || undefined,
          newsletterUrl: newsletterUrl || undefined,
          recipients: Array.from(selectedEmails),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to send" });
        return;
      }
      setMessage({ type: "success", text: `Email sent to ${data.sent || 0} recipients.` });
    } catch {
      setMessage({ type: "error", text: "Request failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleTestSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestLoading(true);
    setMessage(null);
    setPreview(null);
    try {
      const res = await fetch("/api/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          subject,
          newsletterId: selectedNewsletterId || undefined,
          newsletterTitle,
          newsletterDescription: description || undefined,
          newsletterUrl: newsletterUrl || undefined,
          recipients: [],
          testMode: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to send test" });
        return;
      }
      setMessage({
        type: "success",
        text: `Test email sent to ${TEST_EMAIL}. Check your inbox.`,
      });
      if (data.preview) setPreview(data.preview);
    } catch {
      setMessage({ type: "error", text: "Test send request failed" });
    } finally {
      setTestLoading(false);
    }
  };

  const showPreviewOnly = () => {
    const html = buildNewsletterHtml({
      newsletterTitle: newsletterTitle || undefined,
      newsletterDescription: description || undefined,
      newsletterUrl: newsletterUrl || undefined,
    });
    setPreview({ subject, html });
    setPreviewOnly(true);
  };

  if (loadingData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
        <Mail className="w-5 h-5 text-primary-600" />
        Send newsletter notification
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Create your newsletter, select recipients from existing users, then send.
      </p>

      <form onSubmit={handleSend} className="space-y-6">
        {/* Step 1: Newsletter details */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">1. Newsletter</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select newsletter (optional)
            </label>
            <select
              value={selectedNewsletterId}
              onChange={(e) => setSelectedNewsletterId(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">— Create new or type manually —</option>
              {newsletters.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title} ({n.category})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Brief description for the email body"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link to newsletter (optional)</label>
            <input
              type="url"
              value={newsletterUrl}
              onChange={(e) => setNewsletterUrl(e.target.value)}
              placeholder="https://yoursite.com/newsletters"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Step 2: Select recipients */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4" />
            2. Select recipients
          </h4>
          {volunteers.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No volunteers with email found.</p>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => toggleAll(true)}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() => toggleAll(false)}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
                >
                  Deselect all
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedEmails.size} of {volunteers.length} selected
                </span>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => setShowUserList(!showUserList)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 text-left text-sm font-medium text-gray-900 dark:text-white"
                >
                  {showUserList ? "Hide list" : "Show recipients"}
                  {showUserList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showUserList && (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {volunteers.map((v) => (
                      <label
                        key={v.id}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedEmails.has(v.university_email)}
                          onChange={() => toggleOne(v.university_email)}
                          className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-900 dark:text-white truncate flex-1">
                          {v.name || "—"} · {v.university_email}
                        </span>
                        {(v.course || v.batch) && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                            {v.course} {v.batch}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {message && (
          <div
            className={`rounded-lg p-3 text-sm ${
              message.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200"
                : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading || testLoading || volunteers.length === 0 || selectedEmails.size === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {loading ? "Sending..." : `Send to ${selectedEmails.size} selected`}
          </button>
          <button
            type="button"
            onClick={handleTestSend}
            disabled={loading || testLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title={`Sends only to ${TEST_EMAIL} for testing`}
          >
            <FlaskConical className="w-4 h-4" />
            {testLoading ? "Sending test..." : "Send test email"}
          </button>
          <button
            type="button"
            onClick={showPreviewOnly}
            disabled={loading || testLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
        </div>

        {preview && (
          <div className="mt-6 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {previewOnly ? "Email preview (not sent)" : "Test message preview"}
              </span>
              <button
                type="button"
                onClick={() => { setPreview(null); setPreviewOnly(false); }}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400"
                aria-label="Close preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Subject</span>
                <p className="text-gray-900 dark:text-white font-medium mt-0.5">{preview.subject}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Body</span>
                <iframe
                  title="Email preview"
                  srcDoc={preview.html}
                  className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white min-h-[280px] overflow-y-auto"
                  style={{ height: "320px" }}
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
