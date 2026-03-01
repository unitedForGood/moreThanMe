"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar, MapPin, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

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

export default function WorkDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [work, setWork] = useState<WorkItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [mediaIndex, setMediaIndex] = useState(0);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    fetch("/api/works")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        const found = list.find((w: WorkItem) => w.id === id) || null;
        setWork(found);
        setMediaIndex(0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const mediaList: MediaItem[] =
    work?.media?.length ? work.media : work?.image_url ? [{ url: work.image_url, type: "image" }] : [];
  const currentMedia = mediaList[mediaIndex];
  const hasMultiple = mediaList.length > 1;

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-100 flex flex-col items-center justify-center py-24">
        <div className="w-10 h-10 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-neutral-500">Loading…</p>
      </main>
    );
  }

  if (!work) {
    return (
      <main className="min-h-screen bg-neutral-100 flex flex-col items-center justify-center py-24 px-4">
        <p className="text-neutral-600 mb-6">Work or event not found.</p>
        <Link
          href="/works"
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Our Works
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-100">
      {/* Back link */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <Link
          href="/works"
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Our Works
        </Link>
      </div>

      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16"
      >
        <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 overflow-hidden">
          <div className="relative w-full aspect-video sm:aspect-[2/1] bg-primary-100">
            {currentMedia?.type === "video" ? (
              <video
                key={currentMedia.url}
                src={currentMedia.url}
                controls
                className="w-full h-full object-cover"
                playsInline
              />
            ) : currentMedia?.url ? (
              <Image
                src={currentMedia.url}
                alt={work.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 896px"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-primary-600/50">
                No media
              </div>
            )}
            {hasMultiple && (
              <>
                <button
                  type="button"
                  onClick={() => setMediaIndex((i) => (i - 1 + mediaList.length) % mediaList.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  aria-label="Previous media"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={() => setMediaIndex((i) => (i + 1) % mediaList.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  aria-label="Next media"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <div className="absolute bottom-14 left-4 right-4 flex justify-center gap-1.5">
                  {mediaList.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setMediaIndex(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === mediaIndex ? "bg-white" : "bg-white/50 hover:bg-white/70"
                      }`}
                      aria-label={`Go to media ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-primary-900/80 via-primary-900/20 to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
              <h1 className="text-2xl sm:text-4xl font-bold text-white drop-shadow-lg">
                {work.title}
              </h1>
            </div>
          </div>

          <div className="p-6 sm:p-8 bg-white">
            <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500 mb-6 pb-6 border-b border-neutral-200">
              <span className="inline-flex items-center gap-1.5 text-primary-600 font-medium">
                <Calendar className="w-4 h-4" />
                {formatDate(work.date)}
              </span>
              {work.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary-500" />
                  {work.location}
                </span>
              )}
            </div>
            <p className="text-neutral-600 leading-relaxed whitespace-pre-line">
              {work.description}
            </p>
          </div>
        </div>
      </motion.article>
    </main>
  );
}
