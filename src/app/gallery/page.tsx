"use client";
import { useState, useEffect } from "react";
import PhotoGallery from "@/components/PhotoGallery";

type Photo = { src: string; alt: string; category: string; tags: string[]; description: string };

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    setLoading(true);
    fetch("/api/gallery/all")
      .then((r) => r.json())
      .then((data) => {
        setPhotos(Array.isArray(data) ? data : []);
      })
      .catch(() => setPhotos([]))
      .finally(() => setLoading(false));
  }, []);

  const categories = ["All", ...Array.from(new Set(photos.map((p) => p.category || "General").filter(Boolean)))].sort((a, b) => (a === "All" ? -1 : b === "All" ? 1 : a.localeCompare(b)));
  const searchTerm = search.trim().toLowerCase();

  const filteredPhotos = photos.filter((photo) => {
    const cat = photo.category || "General";
    const matchesCategory = category === "All" ? true : cat === category;
    if (!matchesCategory) return false;

    if (!searchTerm) return true;

    const alt = (photo.alt || "").toLowerCase();
    const desc = (photo.description || "").toLowerCase();
    const tagMatch = Array.isArray(photo.tags) && photo.tags.some((tag) => String(tag).toLowerCase().includes(searchTerm));
    const altMatch = alt.includes(searchTerm);
    const descMatch = desc.includes(searchTerm);
    return altMatch || descMatch || tagMatch;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Gallery</h1>
      <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
        <select
          className="border rounded px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <input
          type="text"
          className="border rounded px-4 py-2 text-base w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Search by description or tags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-10 h-10 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-neutral-500">Loading gallery…</p>
        </div>
      ) : photos.length === 0 ? (
        <p className="text-center text-neutral-500 py-12">No gallery images yet. Add media in the admin panel.</p>
      ) : filteredPhotos.length === 0 ? (
        <p className="text-center text-neutral-500 py-12">
          No images match your search or filter. Try a different category or search term.
        </p>
      ) : (
        <PhotoGallery photos={filteredPhotos} showViewAllButton={false} />
      )}
    </div>
  );
}