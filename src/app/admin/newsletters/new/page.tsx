"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CloudinaryUpload from "@/components/CloudinaryUpload";
import NewsletterFormattingReference from "@/components/newsletters/NewsletterFormattingReference";
import { buildNewsletterEmailHtml } from "@/lib/newsletterEmail";

const PREDEFINED_CATEGORIES = ["monthly", "weekly", "annual", "special-edition"];

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

export default function AdminNewslettersNewPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "monthly",
    file_path: "",
    quote: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [uploadKey, setUploadKey] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/newsletters/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          file_path: formData.file_path,
          quote: formData.quote || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add newsletter");
      }
      setMessage({ type: "success", text: "Newsletter created successfully!" });
      setFormData({ title: "", description: "", category: "monthly", file_path: "", quote: "" });
      setUploadKey((k) => k + 1);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const emailPreviewHtml = buildEmailPreview(formData);

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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Create newsletter</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Fill in the details below. The preview on the right updates as you type.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
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
                placeholder="Brief description of the newsletter content. You can use **bold**, *italic*, bullet lists, and more."
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
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 mb-3">Paste a link (Google Doc, PDF URL, etc.) for the &quot;Read the newsletter →&quot; button. Or upload a PDF below.</p>
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
              {formData.file_path && (
                <p className="mt-2 text-xs text-green-600 dark:text-green-400">Link or file set. Clear the URL above or upload again to replace.</p>
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
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create newsletter"}
            </button>
          </form>
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
