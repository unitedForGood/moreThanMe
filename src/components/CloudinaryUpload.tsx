"use client";

import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";

interface CloudinaryUploadProps {
  onUpload: (url: string, publicId: string) => void;
  folder?: string;
  accept?: string;
  maxSizeMB?: number;
  resourceType?: "image" | "video" | "auto";
  /** When true, clear preview after upload so the button reappears for adding more */
  resetAfterUpload?: boolean;
  buttonLabel?: string;
  className?: string;
}

export default function CloudinaryUpload({
  onUpload,
  folder = "morethanme",
  accept = "image/*",
  maxSizeMB = 5,
  resourceType = "auto",
  resetAfterUpload = false,
  buttonLabel,
  className = "",
}: CloudinaryUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File must be under ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      formData.append("resource_type", resourceType);

      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }
      onUpload(data.url, data.public_id);
      if (resetAfterUpload) {
        setPreview(null);
      } else {
        setPreview(data.url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const clear = () => {
    setPreview(null);
    setError(null);
    onUpload("", "");
  };

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      {preview ? (
        <div className="relative inline-block">
          {accept.startsWith("image") ? (
            <img src={preview} alt="Upload preview" className="max-h-32 rounded-lg border border-gray-200 dark:border-gray-700" />
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[200px]">{preview}</span>
            </div>
          )}
          <button
            type="button"
            onClick={clear}
            className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          {uploading ? "Uploading..." : buttonLabel ?? "Upload image or file"}
        </button>
      )}
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
