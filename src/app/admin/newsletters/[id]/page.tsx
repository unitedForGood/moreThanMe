"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Calendar, Save, Trash2 } from "lucide-react";
import CloudinaryUpload from "@/components/CloudinaryUpload";
import NewsletterFormattingReference from "@/components/newsletters/NewsletterFormattingReference";
import { buildNewsletterEmailHtml } from "@/lib/newsletterEmail";

const PREDEFINED_CATEGORIES = ["monthly", "weekly", "annual", "special-edition"];

interface NewsletterData {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  file_path: string;
  quote?: string | null;
  created_at: string;
}

function buildEmailPreview(opts: {
  title: string;
  description: string;
  category: string;
  file_path: string;
  quote: string;
}) {
  const { title, description, file_path, quote } = opts;
  const newsletterUrl = file_path?.startsWith("http") ? file_path : undefined;
  return buildNewsletterEmailHtml({
    newsletterTitle: title || undefined,
    newsletterDescription: description || undefined,
    newsletterUrl,
    quote: quote || undefined,
  });
}

export default function AdminNewsletterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [newsletter, setNewsletter] = useState<NewsletterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "monthly",
    file_path: "",
    quote: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [uploadKey, setUploadKey] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let mounted = true;
    params.then((p) => {
      if (!mounted) return;
      setId(p.id);
    });
    return () => {
      mounted = false;
    };
  }, [params]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetch(`/api/admin/newsletters/${id}`, { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 404 ? "Newsletter not found" : "Failed to load");
        return r.json();
      })
      .then((data) => {
        const n = data.newsletter as NewsletterData;
        setNewsletter(n);
        setFormData({
          title: n.title || "",
          description: n.description || "",
          category: n.category || "monthly",
          file_path: n.file_path || "",
          quote: n.quote || "",
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/newsletters/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to update" });
        return;
      }
      setMessage({ type: "success", text: "Newsletter updated successfully." });
      if (data.newsletter) setNewsletter(data.newsletter);
    } catch {
      setMessage({ type: "error", text: "Request failed" });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (s: string) =>
    new Date(s).toLocaleString("en-IN", { dateStyle: "medium" });
  const emailPreviewHtml = buildEmailPreview(formData);

  const handleDelete = async () => {
    if (!id) return;
    const confirmed = window.confirm(
      "Are you sure you want to delete this newsletter? This cannot be undone."
    );
    if (!confirmed) return;
    setDeleting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/newsletters/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to delete newsletter." });
        setDeleting(false);
        return;
      }
      router.push("/admin/newsletters");
    } catch {
      setMessage({ type: "error", text: "Delete request failed" });
      setDeleting(false);
    }
  };

  if (loading || !id) {
    return (
      <div className="mb-8">
        <Link
          href="/admin/newsletters"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to newsletters
        </Link>
        <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error || !newsletter) {
    return (
      <div className="mb-8">
        <Link
          href="/admin/newsletters"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to newsletters
        </Link>
        <p className="text-red-600 dark:text-red-400">{error || "Newsletter not found."}</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              href="/admin/newsletters"
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm mb-3"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to newsletters
            </Link>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Newsletter details</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              View and edit this newsletter. Changes are saved when you click Update.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-600 text-red-600 dark:border-red-500 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? "Deleting..." : "Delete newsletter"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Details + Edit form */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              Details
            </h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Created</dt>
                <dd className="text-gray-900 dark:text-white font-medium flex items-center gap-1 mt-0.5">
                  <Calendar className="w-4 h-4" />
                  {formatDate(newsletter.created_at)}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Category</dt>
                <dd className="text-gray-900 dark:text-white font-medium capitalize">
                  {newsletter.category?.replace(/-/g, " ") || "—"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Edit newsletter</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="January 2025 Newsletter"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quote (optional)
                </label>
                <textarea
                  name="quote"
                  value={formData.quote}
                  onChange={handleChange}
                  rows={2}
                  placeholder="e.g. Small acts, when multiplied by millions of people, can transform the world."
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Shown in the email. Leave blank to hide the quote block.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Brief description. Use **bold**, *italic*, lists, ==highlight==, [links](url)."
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Formatting: <strong>**bold**</strong> · <em>*italic*</em> · <code>~~strikethrough~~</code> · <code>`code`</code> · <code>==highlight==</code> · <code>-</code> or <code>1.</code> lists · <code>[link](url)</code> · <code>#</code> <code>##</code> <code>###</code> headers · <code>&gt; quote</code> · <code>---</code> rule
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {PREDEFINED_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.replace(/-/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Newsletter link (optional)
                </label>
                <input
                  type="url"
                  name="file_path"
                  value={formData.file_path}
                  onChange={handleChange}
                  placeholder="https://docs.google.com/... or https://example.com/newsletter.pdf"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 mb-3">Paste a link (Google Doc, PDF URL, etc.) or upload a PDF below for the &quot;Read the newsletter →&quot; button.</p>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Or upload a PDF</p>
                <CloudinaryUpload
                  key={uploadKey}
                  onUpload={(url) => setFormData((prev) => ({ ...prev, file_path: url || prev.file_path }))}
                  folder="morethanme/newsletters"
                  accept=".pdf,application/pdf"
                  maxSizeMB={10}
                  resourceType="raw"
                  buttonLabel="Upload PDF"
                />
                {newsletter.file_path && !formData.file_path && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Existing link: {newsletter.file_path}</p>
                )}
                {formData.file_path && (
                  <a
                    href={formData.file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Open link →
                  </a>
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
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Update newsletter"}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Live preview */}
        <div className="lg:sticky lg:top-6 self-start">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email preview
              </span>
            </div>
            <div className="p-4">
              <div className="mb-3">
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Subject (example)
                </span>
                <p className="text-gray-900 dark:text-white font-medium mt-0.5">
                  New: {formData.title || "Newsletter title"}
                </p>
              </div>
              <iframe
                title="Newsletter email preview"
                srcDoc={emailPreviewHtml}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white min-h-[320px]"
                style={{ height: "380px" }}
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </div>
      </div>

      <NewsletterFormattingReference />
    </>
  );
}
