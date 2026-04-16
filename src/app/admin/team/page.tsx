"use client";

import { useState, useEffect } from "react";
import { Users, Mail, Phone, Search, Heart } from "lucide-react";
import Link from "next/link";
import CloudinaryUpload from "@/components/CloudinaryUpload";

const ROLE_OPTIONS = [
  "Volunteer",
  "Finance Manager",
  "POC",
  "Outreaches",
  "Social Media",
  "Event & Resource Management",
  "Media Management",
  "Finance & Social Media",
  "Other",
] as const;

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email?: string | null;
  phone?: string | null;
  image_url?: string | null;
  sort_order: number;
  is_founding_member?: boolean;
  is_core_member?: boolean;
  enrollment?: string | null;
  batch?: string | null;
  course?: string | null;
  why_join?: string | null;
  approval_status?: string | null;
}

interface Donor {
  id: string;
  name: string;
  status?: string;
  message?: string | null;
  created_at?: unknown;
}

type FilterTab = "all" | "pending" | "founding" | "core" | "volunteers" | "donors" | "our_family";

export default function AdminTeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editRoleOther, setEditRoleOther] = useState("");
  const [editIsFoundingMember, setEditIsFoundingMember] = useState(false);
  const [editIsCoreMember, setEditIsCoreMember] = useState(false);
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editEnrollment, setEditEnrollment] = useState("");
  const [editBatch, setEditBatch] = useState("");
  const [editCourse, setEditCourse] = useState("");
  const [editWhyJoin, setEditWhyJoin] = useState("");
  const [editApprovalStatus, setEditApprovalStatus] = useState("approved");
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("Volunteer");
  const [newRoleOther, setNewRoleOther] = useState("");
  const [newIsFoundingMember, setNewIsFoundingMember] = useState(false);
  const [newIsCoreMember, setNewIsCoreMember] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newEnrollment, setNewEnrollment] = useState("");
  const [newBatch, setNewBatch] = useState("");
  const [newCourse, setNewCourse] = useState("");
  const [newWhyJoin, setNewWhyJoin] = useState("");

  const fetchTeam = async () => {
    const res = await fetch("/api/admin/team", { credentials: "include" });
    const data = await res.json().catch(() => []);
    setTeam(Array.isArray(data) ? data : []);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teamRes, donorsRes] = await Promise.all([
        fetch("/api/admin/team", { credentials: "include" }),
        fetch("/api/donations/donors"),
      ]);
      const teamData = await teamRes.json().catch(() => []);
      const donorsData = await donorsRes.json().catch(() => []);
      setTeam(Array.isArray(teamData) ? teamData : []);
      setDonors(Array.isArray(donorsData) ? donorsData : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const startEdit = (m: TeamMember) => {
    setEditingId(m.id);
    setEditName(m.name);
    const roleInList = ROLE_OPTIONS.includes(m.role as (typeof ROLE_OPTIONS)[number]);
    setEditRole(roleInList ? m.role : "Other");
    setEditRoleOther(roleInList ? "" : m.role);
    setEditIsFoundingMember(!!m.is_founding_member);
    setEditIsCoreMember(!!m.is_core_member);
    setEditEmail(m.email || "");
    setEditPhone(m.phone || "");
    setEditImageUrl(m.image_url || "");
    setEditEnrollment(m.enrollment || "");
    setEditBatch(m.batch || "");
    setEditCourse(m.course || "");
    setEditWhyJoin(m.why_join || "");
    setEditApprovalStatus(m.approval_status || "approved");
  };

  const cancelEdit = () => setEditingId(null);

  const resolvedEditRole = editRole === "Other" ? editRoleOther.trim() : editRole;

  const saveEdit = async () => {
    if (!editingId) return;
    if (!resolvedEditRole) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/team?id=${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: editName,
          role: resolvedEditRole,
          email: editEmail || null,
          phone: editPhone || null,
          image_url: editImageUrl || null,
          is_founding_member: editIsFoundingMember,
          is_core_member: editIsCoreMember,
          enrollment: editEnrollment.trim() || null,
          batch: editBatch.trim() || null,
          course: editCourse.trim() || null,
          why_join: editWhyJoin.trim() || null,
          approval_status: editApprovalStatus,
        }),
      });
      if (res.ok) {
        await fetchData();
        setEditingId(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (id: string) => {
    if (!confirm("Remove this team member?")) return;
    const res = await fetch(`/api/admin/team?id=${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) await fetchData();
    if (editingId === id) setEditingId(null);
  };

  const updateApprovalStatus = async (id: string, status: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/team?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ approval_status: status }),
      });
      if (res.ok) await fetchData();
    } finally {
      setSaving(false);
    }
  };

  const resolvedNewRole = newRole === "Other" ? newRoleOther.trim() : newRole;

  const addMember = async () => {
    if (!newName.trim() || !resolvedNewRole) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: newName.trim(),
          role: resolvedNewRole,
          email: newEmail.trim() || null,
          phone: newPhone.trim() || null,
          image_url: newImageUrl || null,
          sort_order: team.length,
          is_founding_member: newIsFoundingMember,
          is_core_member: newIsCoreMember,
          enrollment: newEnrollment.trim() || null,
          batch: newBatch.trim() || null,
          course: newCourse.trim() || null,
          why_join: newWhyJoin.trim() || null,
        }),
      });
      if (res.ok) {
        await fetchData();
        setAdding(false);
        setNewName("");
        setNewRole("Volunteer");
        setNewRoleOther("");
        setNewIsFoundingMember(false);
        setNewIsCoreMember(false);
        setNewEmail("");
        setNewPhone("");
        setNewImageUrl("");
        setNewEnrollment("");
        setNewBatch("");
        setNewCourse("");
        setNewWhyJoin("");
      }
    } finally {
      setSaving(false);
    }
  };

  const tabFilteredTeam = (() => {
    switch (filterTab) {
      case "pending":
        return team.filter((m) => m.approval_status === "pending");
      case "founding":
        return team.filter((m) => m.is_founding_member);
      case "core":
        return team.filter((m) => m.is_core_member);
      case "volunteers":
        return team.filter((m) => m.role === "Volunteer");
      case "donors":
      case "our_family":
        return team;
      default:
        return team;
    }
  })();

  const searchLower = searchQuery.trim().toLowerCase();
  const filteredTeam = searchLower
    ? tabFilteredTeam.filter((m) => {
        const name = (m.name || "").toLowerCase();
        const email = (m.email || "").toLowerCase();
        const phone = (m.phone || "").toLowerCase();
        const enrollment = (m.enrollment || "").toLowerCase();
        const batch = (m.batch || "").toLowerCase();
        const course = (m.course || "").toLowerCase();
        const role = (m.role || "").toLowerCase();
        const whyJoin = (m.why_join || "").toLowerCase();
        return (
          name.includes(searchLower) ||
          email.includes(searchLower) ||
          phone.includes(searchLower) ||
          enrollment.includes(searchLower) ||
          batch.includes(searchLower) ||
          course.includes(searchLower) ||
          role.includes(searchLower) ||
          whyJoin.includes(searchLower)
        );
      })
    : tabFilteredTeam;

  const filteredDonors = searchLower
    ? donors.filter((d) => {
        const name = (d.name || "").toLowerCase();
        const message = (d.message || "").toLowerCase();
        return name.includes(searchLower) || message.includes(searchLower);
      })
    : donors;

  type FamilyItem = { _type: "donor"; donor: Donor } | { _type: "team"; member: TeamMember };
  const ourFamilyList: FamilyItem[] = [
    ...donors.map((donor) => ({ _type: "donor" as const, donor })),
    ...team.map((member) => ({ _type: "team" as const, member })),
  ];
  const filteredOurFamily = searchLower
    ? ourFamilyList.filter((item) => {
        if (item._type === "donor") {
          const name = (item.donor.name || "").toLowerCase();
          const message = (item.donor.message || "").toLowerCase();
          return name.includes(searchLower) || message.includes(searchLower);
        }
        const m = item.member;
        const name = (m.name || "").toLowerCase();
        const email = (m.email || "").toLowerCase();
        const role = (m.role || "").toLowerCase();
        return name.includes(searchLower) || email.includes(searchLower) || role.includes(searchLower);
      })
    : ourFamilyList;

  const counts = {
    all: team.length,
    pending: team.filter((m) => m.approval_status === "pending").length,
    founding: team.filter((m) => m.is_founding_member).length,
    core: team.filter((m) => m.is_core_member).length,
    volunteers: team.filter((m) => m.role === "Volunteer").length,
    donors: donors.length,
    our_family: donors.length + team.length,
  };

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "founding", label: "Founding team", count: counts.founding },
    { key: "core", label: "Core team", count: counts.core },
    { key: "volunteers", label: "Volunteers", count: counts.volunteers },
    { key: "donors", label: "Donors", count: counts.donors },
    { key: "our_family", label: "Our family", count: counts.our_family },
  ];

  return (
    <>
      <div className="mb-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm mb-4">
          ← Dashboard
        </Link>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Team</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Team from <a href="/joinUs" className="text-primary-600 dark:text-primary-400 underline" target="_blank" rel="noopener noreferrer">Join Us</a> (Firestore <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">team_members</code>) and donors from verified donations. Use tabs to filter by Founding team, Core team, Volunteers, Donors, or view Our family (everyone).
        </p>
      </div>

      {loading ? (
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, enrollment, role..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            {tabs.map(({ key, label, count }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilterTab(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterTab === key
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {label} <span className="opacity-80">({count})</span>
              </button>
            ))}
          </div>

          {filterTab === "donors" &&
            filteredDonors.map((donor) => (
              <div
                key={`donor-${donor.id}`}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center shrink-0">
                    <Heart className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 dark:text-white">{donor.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 font-medium">
                        Donor
                      </span>
                    </div>
                    {donor.message && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">&ldquo;{donor.message}&rdquo;</p>
                    )}
                    {donor.status && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">Status: {donor.status}</span>
                    )}
                  </div>
                </div>
                <Link
                  href="/admin/donate"
                  className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline"
                >
                  Manage in Donate
                </Link>
              </div>
            ))}

          {filterTab === "our_family" &&
            filteredOurFamily.map((item) =>
              item._type === "donor" ? (
                <div
                  key={`donor-${item.donor.id}`}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center shrink-0">
                      <Heart className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">{item.donor.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 font-medium">Donor</span>
                      </div>
                      {item.donor.message && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">&ldquo;{item.donor.message}&rdquo;</p>}
                    </div>
                  </div>
                  <Link href="/admin/donate" className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline">Donate</Link>
                </div>
              ) : (
                <div
                  key={`team-${item.member.id}`}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center shrink-0 overflow-hidden">
                      {item.member.image_url ? (
                        <img src={item.member.image_url} alt={item.member.name} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900 dark:text-white">{item.member.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 font-medium">Team</span>
                        {item.member.is_founding_member && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-medium">Founding</span>}
                        {item.member.is_core_member && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-medium">Core</span>}
                      </div>
                      <div className="text-sm text-primary-600 dark:text-primary-400">{item.member.role}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(item.member)} className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline">Edit</button>
                    <button onClick={() => removeMember(item.member.id)} className="text-sm text-red-600 dark:text-red-400 font-medium hover:underline">Remove</button>
                  </div>
                </div>
              )
            )}

          {filterTab !== "donors" && filterTab !== "our_family" && filteredTeam.map((member) => (
            <div
              key={member.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-wrap items-center justify-between gap-4"
            >
              {editingId === member.id ? (
                <>
                  <div className="flex flex-wrap gap-3 flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <CloudinaryUpload
                        onUpload={(url) => setEditImageUrl(url)}
                        folder="morethanme/team"
                        accept="image/*"
                        maxSizeMB={2}
                      />
                      {editImageUrl && <span className="text-xs text-green-600">Photo set</span>}
                    </div>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Name"
                      className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[140px]"
                    />
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[180px]"
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    {editRole === "Other" && (
                      <input
                        type="text"
                        value={editRoleOther}
                        onChange={(e) => setEditRoleOther(e.target.value)}
                        placeholder="Custom role"
                        className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[140px]"
                      />
                    )}
                    <label className="flex items-center gap-2 cursor-pointer shrink-0">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Founding member</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={editIsFoundingMember}
                        onClick={() => setEditIsFoundingMember((v) => !v)}
                        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 transition-colors ${editIsFoundingMember ? "bg-primary-600 border-primary-600" : "bg-gray-200 dark:bg-gray-600 border-gray-300 dark:border-gray-500"}`}
                      >
                        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${editIsFoundingMember ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer shrink-0">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Core member</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={editIsCoreMember}
                        onClick={() => setEditIsCoreMember((v) => !v)}
                        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 transition-colors ${editIsCoreMember ? "bg-primary-600 border-primary-600" : "bg-gray-200 dark:bg-gray-600 border-gray-300 dark:border-gray-500"}`}
                      >
                        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${editIsCoreMember ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="Email"
                      className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[180px]"
                    />
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="Phone"
                      className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[140px]"
                    />
                    <input
                      type="text"
                      value={editEnrollment}
                      onChange={(e) => setEditEnrollment(e.target.value)}
                      placeholder="Enrollment"
                      className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[120px]"
                    />
                    <input
                      type="text"
                      value={editBatch}
                      onChange={(e) => setEditBatch(e.target.value)}
                      placeholder="Batch"
                      className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[80px]"
                    />
                    <input
                      type="text"
                      value={editCourse}
                      onChange={(e) => setEditCourse(e.target.value)}
                      placeholder="Course"
                      className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[100px]"
                    />
                    <textarea
                      value={editWhyJoin}
                      onChange={(e) => setEditWhyJoin(e.target.value)}
                      placeholder="Why join"
                      rows={2}
                      className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[200px]"
                    />
                    <select
                      value={editApprovalStatus}
                      onChange={(e) => setEditApprovalStatus(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[140px]"
                    >
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveEdit} disabled={saving || !resolvedEditRole} className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                      Save
                    </button>
                    <button onClick={cancelEdit} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center shrink-0 overflow-hidden">
                      {member.image_url ? (
                        <img src={member.image_url} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900 dark:text-white">{member.name}</span>
                        {member.is_founding_member && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 font-medium">
                            Founding
                          </span>
                        )}
                        {member.is_core_member && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-medium">
                            Core
                          </span>
                        )}
                        {member.approval_status === "pending" && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 font-medium border border-amber-200 dark:border-amber-800">
                            Pending Approval
                          </span>
                        )}
                        {member.approval_status === "rejected" && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 font-medium border border-red-200 dark:border-red-800">
                            Rejected
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-primary-600 dark:text-primary-400">{member.role}</div>
                      {(member.enrollment || member.batch || member.course) && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {[member.enrollment, member.batch, member.course].filter(Boolean).join(" · ")}
                        </div>
                      )}
                      {(member.email || member.phone) && (
                        <div className="flex gap-2 mt-1 text-gray-500 dark:text-gray-400 text-xs">
                          {member.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {member.email}</span>}
                          {member.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {member.phone}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 items-center flex-wrap">
                    {member.approval_status === "pending" && (
                      <>
                        <button onClick={() => updateApprovalStatus(member.id, "approved")} className="text-sm px-3 py-1.5 rounded-lg bg-green-500 text-white font-medium hover:bg-green-600 transition-colors">
                          Approve
                        </button>
                        <button onClick={() => updateApprovalStatus(member.id, "rejected")} className="text-sm px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                          Reject
                        </button>
                      </>
                    )}
                    <button onClick={() => startEdit(member)} className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline">
                      Edit
                    </button>
                    <button onClick={() => removeMember(member.id)} className="text-sm text-red-600 dark:text-red-400 font-medium hover:underline">
                      Remove
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {filterTab === "donors" && filteredDonors.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
              {searchQuery.trim() ? (
                <>No donors match &ldquo;{searchQuery.trim()}&rdquo;. <button type="button" onClick={() => setSearchQuery("")} className="text-primary-600 dark:text-primary-400 font-medium hover:underline">Clear search</button></>
              ) : (
                <>No verified donors yet. Donors appear here from <Link href="/admin/donate" className="text-primary-600 dark:text-primary-400 underline">Donate</Link> when verified.</>
              )}
            </div>
          )}

          {filterTab === "our_family" && filteredOurFamily.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
              {searchQuery.trim() ? (
                <>No one matches &ldquo;{searchQuery.trim()}&rdquo;. <button type="button" onClick={() => setSearchQuery("")} className="text-primary-600 dark:text-primary-400 font-medium hover:underline">Clear search</button></>
              ) : (
                <>No donors or team members yet. Add people via <Link href="/joinUs" className="text-primary-600 dark:text-primary-400 underline">Join Us</Link> or they appear as donors when verified in <Link href="/admin/donate" className="text-primary-600 dark:text-primary-400 underline">Donate</Link>.</>
              )}
            </div>
          )}

          {filterTab !== "donors" && filterTab !== "our_family" && filteredTeam.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
              {searchQuery.trim() ? (
                <>No members match &ldquo;{searchQuery.trim()}&rdquo;. Try a different search or <button type="button" onClick={() => setSearchQuery("")} className="text-primary-600 dark:text-primary-400 font-medium hover:underline">clear search</button>.</>
              ) : (
                <>No members in this filter.{filterTab !== "all" && (<> Switch to <button type="button" onClick={() => setFilterTab("all")} className="text-primary-600 dark:text-primary-400 font-medium hover:underline">All</button> or </>)} add a member below.</>
              )}
            </div>
          )}

          {filterTab !== "donors" && adding ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-4 space-y-3">
              <div className="flex flex-wrap gap-3 items-center">
                <CloudinaryUpload onUpload={(url) => setNewImageUrl(url)} folder="morethanme/team" accept="image/*" maxSizeMB={2} />
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[140px]" />
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[180px]"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {newRole === "Other" && (
                  <input
                    type="text"
                    value={newRoleOther}
                    onChange={(e) => setNewRoleOther(e.target.value)}
                    placeholder="Custom role"
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[140px]"
                  />
                )}
                <label className="flex items-center gap-2 cursor-pointer shrink-0">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Founding</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={newIsFoundingMember}
                    onClick={() => setNewIsFoundingMember((v) => !v)}
                    className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 transition-colors ${newIsFoundingMember ? "bg-primary-600 border-primary-600" : "bg-gray-200 dark:bg-gray-600 border-gray-300 dark:border-gray-500"}`}
                  >
                    <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${newIsFoundingMember ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </label>
                <label className="flex items-center gap-2 cursor-pointer shrink-0">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Core</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={newIsCoreMember}
                    onClick={() => setNewIsCoreMember((v) => !v)}
                    className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 transition-colors ${newIsCoreMember ? "bg-primary-600 border-primary-600" : "bg-gray-200 dark:bg-gray-600 border-gray-300 dark:border-gray-500"}`}
                  >
                    <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${newIsCoreMember ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </label>
                <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email" className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[180px]" />
                <input type="text" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Phone" className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[140px]" />
                <input type="text" value={newEnrollment} onChange={(e) => setNewEnrollment(e.target.value)} placeholder="Enrollment" className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[120px]" />
                <input type="text" value={newBatch} onChange={(e) => setNewBatch(e.target.value)} placeholder="Batch" className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[80px]" />
                <input type="text" value={newCourse} onChange={(e) => setNewCourse(e.target.value)} placeholder="Course" className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[100px]" />
                <input type="text" value={newWhyJoin} onChange={(e) => setNewWhyJoin(e.target.value)} placeholder="Why join (optional)" className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[160px]" />
              </div>
              <div className="flex gap-2">
                <button onClick={addMember} disabled={saving || !newName.trim() || !resolvedNewRole} className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                  Add member
                </button>
                <button onClick={() => setAdding(false)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm">
                  Cancel
                </button>
              </div>
            </div>
          ) : filterTab !== "donors" ? (
            <button
              onClick={() => setAdding(true)}
              className="w-full mt-6 px-4 py-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 text-sm font-medium transition-colors"
            >
              + Add team member
            </button>
          ) : null}
        </div>
      )}
    </>
  );
}
