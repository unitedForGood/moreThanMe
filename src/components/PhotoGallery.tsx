"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";

interface Photo {
  src: string;
  alt: string;
  category: string;
  tags: string[];
  description: string;
}

interface PhotoGalleryProps {
  photos: Photo[];
  /** When true, show the 'View Full Gallery' button (used on homepage). On /gallery it should be false. */
  showViewAllButton?: boolean;
}

const isValidSrc = (src: string) =>
  typeof src === "string" && src.trim().length > 0 && (src.startsWith("http://") || src.startsWith("https://"));

export default function PhotoGallery({ photos, showViewAllButton = true }: PhotoGalleryProps) {
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const [fullViewIndex, setFullViewIndex] = useState<number | null>(null);

  const isVideo = (src: string) => {
    return src.toLowerCase().includes("/video/") || src.toLowerCase().endsWith(".mp4") || src.toLowerCase().endsWith(".webm");
  };

  const list = photos.filter((p) => isValidSrc(p.src));

  useEffect(() => {
    if (fullViewIndex === null) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullViewIndex(null);
    };
    document.addEventListener("keydown", onEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.body.style.overflow = "";
    };
  }, [fullViewIndex]);

  const fullViewPhoto = fullViewIndex !== null ? list[fullViewIndex] : null;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {list.map((photo, i) => (
          <button
            key={i}
            type="button"
            onClick={() => !failed[i] && setFullViewIndex(i)}
            className="relative overflow-hidden rounded-2xl shadow-lg group bg-gray-100 dark:bg-gray-800 min-h-[12rem] w-full text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            {failed[i] ? (
              <div className="w-full h-48 flex flex-col items-center justify-center text-gray-400 gap-2 pointer-events-none">
                <span className="text-4xl">🖼️</span>
                <span className="text-sm px-2 text-center">{photo.alt || "Image unavailable"}</span>
              </div>
            ) : isVideo(photo.src) ? (
              <video
                src={photo.src}
                className="object-cover w-full h-48 transition-transform duration-300 group-hover:scale-105 group-hover:brightness-90"
                muted
                loop
                playsInline
                autoPlay
              />
            ) : (
              <Image
                src={photo.src}
                alt={photo.alt}
                width={400}
                height={270}
                className="object-cover w-full h-48 transition-transform duration-300 group-hover:scale-105 group-hover:brightness-90"
                onError={() => setFailed((prev) => ({ ...prev, [i]: true }))}
              />
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {photo.alt}
            </div>
          </button>
        ))}
      </div>

      {/* Full view lightbox */}
      {fullViewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setFullViewIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="View media"
        >
          <button
            type="button"
            onClick={() => setFullViewIndex(null)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-8 h-8" />
          </button>
          <div
            className="relative max-w-[90vw] max-h-[90vh] w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {isVideo(fullViewPhoto.src) ? (
              <video
                src={fullViewPhoto.src}
                controls
                autoPlay
                playsInline
                className="max-w-full max-h-[90vh] rounded-lg"
              />
            ) : (
              <Image
                src={fullViewPhoto.src}
                alt={fullViewPhoto.alt}
                width={1200}
                height={800}
                className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg"
              />
            )}
          </div>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/90 text-sm max-w-2xl text-center px-4">
            {fullViewPhoto.alt}
          </p>
        </div>
      )}
      {showViewAllButton && (
        <div className="flex justify-center mt-8">
          <Link href="/gallery">
            <button className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-lg shadow-sm transition-colors duration-200 text-lg">
              View Full Gallery
            </button>
          </Link>
        </div>
      )}
    </div>
  );
} 