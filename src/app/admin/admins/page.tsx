"use client";

import { useState, useEffect } from "react";
import { Shield, Plus, Key, Trash2, X } from "lucide-react";
import type { AdminRole } from "@/lib/adminRoles";
import { getAdminRoleLabel } from "@/lib/adminRoles";

interface Admin {
  id: string;
  email: string;
  created_at?: string;
  role?: AdminRole;
}

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [superAdminEmail, setSuperAdminEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [updatePassword, setUpdatePassword] = useState("");
  const [newRole, setNewRole] = useState<AdminRole>("finance");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchAdmins = async () => {
    const res = await fetch("/api/admin/list", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setAdmins(data.admins || []);
    } else {
      setAdmins([]);
    }
  };

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/admin/me", { credentials: "include" });
      if (!meRes.ok) return;
      const me = await meRes.json();
      setCurrentEmail(me.email);
      setIsSuperAdmin(me.is_super_admin === true);
      setSuperAdminEmail(me.super_admin_email ?? null);
      await fetchAdmins();
    })().finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: newEmail.trim(), password: newPassword, role: newRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to create admin" });
        return;
      }
      setMessage({ type: "success", text: "Admin created." });
      setShowAddForm(false);
      setNewEmail("");
      setNewPassword("");
      setNewRole("finance");
      await fetchAdmins();
    } catch {
      setMessage({ type: "error", text: "Request failed" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/update-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: editId, password: updatePassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to update" });
        return;
      }
      setMessage({ type: "success", text: "Password updated." });
      setEditId(null);
      setUpdatePassword("");
    } catch {
      setMessage({ type: "error", text: "Request failed" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Delete admin ${email}?`)) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/delete?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to delete" });
        return;
      }
      setMessage({ type: "success", text: "Admin deleted." });
      await fetchAdmins();
    } catch {
      setMessage({ type: "error", text: "Request failed" });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });

  const handleUpdateRole = async (id: string, role: AdminRole | null) => {
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/update-role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to update role" });
        return;
      }
      setMessage({ type: "success", text: "Role updated." });
      await fetchAdmins();
    } catch {
      setMessage({ type: "error", text: "Request failed" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-6 text-amber-800 dark:text-amber-200">
        <p className="font-medium">Access denied</p>
        <p className="text-sm mt-1">Only the super admin can manage other admins.</p>
      </div>
    );
  }

  const allAdmins: Admin[] = [
    ...(admins.some((a) => superAdminEmail && a.email?.toLowerCase() === superAdminEmail.toLowerCase())
      ? []
      : superAdminEmail ? [{ id: "super-admin", email: superAdminEmail, created_at: "" }] : []),
    ...admins,
  ];

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          Manage Admins
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Create, update passwords, or remove admins. Super admin only.
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 rounded-lg p-4 ${
            message.type === "success"
              ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          Add admin
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAdd} className="mb-8 p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">New admin</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Email"
              required
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Password (min 6 chars)"
              required
              minLength={6}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <select
              value={newRole ?? ""}
              onChange={(e) => setNewRole((e.target.value || null) as AdminRole)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Select role (optional)</option>
              <option value="super">Super admin (full access)</option>
              <option value="finance">Finance</option>
              <option value="events">Events</option>
              <option value="media">Media</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium disabled:opacity-50">
              Create
            </button>
            <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Added</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {allAdmins.map((a) => {
                const isSuper = superAdminEmail ? a.email?.toLowerCase() === superAdminEmail.toLowerCase() : false;
                return (
                  <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{a.email}</td>
                    <td className="px-4 py-3">
                      {isSuper ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-xs font-medium">
                          <Shield className="w-3 h-3" />
                          Super Admin
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700 dark:text-gray-200 text-sm">
                            {getAdminRoleLabel(a.role ?? null)}
                          </span>
                          <select
                            value={a.role ?? ""}
                            onChange={(e) => handleUpdateRole(a.id, (e.target.value || null) as AdminRole | null)}
                            disabled={submitting}
                            className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                          >
                            <option value="">No role</option>
                            <option value="super">Super admin</option>
                            <option value="finance">Finance</option>
                            <option value="events">Events</option>
                            <option value="media">Media</option>
                          </select>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {a.created_at ? formatDate(a.created_at) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editId === a.id ? (
                        <form onSubmit={handleUpdatePassword} className="flex items-center justify-end gap-2">
                          <input
                            type="password"
                            value={updatePassword}
                            onChange={(e) => setUpdatePassword(e.target.value)}
                            placeholder="New password"
                            required
                            minLength={6}
                            className="w-36 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                          />
                          <button type="submit" disabled={submitting} className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                            Save
                          </button>
                          <button type="button" onClick={() => setEditId(null)} className="text-gray-500 hover:text-gray-700">
                            <X className="w-4 h-4" />
                          </button>
                        </form>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          {!isSuper && (
                            <>
                              <button
                                onClick={() => setEditId(a.id)}
                                className="inline-flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                              >
                                <Key className="w-4 h-4" />
                                Update password
                              </button>
                              <button
                                onClick={() => handleDelete(a.id, a.email)}
                                disabled={submitting}
                                className="inline-flex items-center gap-1 text-sm text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {allAdmins.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No admins in database. Add one above or run the seed.
          </div>
        )}
      </div>
    </>
  );
}
