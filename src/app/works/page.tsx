"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";

type MediaItem = { url: string; type: "image" | "video" };

type WorkItem = {
  id: string;
  title: string;
  date: string | { seconds: number };
  image_url: string;
  media?: MediaItem[];
  location?: string;
  description: string;
};

function formatDate(date: string | { seconds?: number; _seconds?: number } | null | undefined): string {
  if (!date) return "";
  if (typeof date === "string") return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const sec = date && typeof date === "object" ? (date.seconds ?? (date as { _seconds?: number })._seconds) : undefined;
  if (typeof sec === "number") return new Date(sec * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  return "";
}

const TRUNCATE_LENGTH = 120;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trim() + "…";
}

export default function WorksPage() {
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/works")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setWorks(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-neutral-100">
      {/* Hero */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 py-20 sm:py-28 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-white -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-white translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium mb-6 backdrop-blur-sm border border-white/20"
          >
            Our Impact
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight"
          >
            Our Works & Events
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white/90 max-w-2xl mx-auto"
          >
            Click a card to see full details.
          </motion.p>
        </div>
      </section>

      {/* Small cards grid */}
      <section className="w-full py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-10 h-10 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-neutral-500">Loading…</p>
            </div>
          ) : works.length === 0 ? (
            <div className="text-center py-24 px-4 bg-white rounded-2xl border border-neutral-200 shadow-sm">
              <p className="text-neutral-500">No works or events yet. Add them from the admin panel or run the seed.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {works.map((work, index) => (
                <motion.div
                  key={work.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.05 }}
                >
                  <Link
                    href={`/works/${work.id}`}
                    className="group relative block text-left w-full rounded-2xl overflow-hidden border border-primary-200 shadow-lg hover:shadow-xl hover:border-primary-400 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-100"
                  >
                    {/* Card: image on top, theme-colored bottom */}
                    <div className="bg-white rounded-t-2xl overflow-hidden">
                      <div className="relative w-full aspect-[4/3] bg-primary-100 overflow-hidden">
                        <Image
                          src={work.image_url}
                          alt={work.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        {/* Date badge - theme colored */}
                        <div className="absolute top-3 left-3 z-10">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-600 text-white text-xs font-medium shadow-md">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(work.date)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Bottom section - primary theme instead of black */}
                    <div className="bg-primary-800 p-4 sm:p-5 border-t border-primary-700">
                      <h2 className="text-lg sm:text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-primary-100 transition-colors">
                        {work.title}
                      </h2>
                      <p className="text-sm text-white line-clamp-3 leading-relaxed">
                        {truncate(work.description.replace(/\s+/g, " "), TRUNCATE_LENGTH)}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
