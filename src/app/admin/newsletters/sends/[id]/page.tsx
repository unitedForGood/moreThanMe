"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Calendar, Users, FileText } from "lucide-react";

interface SendRecord {
  id: string;
  subject: string;
  html_content?: string;
  recipient_count: number;
  recipient_emails?: string[];
  sent_by?: string | null;
  sent_at: string;
  newsletter_id?: string | null;
}

interface NewsletterRecord {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  file_path: string;
  created_at: string;
}

export default function AdminNewsletterSendDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState<string | null>(null);
  const [send, setSend] = useState<SendRecord | null>(null);
  const [newsletter, setNewsletter] = useState<NewsletterRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    fetch(`/api/admin/newsletter-sends/${id}`, { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 404 ? "Send not found" : "Failed to load");
        return r.json();
      })
      .then((data) => {
        setSend(data.send);
        setNewsletter(data.newsletter || null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

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

  if (error || !send) {
    return (
      <div className="mb-8">
        <Link
          href="/admin/newsletters"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to newsletters
        </Link>
        <p className="text-red-600 dark:text-red-400">{error || "Send not found."}</p>
      </div>
    );
  }

  const formatDate = (s: string) =>
    new Date(s).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  const previewHtml = send.html_content || "";

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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Newsletter send details</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Full information for this send: subject, recipients, dates, and email preview.
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary-600" />
            Subject
          </h3>
          <p className="text-gray-900 dark:text-white font-medium">{send.subject}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-600" />
              When
            </h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Sent at</dt>
                <dd className="text-gray-900 dark:text-white font-medium">{formatDate(send.sent_at)}</dd>
              </div>
              {newsletter?.created_at && (
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Newsletter created</dt>
                  <dd className="text-gray-900 dark:text-white font-medium">
                    {formatDate(newsletter.created_at)}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Sent by</dt>
                <dd className="text-gray-900 dark:text-white font-medium">{send.sent_by || "—"}</dd>
              </div>
            </dl>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-600" />
              Recipients
            </h3>
            <p className="text-gray-900 dark:text-white font-medium mb-2">
              {send.recipient_count} recipient{send.recipient_count !== 1 ? "s" : ""}
            </p>
            {send.recipient_emails && send.recipient_emails.length > 0 ? (
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 max-h-48 overflow-y-auto">
                {send.recipient_emails.map((email) => (
                  <li key={email}>{email}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No recipient list stored.</p>
            )}
          </div>
        </div>

        {newsletter && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              Linked newsletter
            </h3>
            <p className="font-medium text-gray-900 dark:text-white">{newsletter.title}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {newsletter.category} · {newsletter.description || "No description"}
            </p>
            {newsletter.file_path && (
              <a
                href={newsletter.file_path}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                Open newsletter file →
              </a>
            )}
          </div>
        )}

        {previewHtml ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email preview (what was sent)
              </span>
            </div>
            <div className="p-4">
              <iframe
                title="Email preview"
                srcDoc={previewHtml}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white"
                style={{ height: "420px" }}
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No email preview stored for this send (older sends may not have saved the HTML).
            </p>
          </div>
        )}
      </div>
    </>
  );
}
