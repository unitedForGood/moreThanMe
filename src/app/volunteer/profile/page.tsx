"use client";

import { useState, useEffect } from "react";
import {
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Check,
  Shield,
  X,
  Camera,
  ChevronRight,
} from "lucide-react";
import CloudinaryUpload from "@/components/CloudinaryUpload";

interface VolunteerProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  is_founding_member: boolean;
  is_core_member: boolean;
  image_url: string | null;
  why_join: string | null;
  has_default_password: boolean;
}

export default function VolunteerProfilePage() {
  const [profile, setProfile] = useState<VolunteerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [phone, setPhone] = useState("");
  const [whyJoin, setWhyJoin] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Toast
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/volunteer/auth/me", {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json();
      const v = data.volunteer;
      setProfile(v);
      setPhone(v.phone || "");
      setWhyJoin(v.why_join || "");
      setImageUrl(v.image_url || "");
    } catch (e) {
      console.error("Failed to fetch profile:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/volunteer/auth/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          phone: phone.trim() || null,
          why_join: whyJoin.trim() || null,
          image_url: imageUrl.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to update profile", "error");
        return;
      }
      showToast("Profile updated successfully!", "success");
      if (data.volunteer) setProfile(data.volunteer);
    } catch {
      showToast("Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      showToast("Please enter your current password", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("New password must be at least 6 characters", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch("/api/volunteer/auth/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to change password", "error");
        return;
      }
      showToast("Password changed successfully!", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      if (data.volunteer) setProfile(data.volunteer);
    } catch {
      showToast("Failed to change password", "error");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!profile) return null;

  const roleLabel = profile.is_founding_member
    ? "Founding Member"
    : profile.is_core_member
      ? "Core Member"
      : profile.role || "Volunteer";

  const initials = profile.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Profile Settings
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Manage your personal information and security
        </p>
      </div>

      {/* Default Password Alert */}
      {profile.has_default_password && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
              Update your password
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
              You&apos;re using your email as your password. Scroll down to set a new one.
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-400 flex-shrink-0" />
        </div>
      )}

      {/* Two-column layout on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ─── Left Column: Profile Card ─── */}
        <div className="lg:col-span-4 space-y-6">
          {/* Profile card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Gradient header */}
            <div className="h-24 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 relative">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-30" />
            </div>

            {/* Avatar + Info */}
            <div className="px-5 pb-5 -mt-10">
              <div className="relative inline-block">
                <div className="w-20 h-20 rounded-xl bg-white dark:bg-gray-800 border-[3px] border-white dark:border-gray-800 shadow-lg overflow-hidden">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                      <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                        {initials}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-3">
                {profile.name}
              </h2>
              <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-100 dark:border-primary-800/50">
                {roleLabel}
              </span>

              {/* Quick info */}
              <div className="mt-4 space-y-2.5">
                <div className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                  <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <span className="truncate">{profile.email}</span>
                </div>
                {phone && (
                  <div className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                    <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <span>{phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Right Column: Edit Forms ─── */}
        <div className="lg:col-span-8 space-y-6">
          {/* Personal Information */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Personal Information
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Update your details and profile photo
                </p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Photo */}
              <div>
                <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Profile Photo
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-gray-100 dark:border-gray-700 flex-shrink-0 bg-gray-50 dark:bg-gray-700/30">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <CloudinaryUpload
                      onUpload={(url) => {
                        if (url) setImageUrl(url);
                      }}
                      folder="morethanme/team"
                      accept="image/*"
                      maxSizeMB={5}
                      public
                      buttonLabel={imageUrl ? "Change" : "Upload"}
                    />
                    {imageUrl && (
                      <button
                        type="button"
                        onClick={() => setImageUrl("")}
                        className="px-3 py-2 rounded-lg text-[13px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Two-column form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Name (read-only) */}
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={profile.name}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30 text-gray-500 dark:text-gray-400 text-sm cursor-not-allowed"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400">Managed by admin</p>
                </div>

                {/* Email (read-only) */}
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30 text-gray-500 dark:text-gray-400 text-sm cursor-not-allowed"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400">Cannot be changed</p>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="profile-phone"
                  className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Phone Number
                </label>
                <div className="relative max-w-sm">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="profile-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Why Join */}
              <div>
                <label
                  htmlFor="profile-why-join"
                  className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Why do you want to join us?
                </label>
                <textarea
                  id="profile-why-join"
                  value={whyJoin}
                  onChange={(e) => setWhyJoin(e.target.value)}
                  placeholder="Share your motivation for volunteering with MoreThanMe..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 transition-all text-sm resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Save footer */}
            <div className="px-6 py-4 bg-gray-50/80 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-end gap-3">
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md hover:shadow-primary-600/15"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Save Changes
              </button>
            </div>
          </div>

          {/* ─── Security / Password ─── */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700/60">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Security
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Update your password to keep your account secure
              </p>
            </div>

            <div className="p-6 space-y-5">
              {/* Current Password */}
              <div className="max-w-md">
                <label
                  htmlFor="current-password"
                  className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {profile.has_default_password && (
                  <p className="mt-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    Your current password is your email address
                  </p>
                )}
              </div>

              {/* New + Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      autoComplete="new-password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      autoComplete="new-password"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 transition-all text-sm"
                    />
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="mt-1.5 text-[11px] text-red-600 dark:text-red-400 font-medium">
                      Passwords do not match
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Save footer */}
            <div className="px-6 py-4 bg-gray-50/80 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-end gap-3">
              <button
                onClick={handleChangePassword}
                disabled={
                  changingPassword ||
                  !currentPassword ||
                  !newPassword ||
                  newPassword !== confirmPassword
                }
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {changingPassword ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                Update Password
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.type === "success" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
