"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LogOut, Loader2, CalendarDays, User, Shield } from "lucide-react";

interface VolunteerInfo {
  name: string;
  email: string;
  role: string;
  is_founding_member: boolean;
  is_core_member: boolean;
  has_default_password: boolean;
}

export default function VolunteerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [volunteer, setVolunteer] = useState<VolunteerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const isLoginPage = pathname === "/volunteer/login";

  useEffect(() => {
    if (isLoginPage) {
      setIsLoading(false);
      return;
    }
    fetch("/api/volunteer/auth/me", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          router.replace("/volunteer/login");
          return;
        }
        const data = await res.json();
        setVolunteer(data.volunteer);
        setIsAuthorized(true);
      })
      .catch(() => router.replace("/volunteer/login"))
      .finally(() => setIsLoading(false));
  }, [isLoginPage, router]);

  const handleLogout = async () => {
    await fetch("/api/volunteer/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    router.push("/volunteer/login");
  };

  if (isLoginPage) return <>{children}</>;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) return null;

  const roleLabel = volunteer?.is_founding_member
    ? "Founding"
    : volunteer?.is_core_member
      ? "Core"
      : volunteer?.role || "Volunteer";

  const navLinks = [
    {
      href: "/volunteer/availability",
      label: "Availability",
      icon: CalendarDays,
    },
    {
      href: "/volunteer/profile",
      label: "Profile",
      icon: User,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left — Brand */}
            <Link
              href="/volunteer/availability"
              className="flex items-center gap-3"
            >
              <Image
                src="/morethanmelogo.png"
                alt="MoreThanMe Logo"
                width={140}
                height={36}
                className="h-9 w-auto"
                priority
              />
              <div className="hidden sm:block">
                <h1 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                  MoreThanMe
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                  Volunteer Portal
                </p>
              </div>
            </Link>

            {/* Center — Navigation Links */}
            <nav className="flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <link.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right — Profile + Logout */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">
                  {volunteer?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                  {roleLabel}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Default Password Banner */}
      {volunteer?.has_default_password && pathname !== "/volunteer/profile" && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
              <Shield className="w-4 h-4 flex-shrink-0" />
              <span>
                You&apos;re using the default password.{" "}
                <Link
                  href="/volunteer/profile"
                  className="font-semibold underline hover:text-amber-900 dark:hover:text-amber-100 transition-colors"
                >
                  Update it now →
                </Link>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
