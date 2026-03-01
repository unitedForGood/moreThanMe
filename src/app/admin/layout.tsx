"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Newspaper,
  DollarSign,
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

const navItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Manage Admins", href: "/admin/admins", icon: Shield },
  { name: "Manage Contact", href: "/admin/managecontact", icon: MessageSquare },
  { name: "Donate", href: "/admin/donate", icon: DollarSign },
  { name: "Transparency", href: "/admin/transparency", icon: Receipt },
  { name: "Team", href: "/admin/team", icon: UserCircle },
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

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setIsLoading(false);
      return;
    }
    fetch("/api/admin/me", { credentials: "include" })
      .then((res) => {
        if (res.ok) {
          setIsAuthorized(true);
        } else {
          router.replace("/admin/login");
        }
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
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    current
                      ? "bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-200 font-medium"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
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
        <div className="p-4 sm:p-6 lg:p-8 pt-16 md:pt-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      <footer className="shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-4 px-4 md:pl-64">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center sm:justify-between gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>MoreThanMe · Admin</span>
          <span>© {new Date().getFullYear()} MoreThanMe Initiative</span>
        </div>
      </footer>
    </div>
  );
}
