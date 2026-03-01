"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ImageIcon, Video, Trash2, Upload, Eye, EyeOff } from "lucide-react";

interface MediaAsset {
  id: string;
  url: string;
  public_id: string | null;
  type: "image" | "video";
  title: string | null;
  alt: string | null;
  category: string;
  description: string | null;
  show_on_home: boolean;
  sort_order: number;
  created_at: string;
}

const CATEGORIES = ["General", "Education", "Celebration", "Health", "Events", "Impact", "Other"];

export default function AdminAssetsPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState<"image" | "video">("image");
  const [newTitle, setNewTitle] = useState("");
  const [newAlt, setNewAlt] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [newShowOnHome, setNewShowOnHome] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAlt, setEditAlt] = useState("");
  const [editCategory, setEditCategory] = useState("General");
  const [editShowOnHome, setEditShowOnHome] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAssets = async () => {
    const res = await fetch("/api/admin/assets", { credentials: "include" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(typeof data?.error === "string" ? data.error : "Failed to load assets");
      setAssets([]);
      return;
    }
    setError(null);
    setAssets(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchAssets();
      setLoading(false);
    })();
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "morethanme/assets");
      formData.append("resource_type", uploadType);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const uploadData = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok) {
        setError(uploadData.error || "Upload failed");
        return;
      }

      const createRes = await fetch("/api/admin/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          url: uploadData.url,
          public_id: uploadData.public_id,
          type: uploadType,
          title: newTitle.trim() || file.name.replace(/\.[^/.]+$/, ""),
          alt: newAlt.trim() || null,
          category: newCategory,
          show_on_home: newShowOnHome,
          sort_order: assets.length,
        }),
      });
      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        setError(err.error || `Failed to save asset (${createRes.status})`);
        return;
      }
      await fetchAssets();
      setNewTitle("");
      setNewAlt("");
      setNewCategory("General");
      setNewShowOnHome(true);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const res = await fetch(`/api/admin/assets?id=${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title: editTitle.trim() || null,
        alt: editAlt.trim() || null,
        category: editCategory,
        show_on_home: editShowOnHome,
      }),
    });
    if (res.ok) {
      await fetchAssets();
      setEditingId(null);
    }
  };

  const deleteAsset = async (id: string) => {
    if (!confirm("Remove this asset from the gallery? (File remains on Cloudinary)")) return;
    const res = await fetch(`/api/admin/assets?id=${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) await fetchAssets();
    if (editingId === id) setEditingId(null);
  };

  const startEdit = (a: MediaAsset) => {
    setEditingId(a.id);
    setEditTitle(a.title || "");
    setEditAlt(a.alt || "");
    setEditCategory(a.category || "General");
    setEditShowOnHome(a.show_on_home);
  };

  return (
    <>
      <div className="mb-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm mb-4">
          ← Dashboard
        </Link>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Manage Assets</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Upload images and videos to Cloudinary. Toggle &quot;Featured&quot; to show an asset in the home page gallery.
        </p>
        <p className="mt-2 text-amber-700 dark:text-amber-400 text-xs">
          Assets are stored in Firebase Firestore <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">media_assets</code> collection.
        </p>
      </div>

      {/* Upload */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload new asset
        </h3>
        <input
          ref={fileInputRef}
          type="file"
          accept={uploadType === "video" ? "video/*" : "image/*"}
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setUploadType("image")}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${uploadType === "image" ? "bg-primary-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
            >
              Image
            </button>
            <button
              type="button"
              onClick={() => setUploadType("video")}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${uploadType === "video" ? "bg-primary-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
            >
              Video
            </button>
          </div>
          <input
            type="text"
            placeholder="Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[140px]"
          />
          <input
            type="text"
            placeholder="Alt text"
            value={newAlt}
            onChange={(e) => setNewAlt(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[140px]"
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300" title="Show this in the home page gallery">
            <input type="checkbox" checked={newShowOnHome} onChange={(e) => setNewShowOnHome(e.target.checked)} className="rounded border-gray-300 text-primary-600" />
            Featured (home gallery)
          </label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Choose file"}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>

      {/* List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <h3 className="font-semibold text-gray-900 dark:text-white p-4 border-b border-gray-200 dark:border-gray-700">
          All assets ({assets.length})
        </h3>
        {loading ? (
          <div className="p-8 text-gray-500 dark:text-gray-400">Loading...</div>
        ) : assets.length === 0 ? (
          <div className="p-8 text-gray-500 dark:text-gray-400 text-center">No assets yet. Upload an image or video above.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
            {assets.map((a) => (
              <div key={a.id} className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-900">
                <div className="aspect-video bg-black relative">
                  {a.type === "video" ? (
                    <video src={a.url} className="w-full h-full object-cover" muted playsInline />
                  ) : (
                    <img src={a.url} alt={a.alt || a.title || "Asset"} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute top-1 right-1 flex gap-1" title={a.show_on_home ? "Shown on home" : "Hidden from home"}>
                    {a.show_on_home ? (
                      <Eye className="w-4 h-4 text-green-500 bg-black/50 rounded p-0.5" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400 bg-black/50 rounded p-0.5" />
                    )}
                  </div>
                </div>
                <div className="p-2 text-xs text-gray-600 dark:text-gray-400 truncate" title={a.title || a.alt || a.url}>
                  {a.title || a.alt || "Untitled"}
                </div>
                <div className="p-2 flex gap-1 border-t border-gray-200 dark:border-gray-700">
                  <button type="button" onClick={() => startEdit(a)} className="flex-1 text-xs text-primary-600 dark:text-primary-400 hover:underline">
                    Edit
                  </button>
                  <button type="button" onClick={() => deleteAsset(a.id)} className="text-xs text-red-600 dark:text-red-400 hover:underline">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit modal / inline */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setEditingId(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Edit asset</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="Alt text"
                value={editAlt}
                onChange={(e) => setEditAlt(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300" title="Show this in the home page gallery">
                <input type="checkbox" checked={editShowOnHome} onChange={(e) => setEditShowOnHome(e.target.checked)} className="rounded border-gray-300 text-primary-600" />
                Featured (home gallery)
              </label>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={saveEdit} className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700">
                Save
              </button>
              <button onClick={() => setEditingId(null)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
