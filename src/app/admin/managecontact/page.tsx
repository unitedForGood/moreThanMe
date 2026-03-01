"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Mail, Phone, Heart } from "lucide-react";
import Link from "next/link";

interface ContactSubmission {
  id: string;
  name: string;
  type?: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  read: boolean;
  created_at: unknown;
}

interface ThanksSubmission {
  id: string;
  name?: string | null;
  message?: string | null;
  created_at: unknown;
}

function formatDate(val: unknown): string {
  if (val == null) return "—";
  const o = val as Record<string, unknown>;
  let date: Date;
  if (typeof o?.toDate === "function") date = (o.toDate as () => Date)();
  else if (typeof o?._seconds === "number") date = new Date(o._seconds * 1000);
  else if (typeof o?.seconds === "number") date = new Date(o.seconds * 1000);
  else if (typeof val === "string" || typeof val === "number") date = new Date(val);
  else return "—";
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminManageContactPage() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [thanks, setThanks] = useState<ThanksSubmission[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [updatingRead, setUpdatingRead] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [subRes, thanksRes, setRes] = await Promise.all([
        fetch("/api/admin/contact-submissions", { credentials: "include" }),
        fetch("/api/admin/thanks-submissions", { credentials: "include" }),
        fetch("/api/admin/site-settings", { credentials: "include" }),
      ]);
      const subData = await subRes.json().catch(() => []);
      const thanksData = await thanksRes.json().catch(() => []);
      const setData = await setRes.json().catch(() => ({}));
      setSubmissions(Array.isArray(subData) ? subData : []);
      setThanks(Array.isArray(thanksData) ? thanksData : []);
      setSettings(typeof setData === "object" && setData !== null ? setData : {});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleRead = async (id: string, read: boolean) => {
    setUpdatingRead(id);
    try {
      const res = await fetch("/api/admin/contact-submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, read }),
      });
      if (res.ok) await fetchData();
    } finally {
      setUpdatingRead(null);
    }
  };

  return (
    <>
      <div className="mb-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm mb-4">
          ← Dashboard
        </Link>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Manage Contact</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Contact form submissions and site contact details. Submissions are stored in Supabase <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">contact_submissions</code>.
        </p>
      </div>

      <div className="grid gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary-600" />
            Contact form submissions
          </h3>
          {loading ? (
            <div className="p-6 text-gray-500 dark:text-gray-400">Loading...</div>
          ) : submissions.length === 0 ? (
            <p className="p-6 text-gray-600 dark:text-gray-400 text-sm">No submissions yet. They will appear here when someone uses the Contact page form.</p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {submissions.map((s) => (
                <li key={s.id} className={`p-4 ${s.read ? "bg-gray-50 dark:bg-gray-800/50" : ""}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {s.name}
                        {s.type && <span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 capitalize">{s.type}</span>}
                        {s.subject && <span className="text-gray-500 dark:text-gray-400 font-normal"> — {s.subject}</span>}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0 text-sm mt-1">
                        <a href={`mailto:${s.email}`} className="text-primary-600 dark:text-primary-400 hover:underline">{s.email}</a>
                        {s.phone && <a href={`tel:${s.phone}`} className="text-primary-600 dark:text-primary-400 hover:underline">{s.phone}</a>}
                      </div>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{s.message}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">{formatDate(s.created_at)}</p>
                    </div>
                    <button
                      onClick={() => toggleRead(s.id, !s.read)}
                      disabled={updatingRead === s.id}
                      className={`text-sm px-3 py-1 rounded-lg border shrink-0 ${s.read ? "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400" : "border-primary-500 text-primary-600 dark:text-primary-400"}`}
                    >
                      {s.read ? "Mark unread" : "Mark read"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" />
            Thanks messages
          </h3>
          {loading ? (
            <div className="p-6 text-gray-500 dark:text-gray-400">Loading...</div>
          ) : thanks.length === 0 ? (
            <p className="p-6 text-gray-600 dark:text-gray-400 text-sm">No thanks yet. They appear when someone uses the &ldquo;Thanks MoreThanMe team&rdquo; section on the Contact page.</p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {thanks.map((t) => (
                <li key={t.id} className="p-4">
                  <div className="font-medium text-gray-900 dark:text-white">{t.name || "Anonymous"}</div>
                  {t.message && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{t.message}</p>}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">{formatDate(t.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-800 p-6">
          <h3 className="font-semibold text-primary-900 dark:text-primary-100 mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Site contact info (shown on Contact page)
          </h3>
          <ul className="space-y-2 text-sm text-primary-800 dark:text-primary-200">
            <li><strong>Email:</strong> {settings.contact_email || "unitedforgood2025@gmail.com"}</li>
            <li><strong>Phone:</strong> {settings.contact_phone || "+91 7541062514"}</li>
          </ul>
          <p className="mt-4 text-xs text-primary-600 dark:text-primary-300">
            Stored in <code className="bg-primary-200 dark:bg-primary-800 px-1 rounded">site_settings</code>. To change these, use the API <code className="bg-primary-200 dark:bg-primary-800 px-1 rounded">PATCH /api/admin/site-settings</code> with <code className="bg-primary-200 dark:bg-primary-800 px-1 rounded">{"{ \"key\": \"contact_email\", \"value\": \"...\" }"}</code> or run SQL in Supabase.
          </p>
        </div>
      </div>
    </>
  );
}
