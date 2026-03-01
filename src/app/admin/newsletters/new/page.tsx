"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CloudinaryUpload from "@/components/CloudinaryUpload";

const PREDEFINED_CATEGORIES = ["monthly", "weekly", "annual", "special-edition"];

function buildEmailPreview(opts: {
  title: string;
  description: string;
  category: string;
  file_path: string;
}) {
  const { title, description, category, file_path } = opts;
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

export default function AdminNewslettersNewPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "monthly",
    file_path: "",
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
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add newsletter");
      }
      setMessage({ type: "success", text: "Newsletter created successfully!" });
      setFormData({ title: "", description: "", category: "monthly", file_path: "" });
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
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Brief description of the newsletter content"
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
                Newsletter file (PDF) *
              </label>
              <CloudinaryUpload
                key={uploadKey}
                onUpload={(url) => setFormData((prev) => ({ ...prev, file_path: url }))}
                folder="morethanme/newsletters"
                accept=".pdf,application/pdf"
                maxSizeMB={10}
              />
              {formData.file_path && (
                <p className="mt-2 text-xs text-green-600 dark:text-green-400">File uploaded.</p>
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
              disabled={loading || !formData.file_path}
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
    </>
  );
}
