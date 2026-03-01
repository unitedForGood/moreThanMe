"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";

export default function ThanksFormSection() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/thanks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          message: message.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong");
        return;
      }
      setSent(true);
      setName("");
      setMessage("");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center"
      >
        <Heart className="w-12 h-12 text-white mx-auto mb-4 fill-white" />
        <h3 className="text-xl font-bold text-white mb-2">Thank you!</h3>
        <p className="text-white/90">We&apos;re glad we could make a difference. Your kindness means a lot to us.</p>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onSubmit={handleSubmit}
      className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/20 space-y-4"
    >
      <p className="text-white/90 text-center mb-4">Want to say thanks? It&apos;s optional—just click the button, or add a name and message.</p>
      <div>
        <label htmlFor="thanks-name" className="block text-sm font-medium text-white/90 mb-1">Your name (optional)</label>
        <input
          id="thanks-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-white/30 bg-white/10 text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:border-white/50"
          placeholder="Your name"
        />
      </div>
      <div>
        <label htmlFor="thanks-message" className="block text-sm font-medium text-white/90 mb-1">Message (optional)</label>
        <textarea
          id="thanks-message"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-white/30 bg-white/10 text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:border-white/50 resize-y"
          placeholder="A few words..."
        />
      </div>
      {error && <p className="text-sm text-red-200">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-6 rounded-xl bg-white text-primary-700 font-bold text-lg hover:bg-primary-50 disabled:opacity-50 inline-flex items-center justify-center gap-2 transition-colors"
      >
        <Heart className="w-5 h-5" />
        {loading ? "Sending..." : "Thanks MoreThanMe team"}
      </button>
    </motion.form>
  );
}
