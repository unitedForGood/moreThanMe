"use client";

import { useState, useEffect } from "react";
import { Calendar, MapPin, Image as ImageIcon, Video, X, Star } from "lucide-react";
import Link from "next/link";
import CloudinaryUpload from "@/components/CloudinaryUpload";

export type MediaItem = { url: string; type: "image" | "video"; featured?: boolean };

interface WorkItem {
  id: string;
  title: string;
  date: string;
  image_url: string;
  media?: MediaItem[];
  location?: string | null;
  description: string;
  sort_order?: number;
}

export default function AdminWorksPage() {
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [thumbFailed, setThumbFailed] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editMedia, setEditMedia] = useState<MediaItem[]>([]);
  const [editLocation, setEditLocation] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newMedia, setNewMedia] = useState<MediaItem[]>([]);
  const [newLocation, setNewLocation] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const fetchWorks = async () => {
    const res = await fetch("/api/admin/works", { credentials: "include" });
    const data = await res.json().catch(() => []);
    setWorks(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchWorks();
      setLoading(false);
    })();
  }, []);

  const startEdit = (w: WorkItem) => {
    setEditingId(w.id);
    setEditTitle(w.title);
    setEditDate(w.date || "");
    setEditMedia(
      Array.isArray(w.media) && w.media.length > 0
        ? w.media.map((m) => ({ ...m, featured: m.featured ?? false }))
        : w.image_url
          ? [{ url: w.image_url, type: "image" as const, featured: false }]
          : []
    );
    setEditLocation(w.location || "");
    setEditDescription(w.description || "");
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/works?id=${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: editTitle,
          date: editDate || undefined,
          media: editMedia,
          location: editLocation || null,
          description: editDescription,
        }),
      });
      if (res.ok) {
        await fetchWorks();
        setEditingId(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const removeWork = async (id: string) => {
    if (!confirm("Delete this work/event? It will be removed from the public Our Works page.")) return;
    const res = await fetch(`/api/admin/works?id=${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) await fetchWorks();
    if (editingId === id) setEditingId(null);
  };

  const addWork = async () => {
    if (!newTitle.trim() || !newDate) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/works", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: newTitle.trim(),
          date: newDate,
          media: newMedia,
          location: newLocation.trim() || null,
          description: newDescription.trim(),
          sort_order: works.length,
        }),
      });
      if (res.ok) {
        await fetchWorks();
        setAdding(false);
        setNewTitle("");
        setNewDate("");
        setNewMedia([]);
        setNewLocation("");
        setNewDescription("");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm mb-4">
          ← Dashboard
        </Link>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Our Works & Events</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Manage works and events shown on the public <a href="/works" className="text-primary-600 dark:text-primary-400 underline" target="_blank" rel="noopener noreferrer">/works</a> page. Data is stored in Firestore collection <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">works</code>.
        </p>
      </div>

      {loading ? (
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      ) : (
        <div className="space-y-6">
          {works.map((work) => (
            <div
              key={work.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {editingId === work.id ? (
                <div className="p-4 space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Title"
                      className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Media (images & videos)</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Add as many as you like — each upload is added to the list. Hover a thumbnail and click ✕ to remove.</p>
                    <div className="flex flex-wrap gap-3 mb-2">
                      {editMedia.map((m, i) => (
                        <div key={i} className="relative group w-28 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700">
                          <div className="w-28 h-24 relative">
                            {m.type === "image" ? (
                              <img src={m.url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Video className="w-8 h-8 text-gray-500" />
                              </div>
                            )}
                            <span className="absolute top-0.5 left-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/60 text-white">
                              {m.type}
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditMedia((prev) => prev.filter((_, j) => j !== i))}
                              className="absolute top-0.5 right-0.5 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <label className="flex items-center gap-1 p-1.5 border-t border-gray-200 dark:border-gray-600 cursor-pointer bg-gray-50 dark:bg-gray-800">
                            <input
                              type="checkbox"
                              checked={!!m.featured}
                              onChange={(e) =>
                                setEditMedia((prev) =>
                                  prev.map((item, j) => (j === i ? { ...item, featured: e.target.checked } : item))
                                )
                              }
                              className="rounded border-gray-300 text-primary-600"
                            />
                            <Star className={`w-3.5 h-3.5 ${m.featured ? "text-amber-500 fill-amber-500" : "text-gray-400"}`} />
                            <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">Featured</span>
                          </label>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <CloudinaryUpload
                        onUpload={(url) => url && setEditMedia((prev) => [...prev, { url, type: "image", featured: false }])}
                        folder="morethanme/works"
                        accept="image/*"
                        maxSizeMB={5}
                        resourceType="image"
                        resetAfterUpload
                        buttonLabel="+ Add image"
                      />
                      <CloudinaryUpload
                        onUpload={(url) => url && setEditMedia((prev) => [...prev, { url, type: "video", featured: false }])}
                        folder="morethanme/works"
                        accept="video/*"
                        maxSizeMB={100}
                        resourceType="video"
                        resetAfterUpload
                        buttonLabel="+ Add video"
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="Location (optional)"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Full description"
                    rows={5}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-y"
                  />
                  <div className="flex gap-2">
                    <button onClick={saveEdit} disabled={saving} className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                      Save
                    </button>
                    <button onClick={cancelEdit} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4 p-4">
                    <div className="w-full sm:w-40 h-28 rounded-lg bg-gray-100 dark:bg-gray-700 shrink-0 overflow-hidden flex items-center justify-center">
                      {(() => {
                        const firstImage = work.media?.find((m) => m.type === "image" && m.url) ?? work.media?.[0];
                        const thumbUrl = firstImage?.type === "video" ? null : (firstImage?.url ?? work.image_url);
                        const isVideo = firstImage?.type === "video";
                        const failed = thumbFailed[work.id];
                        if (isVideo)
                          return (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-600">
                              <Video className="w-10 h-10 text-gray-500" />
                            </div>
                          );
                        if (thumbUrl && !failed)
                          return (
                            <img
                              src={thumbUrl}
                              alt={work.title}
                              className="w-full h-full object-cover"
                              onError={() => setThumbFailed((prev) => ({ ...prev, [work.id]: true }))}
                            />
                          );
                        return (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <ImageIcon className="w-10 h-10" />
                          </div>
                        );
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white">{work.title}</div>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {work.date}
                        </span>
                        {work.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {work.location}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{work.description}</p>
                      {(work.media?.length ?? 0) > 1 && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {(work.media?.length ?? 0)} media items
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => startEdit(work)} className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline">
                        Edit
                      </button>
                      <button onClick={() => removeWork(work.id)} className="text-sm text-red-600 dark:text-red-400 font-medium hover:underline">
                        Delete
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}

          {adding ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Title *"
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  placeholder="Date *"
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Media (images & videos)</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Add as many as you like — each upload is added to the list. Hover a thumbnail and click ✕ to remove.</p>
                <div className="flex flex-wrap gap-3 mb-2">
                  {newMedia.map((m, i) => (
                    <div key={i} className="relative group w-28 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700">
                      <div className="w-28 h-24 relative">
                        {m.type === "image" ? (
                          <img src={m.url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="w-8 h-8 text-gray-500" />
                          </div>
                        )}
                        <span className="absolute top-0.5 left-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/60 text-white">
                          {m.type}
                        </span>
                        <button
                          type="button"
                          onClick={() => setNewMedia((prev) => prev.filter((_, j) => j !== i))}
                          className="absolute top-0.5 right-0.5 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <label className="flex items-center gap-1 p-1.5 border-t border-gray-200 dark:border-gray-600 cursor-pointer bg-gray-50 dark:bg-gray-800">
                        <input
                          type="checkbox"
                          checked={!!m.featured}
                          onChange={(e) =>
                            setNewMedia((prev) =>
                              prev.map((item, j) => (j === i ? { ...item, featured: e.target.checked } : item))
                            )
                          }
                          className="rounded border-gray-300 text-primary-600"
                        />
                        <Star className={`w-3.5 h-3.5 ${m.featured ? "text-amber-500 fill-amber-500" : "text-gray-400"}`} />
                        <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">Featured</span>
                      </label>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <CloudinaryUpload
                    onUpload={(url) => url && setNewMedia((prev) => [...prev, { url, type: "image", featured: false }])}
                    folder="morethanme/works"
                    accept="image/*"
                    maxSizeMB={5}
                    resourceType="image"
                    resetAfterUpload
                    buttonLabel="+ Add image"
                  />
                  <CloudinaryUpload
                    onUpload={(url) => url && setNewMedia((prev) => [...prev, { url, type: "video", featured: false }])}
                    folder="morethanme/works"
                    accept="video/*"
                    maxSizeMB={100}
                    resourceType="video"
                    resetAfterUpload
                    buttonLabel="+ Add video"
                  />
                </div>
              </div>
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Location (optional)"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Full description"
                rows={5}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-y"
              />
              <div className="flex gap-2">
                <button
                  onClick={addWork}
                  disabled={saving || !newTitle.trim() || !newDate}
                  className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
                >
                  Add work / event
                </button>
                <button onClick={() => setAdding(false)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full mt-6 px-4 py-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 text-sm font-medium transition-colors"
            >
              + Add work or event
            </button>
          )}
        </div>
      )}
    </>
  );
}
