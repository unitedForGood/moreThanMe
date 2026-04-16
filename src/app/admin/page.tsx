"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  IndianRupee,
  UserCircle,
  Newspaper,
  ArrowRight,
  Shield,
  ImageIcon,
} from "lucide-react";
import type { AdminRole } from "@/lib/adminRoles";
import { canAccessAdminHref } from "@/lib/adminRoles";
import DashboardAnalytics from "./components/DashboardAnalytics";

const sections = [
  {
    title: "Manage Admins",
    description: "Create, delete, or update passwords for admin users. Super admin only.",
    href: "/admin/admins",
    icon: Shield,
    color: "bg-indigo-500",
  },
  {
    title: "Manage Contact",
    description: "View and manage contact form submissions and contact details.",
    href: "/admin/managecontact",
    icon: MessageSquare,
    color: "bg-blue-500",
  },
  {
    title: "Donate",
    description: "Verify and manage donations, view stats and receipts.",
    href: "/admin/donate",
    icon: IndianRupee,
    color: "bg-amber-500",
  },
  {
    title: "Team",
    description: "Everyone who joins via Join Us appears here. Assign roles (Volunteer, Core, etc.), mark Founding members, and manage who appears on Our Family.",
    href: "/admin/team",
    icon: UserCircle,
    color: "bg-violet-500",
  },
  {
    title: "Manage Assets",
    description: "Upload and manage images and videos for the main page gallery.",
    href: "/admin/assets",
    icon: ImageIcon,
    color: "bg-teal-500",
  },
  {
    title: "Newsletters",
    description: "Add and manage newsletters (PDFs in storage).",
    href: "/admin/newsletters",
    icon: Newspaper,
    color: "bg-rose-500",
  },
];

export default function AdminPage() {
  const [role, setRole] = useState<AdminRole>(null);
  const [deniedSection, setDeniedSection] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/me", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        const r: AdminRole | null =
          (data.role as AdminRole | undefined) ??
          (data.is_super_admin ? "super" : null);
        setRole(r);
      } catch {
        // ignore, layout will handle auth redirect
      }
    })();
  }, []);

  return (
    <>
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Choose a section below to manage your site. All data uses the same Supabase DB.
        </p>
      </div>

      {deniedSection && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 px-4 py-3 text-sm">
          You don&apos;t have permission to access the {deniedSection} section from your
          account.
        </div>
      )}

      <DashboardAnalytics role={role} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => {
          const Icon = section.icon;
          const allowed = canAccessAdminHref(role, section.href);
          return (
            <Link
              key={section.href}
              href={section.href}
              onClick={(e) => {
                if (!allowed) {
                  e.preventDefault();
                  setDeniedSection(section.title);
                } else {
                  setDeniedSection(null);
                }
              }}
              className={`group flex flex-col rounded-xl border transition-all duration-200 overflow-hidden ${
                allowed
                  ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-lg"
                  : "bg-gray-100 dark:bg-gray-800/70 border-dashed border-gray-300 dark:border-gray-600 cursor-not-allowed opacity-70"
              }`}
            >
              <div className={`${section.color} p-4 flex items-center justify-center`}>
                <Icon className="w-10 h-10 text-white" />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {section.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                  {section.description}
                </p>
                {allowed ? (
                  <span className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-primary-600 dark:text-primary-400 group-hover:gap-2 transition-all">
                    Open
                    <ArrowRight className="w-4 h-4" />
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 mt-4 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Permission required
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-10 p-4 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
        <p className="text-sm text-primary-800 dark:text-primary-200">
          <strong>Quick stats:</strong> Use Donate for donation verification, Team to manage everyone who joined (volunteers + roles), and Newsletters to publish PDFs.
        </p>
      </div>
    </>
  );
}
