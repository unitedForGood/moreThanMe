"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Calendar, Save } from "lucide-react";
import CloudinaryUpload from "@/components/CloudinaryUpload";

const PREDEFINED_CATEGORIES = ["monthly", "weekly", "annual", "special-edition"];

interface NewsletterData {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  file_path: string;
  created_at: string;
}

function buildEmailPreview(opts: {
  title: string;
  description: string;
  category: string;
  file_path: string;
}) {
  const { title, description, file_path } = opts;
  const desc = description ? `<p>${description}</p>` : "";
  const newsletterUrl = file_path?.startsWith("http") ? file_path : "";
  const displayTitle = title || "Newsletter title";
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #A51C30;">More Than Me</h2>
  <p>Hello!</p>
  <p>We've published a new newsletter: <strong>${displayTitle}</strong>.</p>
  ${desc}
  ${newsletterUrl ? `<p><a href="${newsletterUrl}" style="color: #A51C30; font-weight: bold;">Read the newsletter →</a></p>` : ""}
  <p>Thank you for being part of our community.</p>
  <p style="color: #666; font-size: 12px; margin-top: 40px;">— More Than Me · Rishihood University</p>
</body>
</html>`;
}

export default function AdminNewsletterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState<string | null>(null);
  const [newsletter, setNewsletter] = useState<NewsletterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "monthly",
    file_path: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [uploadKey, setUploadKey] = useState(0);

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
        <Link
          href="/admin/newsletters"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to newsletters
        </Link>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Newsletter details</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          View and edit this newsletter. Changes are saved when you click Update.
        </p>
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
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Brief description"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
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
                  Newsletter file (PDF)
                </label>
                <CloudinaryUpload
                  key={uploadKey}
                  onUpload={(url) => setFormData((prev) => ({ ...prev, file_path: url }))}
                  folder="morethanme/newsletters"
                  accept=".pdf,application/pdf"
                  maxSizeMB={10}
                />
                {formData.file_path ? (
                  <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                    File set. Upload again to replace.
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Current: {newsletter.file_path ? "Link set" : "No file"}
                  </p>
                )}
                {formData.file_path && (
                  <a
                    href={formData.file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Open current file →
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
    </>
  );
}
