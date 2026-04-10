"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Newspaper,
  IndianRupee,
  LogOut,
  Menu,
  X,
  MessageSquare,
  UserCircle,
  Shield,
  ImageIcon,
  CalendarCheck,
  Receipt,
} from "lucide-react";
import type { AdminRole } from "@/lib/adminRoles";
import { canAccessAdminHref } from "@/lib/adminRoles";

const navItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Manage Admins", href: "/admin/admins", icon: Shield },
  { name: "Manage Contact", href: "/admin/managecontact", icon: MessageSquare },
  { name: "Donate", href: "/admin/donate", icon: IndianRupee },
  { name: "Transparency", href: "/admin/transparency", icon: Receipt },
  { name: "Team", href: "/admin/team", icon: UserCircle },
  { name: "Availability", href: "/admin/availability", icon: CalendarCheck },
  { name: "Our Works & Events", href: "/admin/works", icon: CalendarCheck },
  { name: "Manage Assets", href: "/admin/assets", icon: ImageIcon },
  { name: "Newsletters", href: "/admin/newsletters", icon: Newspaper },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [role, setRole] = useState<AdminRole>(null);
  const [deniedSection, setDeniedSection] = useState<string | null>(null);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setIsLoading(false);
      return;
    }
    fetch("/api/admin/me", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          router.replace("/admin/login");
          return;
        }
        const data = await res.json().catch(() => ({}));
        setIsAuthorized(true);
        const r: AdminRole | null =
          (data.role as AdminRole | undefined) ??
          (data.is_super_admin ? "super" : null);
        setRole(r);
      })
      .catch(() => router.replace("/admin/login"))
      .finally(() => setIsLoading(false));
  }, [isLoginPage, router]);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    router.push("/admin/login");
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  const isAllowedCurrent = canAccessAdminHref(role, pathname);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden flex flex-col">
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 min-h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-out md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-screen ">
          <div className="p-6 pt-14 md:pt-6 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <h1 className="text-xl font-bold text-primary-800 dark:text-primary-200">
              Admin Panel
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 break-words">
              MoreThanMe · Manage Everything
            </p>
          </div>
          <nav className="flex-1 min-h-0 p-4 space-y-1 overflow-y-auto overflow-x-hidden">
            {navItems.map((item) => {
              const Icon = item.icon;
              const current = pathname === item.href;
              const allowed = canAccessAdminHref(role, item.href);
              const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
                if (!allowed) {
                  e.preventDefault();
                  setDeniedSection(item.name);
                  setSidebarOpen(false);
                  return;
                }
                setDeniedSection(null);
                setSidebarOpen(false);
              };
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleClick}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    current
                      ? "bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-200 font-medium"
                      : allowed
                        ? "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        : "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
          <div className="p-4 pb-6 border-t border-gray-200 dark:border-gray-700 shrink-0">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className={`flex-1 min-h-0 ${sidebarOpen ? "pl-64" : ""} md:pl-64`}>
        <div className="p-4 sm:p-6 lg:p-8 pt-16 md:pt-8 max-w-7xl mx-auto space-y-4">
          {!isAllowedCurrent && pathname !== "/admin" && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 text-amber-900 px-4 py-3 text-sm">
              <p className="font-semibold">Permission denied</p>
              <p className="mt-1">
                You don&apos;t have permission to access the{" "}
                    {navItems.find((n) => n.href === pathname)?.name ?? "selected"}{" "}
                    section. Please contact a super admin if you think this is a mistake.
              </p>
            </div>
          )}
          {deniedSection && isAllowedCurrent && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 text-amber-900 px-4 py-3 text-sm">
                  You don&apos;t have permission to access the {deniedSection} section.
            </div>
          )}
          {isAllowedCurrent && children}
        </div>
      </main>

      <footer className="shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-4 px-4 md:pl-64">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center sm:justify-between gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>MoreThanMe · Admin</span>
        </div>
      </footer>
    </div>
  );
}
