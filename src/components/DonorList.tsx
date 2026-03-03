"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, Users } from "lucide-react";

interface Donor {
  id: string;
  name: string;
  status?: string;
  message?: string;
  created_at?: unknown;
  receipt_date_time?: string | null;
  receipt_parsed_data?: { date_time?: string | null } | null;
}

function formatDate(dateVal: unknown): string {
  if (dateVal == null || dateVal === "") return "—";
  const date =
    dateVal && typeof (dateVal as { toDate?: () => Date }).toDate === "function"
      ? (dateVal as { toDate: () => Date }).toDate()
      : new Date(dateVal as string | number);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function DonorList() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/donations/donors")
      .then((r) => r.json())
      .then((data) => setDonors(Array.isArray(data) ? data : []))
      .catch(() => setDonors([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-600 border-t-transparent mx-auto mb-4" />
        <p className="text-neutral-600">Loading our donors...</p>
      </div>
    );
  }

  if (donors.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Heart className="w-8 h-8 text-primary-600" />
        </div>
        <h3 className="text-xl font-bold text-primary-800 mb-2">No donors yet</h3>
        <p className="text-neutral-600">Be the first to support our mission. Your donation will appear here once verified.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="bg-white rounded-2xl shadow-sm border border-primary-100 overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[400px]">
          <thead className="bg-primary-50">
            <tr>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">#</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Name</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {donors.map((donor, index) => (
              <tr key={donor.id} className="hover:bg-primary-50/50 transition-colors">
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">{index + 1}</td>
                <td className="px-4 sm:px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-primary-600 font-bold text-sm">{donor.name?.charAt(0)?.toUpperCase() || "?"}</span>
                    </div>
                    <div>
                      <div className="font-medium text-neutral-900">{donor.name || "Anonymous"}</div>
                      {donor.status && <div className="text-xs text-neutral-500">{donor.status}</div>}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 sm:px-6 py-3 bg-neutral-50 border-t border-neutral-100 flex items-center justify-center gap-2 text-sm text-neutral-600">
        <Users className="w-4 h-4" />
        <span>{donors.length} verified donor{donors.length !== 1 ? "s" : ""}</span>
      </div>
    </motion.div>
  );
}
