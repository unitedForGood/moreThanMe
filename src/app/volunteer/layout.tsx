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
  image_url: string | null;
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
    ? "Founding Member"
    : volunteer?.is_core_member
      ? "Core Member"
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

  const initials = volunteer?.name?.charAt(0)?.toUpperCase() || "V";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="px-4 sm:px-6">
          <div className="relative flex items-center justify-between h-[60px]">
            {/* Left — Brand (flush left) */}
            <Link
              href="/volunteer/availability"
              className="flex items-center gap-2.5"
            >
              <Image
                src="/morethanmelogo.png"
                alt="MoreThanMe Logo"
                width={140}
                height={36}
                className="h-8 w-auto"
                priority
              />
              <div className="hidden sm:block border-l border-gray-200 dark:border-gray-700 pl-2.5">
                <p className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-widest leading-none">
                  Volunteer Portal
                </p>
              </div>
            </Link>

            {/* Center Navigation (absolute center) */}
            <nav className="absolute left-1/2 -translate-x-1/2 flex items-center bg-gray-100/80 dark:bg-gray-700/50 rounded-lg p-0.5">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative flex items-center gap-1.5 px-4 py-[7px] rounded-md text-[13px] font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    }`}
                  >
                    <link.icon className={`w-3.5 h-3.5 ${isActive ? "text-primary-600 dark:text-primary-400" : ""}`} />
                    <span className="hidden sm:inline">{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right — User + Logout (flush right) */}
            <div className="flex items-center gap-2">
              <Link
                href="/volunteer/profile"
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-600 flex-shrink-0">
                  {volunteer?.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={volunteer.image_url}
                      alt={volunteer?.name || ""}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary-600 dark:text-primary-400">
                        {initials}
                      </span>
                    </div>
                  )}
                </div>
                <div className="hidden lg:block">
                  <p className="text-[13px] font-semibold text-gray-900 dark:text-white leading-none">
                    {volunteer?.name}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-none mt-0.5">
                    {roleLabel}
                  </p>
                </div>
              </Link>

              <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Default Password Banner */}
      {volunteer?.has_default_password && pathname !== "/volunteer/profile" && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-center gap-2 text-[13px]">
            <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-amber-700 dark:text-amber-300">
              You&apos;re using the default password.
            </span>
            <Link
              href="/volunteer/profile"
              className="font-semibold text-amber-800 dark:text-amber-200 underline underline-offset-2 hover:text-amber-900 transition-colors"
            >
              Change it now →
            </Link>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
