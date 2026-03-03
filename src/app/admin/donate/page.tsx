"use client";

import { useState, useEffect } from "react";

interface Donation {
  id: string;
  name: string;
  amount: number;
  transaction_id: string;
  status: string;
  created_at?: unknown;
  receipt_date_time?: string | null;
  receipt_parsed_data?: { date_time?: string | null } | null;
  receipt_processing_status?: string;
  receipt_confidence?: number;
}

function toDate(val: unknown): Date | null {
  if (!val) return null;
  const v = val as { toDate?: () => Date; seconds?: number; _seconds?: number };
  if (typeof v.toDate === "function") return v.toDate();
  if (typeof v.seconds === "number") return new Date(v.seconds * 1000);
  if (typeof v._seconds === "number") return new Date(v._seconds * 1000);
  const d = new Date(val as string | number);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function AdminDonatePage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    totalAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formTxId, setFormTxId] = useState("");
  const [formStatus, setFormStatus] = useState("pending_verification");
  const [formPhone, setFormPhone] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animatedTotalAmount, setAnimatedTotalAmount] = useState(0);

  const fetchDonations = async () => {
    const res = await fetch("/api/admin/donations", { credentials: "include" });
    const data = await res.json().catch(() => []);
    if (Array.isArray(data)) setDonations(data);
  };

  const fetchStats = async () => {
    const res = await fetch("/api/admin/donation-stats", { credentials: "include" });
    const data = await res.json().catch(() => ({}));
    setStats({
      total: data.total_donations ?? 0,
      verified: data.verified_donations ?? 0,
      pending: data.pending_donations ?? 0,
      totalAmount: data.total_amount_verified ?? 0,
    });
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchDonations(), fetchStats()]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const target = stats.totalAmount;
    let frameId: number;
    const duration = 800; // ms
    const start = performance.now();
    const initial = animatedTotalAmount;

    const animate = (time: number) => {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      const value = initial + (target - initial) * progress;
      setAnimatedTotalAmount(Math.round(value));
      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.totalAmount]);

  const resetForm = () => {
    setFormName("");
    setFormAmount("");
    setFormTxId("");
    setFormStatus("pending_verification");
    setFormPhone("");
    setFormMessage("");
    setEditingId(null);
  };

  const startAdd = () => {
    resetForm();
    setAdding(true);
    setError(null);
  };

  const startEdit = (d: Donation & { phone?: string | null; message?: string | null }) => {
    setEditingId(d.id);
    setAdding(false);
    setFormName(d.name);
    setFormAmount(String(d.amount));
    setFormTxId(d.transaction_id);
    setFormStatus(d.status);
    setFormPhone((d as any).phone || "");
    setFormMessage((d as any).message || "");
    setError(null);
  };

  const submitForm = async () => {
    const amt = Number(formAmount);
    if (!formName.trim() || !formTxId.trim() || Number.isNaN(amt) || amt <= 0) {
      setError("Name, amount (> 0), and transaction ID are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: formName.trim(),
        amount: amt,
        transaction_id: formTxId.trim(),
        status: formStatus,
        phone: formPhone.trim() || null,
        message: formMessage.trim() || null,
      };
      const res = await fetch("/api/admin/donations" + (editingId ? "" : ""), {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Failed to save donation.");
        return;
      }
      resetForm();
      setAdding(false);
      await Promise.all([fetchDonations(), fetchStats()]);
    } finally {
      setSaving(false);
    }
  };

  const deleteDonation = async (id: string, tx: string) => {
    if (!confirm(`Delete donation with transaction ID ${tx}? This cannot be undone.`)) return;
    setUpdatingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/donations?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Failed to delete donation.");
        return;
      }
      await Promise.all([fetchDonations(), fetchStats()]);
    } finally {
      setUpdatingId(null);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    const res = await fetch("/api/admin/donations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      await fetchDonations();
      await fetchStats();
    }
    setUpdatingId(null);
  };

  const formatDate = (d: Donation) => {
    const date = toDate(d.receipt_date_time ?? d.receipt_parsed_data?.date_time ?? d.created_at);
    return date ? date.toLocaleString("en-IN", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          Donate
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Verify and manage donations. Same Supabase DB as the main site.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={startAdd}
          className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
        >
          + Add manual donation
        </button>
        {editingId && (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Editing donation: <code className="px-1 rounded bg-gray-100 dark:bg-gray-800 text-xs">{formTxId}</code>
          </span>
        )}
      </div>

      {(adding || editingId) && (
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
            {editingId ? "Edit donation" : "Add manual donation"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Donor name *"
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
            />
            <input
              type="number"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              placeholder="Amount (₹) *"
              min={1}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
            />
            <input
              type="text"
              value={formTxId}
              onChange={(e) => setFormTxId(e.target.value)}
              placeholder="Transaction ID *"
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
            />
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
            >
              <option value="pending_verification">Pending verification</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              placeholder="Phone (optional)"
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
            />
            <input
              type="text"
              value={formMessage}
              onChange={(e) => setFormMessage(e.target.value)}
              placeholder="Message / note (optional)"
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
            />
          </div>
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submitForm}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Save changes" : "Add donation"}
            </button>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setAdding(false);
              }}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Verified</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.verified}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Pending</p>
          <p className="text-xl font-bold text-yellow-600 dark:text-yellow-500">{stats.pending}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount (₹)</p>
          <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
            {animatedTotalAmount.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Donor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {donations.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 dark:text-white">{d.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{d.transaction_id}</div>
                  </td>
                  <td className="px-4 py-3 font-medium">₹{d.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        d.status === "verified"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : d.status === "rejected"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatDate(d)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {d.status === "pending_verification" && (
                        <>
                          <button
                            onClick={() => updateStatus(d.id, "verified")}
                            disabled={updatingId === d.id}
                            className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 font-medium disabled:opacity-50"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => updateStatus(d.id, "rejected")}
                            disabled={updatingId === d.id}
                            className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 font-medium disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => startEdit(d as any)}
                        className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteDonation(d.id, d.transaction_id)}
                        disabled={updatingId === d.id}
                        className="text-sm text-red-600 dark:text-red-400 font-medium hover:underline disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {donations.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">No donations yet.</div>
        )}
      </div>
    </>
  );
}
