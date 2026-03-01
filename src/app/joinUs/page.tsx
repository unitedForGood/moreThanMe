"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CloudinaryUpload from "@/components/CloudinaryUpload";

export default function JoinPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    batch: "2023",
    course: "BTECH",
    phone: "",
    why_join: "",
  });
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        batch: form.batch,
        course: form.course,
        why_join: form.why_join.trim() || undefined,
        image_url: imageUrl.trim() || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.status === 409 || data.error === "already_registered") {
      router.push("/joinUs/status/already");
      return;
    }
    if (!res.ok) {
      setError(data.error || "There was an error submitting your form. Please try again.");
      return;
    }
    router.push("/joinUs/status/welcome");
  }

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Join Us</h1>
      <p className="mb-4 text-gray-700 dark:text-gray-300">
        Become a volunteer and help us make a difference! Fill out the form below to join our team.
      </p>
      
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl space-y-6 border border-blue-100 dark:border-blue-700 mb-12"
      >
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Photo</label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            We will use this for your profile photo and for internal team requirements (e.g., team directory, team photos).
          </p>
          <CloudinaryUpload
            onUpload={(url) => setImageUrl(url)}
            folder="morethanme/team"
            accept="image/*"
            maxSizeMB={10}
          />
          {imageUrl && <span className="ml-2 text-xs text-green-600 dark:text-green-400">Photo added</span>}
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={form.name}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            placeholder="yourname@example.com"
            value={form.email}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            placeholder="e.g. 9876543210"
          />
        </div>

        <div>
          <label htmlFor="batch" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Batch <span className="text-red-500">*</span>
          </label>
          <select
            id="batch"
            name="batch"
            required
            value={form.batch}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
          >
            <option value="2023">2023</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="course" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Course <span className="text-red-500">*</span>
          </label>
          <select
            id="course"
            name="course"
            required
            value={form.course}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
          >
            <option value="BTECH">B.Tech</option>
            <option value="BDES">B.Des</option>
            <option value="BBA">BBA</option>
            <option value="PSYCH">Psychology</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="why_join" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Why do you want to join? <span className="text-red-500">*</span>
          </label>
          <textarea
            id="why_join"
            name="why_join"
            rows={4}
            required
            value={form.why_join}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition duration-300 ease-in-out disabled:opacity-60 disabled:pointer-events-none"
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>
    </main>
  );
}
