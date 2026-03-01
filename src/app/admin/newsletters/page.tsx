"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Search, Filter, Newspaper, Send, ChevronRight } from "lucide-react";

interface NewsletterItem {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  file_path: string;
  created_at: unknown;
}

interface SendItem {
  id: string;
  subject: string;
  recipient_count: number;
  recipient_emails?: string[];
  sent_by?: string | null;
  sent_at: unknown;
  newsletter_id?: string | null;
}

const CATEGORIES = ["monthly", "weekly", "annual", "special-edition"];

function formatDate(value: unknown): string {
  if (!value) return "—";
  if (typeof value === "string") return new Date(value).toLocaleDateString("en-IN", { dateStyle: "medium" });
  const t = value as { toDate?: () => Date };
  if (typeof t?.toDate === "function") return t.toDate().toLocaleDateString("en-IN", { dateStyle: "medium" });
  return "—";
}

function formatDateTime(value: unknown): string {
  if (!value) return "—";
  if (typeof value === "string") return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  const t = value as { toDate?: () => Date };
  if (typeof t?.toDate === "function") return t.toDate().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  return "—";
}

export default function AdminNewslettersPage() {
  const [newsletters, setNewsletters] = useState<NewsletterItem[]>([]);
  const [sends, setSends] = useState<SendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/newsletters-list", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/admin/newsletter-sends", { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([nRes, sRes]) => {
        setNewsletters(nRes.newsletters || []);
        setSends(sRes.sends || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const searchLower = search.trim().toLowerCase();
  const filteredNewsletters = newsletters.filter((n) => {
    const matchSearch =
      !searchLower ||
      (n.title || "").toLowerCase().includes(searchLower) ||
      (n.description || "").toLowerCase().includes(searchLower);
    const matchCategory = categoryFilter === "all" || n.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  if (loading) {
    return (
      <div className="mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
        <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading newsletters...</div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Newsletter Management</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              View past newsletters and send history. Create a new newsletter to get started.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/newsletters/send"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400 font-medium hover:bg-primary-50 dark:hover:bg-primary-900/20"
            >
              <Send className="w-4 h-4" />
              Send newsletter
            </Link>
            <Link
              href="/admin/newsletters/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700"
            >
              <Plus className="w-4 h-4" />
              Create newsletter
            </Link>
          </div>
        </div>
      </div>

      {/* Past newsletters */}
      <section className="mb-12">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-primary-600" />
          Past newsletters
        </h3>
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="all">All categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.replace(/-/g, " ")}
                </option>
              ))}
            </select>
          </div>
        </div>
        {filteredNewsletters.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {newsletters.length === 0 ? "No newsletters yet." : "No newsletters match your filter."}
            </p>
            {newsletters.length === 0 && (
              <Link
                href="/admin/newsletters/new"
                className="mt-3 inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 font-medium"
              >
                <Plus className="w-4 h-4" />
                Create your first newsletter
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNewsletters.map((n) => (
              <Link
                key={n.id}
                href={`/admin/newsletters/${n.id}`}
                className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-primary-300 dark:hover:border-primary-600 transition-colors group"
              >
                <span className="text-xs font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wide">
                  {n.category.replace(/-/g, " ")}
                </span>
                <h4 className="font-semibold text-gray-900 dark:text-white mt-1 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                  {n.title}
                </h4>
                {n.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{n.description}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{formatDate(n.created_at)}</p>
                <span className="inline-flex items-center gap-1 mt-2 text-sm text-primary-600 dark:text-primary-400 font-medium">
                  View details & edit
                  <ChevronRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Send newsletter CTA */}
      <div className="mb-12 rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 p-4">
        <p className="text-sm text-primary-800 dark:text-primary-200">
          To send a newsletter email to volunteers, go to the send flow and pick a newsletter and recipients.
        </p>
        <Link
          href="/admin/newsletters/send"
          className="mt-2 inline-flex items-center gap-2 text-primary-600 dark:text-primary-300 font-medium text-sm"
        >
          Open send newsletter
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Past sends */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Send className="w-5 h-5 text-primary-600" />
          Past sends
        </h3>
        {sends.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">No sends yet. Send history will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sends.map((s) => (
              <Link
                key={s.id}
                href={`/admin/newsletters/sends/${s.id}`}
                className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-primary-300 dark:hover:border-primary-600 transition-colors group"
              >
                <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                  {s.subject}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {s.recipient_count} recipient{s.recipient_count !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {formatDateTime(s.sent_at)} · {s.sent_by || "—"}
                </p>
                <span className="inline-flex items-center gap-1 mt-2 text-sm text-primary-600 dark:text-primary-400 font-medium">
                  View details
                  <ChevronRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
