"use client";

import { useState, useEffect } from "react";
import { Mail, Send, Users, ChevronDown, ChevronUp, FlaskConical, Eye, X, Search } from "lucide-react";
import { buildNewsletterEmailHtml } from "@/lib/newsletterEmail";

const TEST_EMAIL = "monu2feb2004@gmail.com";

interface Newsletter {
  id: string;
  title: string;
  description: string | null;
  category: string;
  file_path: string;
  quote?: string | null;
  created_at: string;
}

interface Volunteer {
  id: string;
  name: string | null;
  university_email: string;
  course?: string;
  batch?: string;
}

interface SavedRecipient {
  id: string;
  email: string;
  name?: string | null;
}

export default function SendNewsletterEmail() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [savedRecipients, setSavedRecipients] = useState<SavedRecipient[]>([]);
  const [selectedNewsletterId, setSelectedNewsletterId] = useState<string>("");
  const [subject, setSubject] = useState("New Newsletter from MoreThanMe");
  const [description, setDescription] = useState("");
  const [newsletterUrl, setNewsletterUrl] = useState("");
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [manualEmail, setManualEmail] = useState("");
  const [manualEmails, setManualEmails] = useState<string[]>([]);
  const [showUserList, setShowUserList] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);
  const [previewOnly, setPreviewOnly] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/newsletters-list", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/admin/volunteers-list", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/admin/newsletter-recipients", { credentials: "include" }).then((r) => r.json()).catch(() => ({})),
    ])
      .then(([newsData, volData, savedData]) => {
        setNewsletters(newsData.newsletters || []);
        setVolunteers(volData.volunteers || []);
        setSavedRecipients(savedData.recipients || []);
        setLoadingData(false);
      })
      .catch(() => setLoadingData(false));
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
      const volunteerEmails = volunteers.map((v) => v.university_email);
      const savedEmails = savedRecipients.map((r) => r.email);
      setSelectedEmails(new Set([...manualEmails, ...volunteerEmails, ...savedEmails]));
    } else {
      setSelectedEmails(new Set(manualEmails));
    }
  };

  const toggleOne = (email: string) => {
    const next = new Set(selectedEmails);
    if (next.has(email)) next.delete(email);
    else next.add(email);
    setSelectedEmails(next);
  };

  const selectedNewsletter = newsletters.find((n) => n.id === selectedNewsletterId);
  const newsletterTitle = selectedNewsletter?.title;
  const newsletterQuote = selectedNewsletter?.quote ?? undefined;

  const totalAvailableRecipients = new Set([
    ...volunteers.map((v) => v.university_email),
    ...savedRecipients.map((r) => r.email),
  ]).size;

  const searchLower = recipientSearch.trim().toLowerCase();
  const visibleSavedRecipients = searchLower
    ? savedRecipients.filter((r) => {
        const email = r.email.toLowerCase();
        const name = (r.name || "").toLowerCase();
        return email.includes(searchLower) || name.includes(searchLower);
      })
    : savedRecipients;
  const visibleVolunteers = searchLower
    ? volunteers.filter((v) => {
        const name = (v.name || "").toLowerCase();
        const email = v.university_email.toLowerCase();
        const course = (v.course || "").toLowerCase();
        const batch = (v.batch || "").toLowerCase();
        return (
          name.includes(searchLower) ||
          email.includes(searchLower) ||
          course.includes(searchLower) ||
          batch.includes(searchLower)
        );
      })
    : volunteers;

  const addManualEmail = () => {
    const raw = manualEmail.trim();
    if (!raw) return;

    const parts = raw
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    if (parts.length === 0) return;

    const currentAll = new Set([
      ...manualEmails,
      ...volunteers.map((v) => v.university_email),
      ...savedRecipients.map((r) => r.email),
    ]);

    const newValid: string[] = [];
    for (const email of parts) {
      if (!email.includes("@")) {
        continue;
      }
      if (currentAll.has(email)) {
        continue;
      }
      currentAll.add(email);
      newValid.push(email);
    }

    if (newValid.length === 0) {
      setMessage({
        type: "error",
        text: "Enter at least one new valid email (comma separated).",
      });
      return;
    }

    const nextManual = [...manualEmails, ...newValid];
    setManualEmails(nextManual);
    const nextSelected = new Set(selectedEmails);
    newValid.forEach((email) => nextSelected.add(email));
    setSelectedEmails(nextSelected);
    setManualEmail("");

    fetch("/api/admin/newsletter-recipients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ emails: newValid }),
    })
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        if (data && !data.error) {
          setSavedRecipients((prev) => {
            const existing = new Set(prev.map((r) => r.email));
            const added: SavedRecipient[] = newValid
              .filter((email) => !existing.has(email))
              .map((email) => ({ id: email, email, name: null }));
            return [...prev, ...added];
          });
        }
      })
      .catch(() => {
        // fail silently; manual emails still used for this send
      });
  };

  const removeManualEmail = (email: string) => {
    setManualEmails((prev) => prev.filter((e) => e !== email));
    const nextSelected = new Set(selectedEmails);
    nextSelected.delete(email);
    setSelectedEmails(nextSelected);
  };

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
          newsletterQuote,
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
          newsletterQuote,
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
    const html = buildNewsletterEmailHtml({
      newsletterTitle: newsletterTitle || undefined,
      newsletterDescription: description || undefined,
      newsletterUrl: newsletterUrl || undefined,
      quote: newsletterQuote,
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
              rows={4}
              placeholder="Supports **bold**, *italic*, ~~strikethrough~~, `code`, ==highlight==, lists, # headers, > quote, --- rule, [link](url)."
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
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={recipientSearch}
              onChange={(e) => setRecipientSearch(e.target.value)}
              placeholder="Search by name, email, course, batch..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
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
                  {selectedEmails.size} of {totalAvailableRecipients} emails selected
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <input
                  type="email"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="Add external emails (comma separated, not in list)"
                  className="w-full sm:w-64 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={addManualEmail}
                  disabled={!manualEmail.trim()}
                  className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add email
                </button>
                {manualEmails.length > 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    External emails: {manualEmails.length}
                  </span>
                )}
              </div>
              {manualEmails.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {manualEmails.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs text-gray-800 dark:text-gray-100"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => removeManualEmail(email)}
                        className="p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                        aria-label={`Remove ${email}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
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
                    {visibleSavedRecipients.length > 0 && (
                      <>
                        <div className="px-4 py-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/60">
                          Saved external emails ({visibleSavedRecipients.length})
                        </div>
                        {visibleSavedRecipients.map((r) => (
                          <label
                            key={`saved-${r.id}`}
                            className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedEmails.has(r.email)}
                              onChange={() => toggleOne(r.email)}
                              className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-900 dark:text-white truncate flex-1">
                              {r.name || r.email}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                              External
                            </span>
                          </label>
                        ))}
                        {visibleVolunteers.length > 0 && (
                          <div className="px-4 py-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/60">
                            Team / volunteers
                          </div>
                        )}
                      </>
                    )}
                    {visibleVolunteers.map((v) => (
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
