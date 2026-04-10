"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Users,
  Mail,
  Phone,
  AlertTriangle,
  Filter,
  ArrowUpDown,
  Loader2,
  X,
} from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface DateSummary {
  date: string;
  availableCount: number;
  totalMembers: number;
}

interface AvailabilityUser {
  memberId: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  is_founding_member: boolean;
  is_core_member: boolean;
  image_url: string | null;
  isAvailable: boolean;
  reason: string | null;
  updatedAt: string | null;
}

interface DateDetail {
  date: string;
  availableCount: number;
  cancellationCount: number;
  available: AvailabilityUser[];
  cancellations: AvailabilityUser[];
}

type RoleFilter = "All" | "Volunteer" | "Core" | "Founding";
type SortOption = "name" | "role";

export default function AdminAvailabilityPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [summary, setSummary] = useState<DateSummary[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [loading, setLoading] = useState(true);

  // Drilldown state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dateDetail, setDateDetail] = useState<DateDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("All");
  const [sortBy, setSortBy] = useState<SortOption>("name");

  const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/availability?month=${monthStr}`, {
        credentials: "include",
      });
      const data = await res.json();
      setSummary(data.summary || []);
      setTotalMembers(data.totalMembers || 0);
    } catch (e) {
      console.error("Failed to fetch availability summary:", e);
    } finally {
      setLoading(false);
    }
  }, [monthStr]);

  useEffect(() => {
    fetchSummary();
    setSelectedDate(null);
    setDateDetail(null);
  }, [fetchSummary]);

  const fetchDateDetail = useCallback(
    async (date: string) => {
      setDetailLoading(true);
      try {
        const params = new URLSearchParams({ date, sort: sortBy });
        if (roleFilter !== "All") params.set("role", roleFilter);
        const res = await fetch(
          `/api/admin/availability/date?${params.toString()}`,
          { credentials: "include" }
        );
        const data = await res.json();
        setDateDetail(data);
      } catch (e) {
        console.error("Failed to fetch date detail:", e);
      } finally {
        setDetailLoading(false);
      }
    },
    [roleFilter, sortBy]
  );

  useEffect(() => {
    if (selectedDate) {
      fetchDateDetail(selectedDate);
    }
  }, [selectedDate, fetchDateDetail]);

  // Summary map for quick lookup
  const summaryMap = useMemo(() => {
    const map: Record<string, number> = {};
    summary.forEach((s) => {
      map[s.date] = s.availableCount;
    });
    return map;
  }, [summary]);

  // Navigation
  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Calendar grid
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Color coding for availability counts
  const getAvailColor = (count: number) => {
    if (count === 0)
      return {
        bg: "bg-gray-50 dark:bg-gray-800",
        text: "text-gray-400 dark:text-gray-500",
        badge: "",
      };
    if (count < 5)
      return {
        bg: "bg-red-50 dark:bg-red-900/15",
        text: "text-red-600 dark:text-red-400",
        badge:
          "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
      };
    if (count <= 10)
      return {
        bg: "bg-amber-50 dark:bg-amber-900/15",
        text: "text-amber-600 dark:text-amber-400",
        badge:
          "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
      };
    return {
      bg: "bg-green-50 dark:bg-green-900/15",
      text: "text-green-600 dark:text-green-400",
      badge:
        "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
    };
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTimestamp = (ts: string | null) => {
    if (!ts) return "—";
    return new Date(ts).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRoleBadges = (user: AvailabilityUser) => {
    const badges: { label: string; color: string }[] = [];
    if (user.is_founding_member) {
      badges.push({
        label: "Founding",
        color:
          "bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300",
      });
    }
    if (user.is_core_member) {
      badges.push({
        label: "Core",
        color:
          "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
      });
    }
    if (!user.is_founding_member && !user.is_core_member) {
      badges.push({
        label: user.role || "Volunteer",
        color:
          "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
      });
    }
    return badges;
  };

  return (
    <>
      <div className="mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm mb-4"
        >
          ← Dashboard
        </Link>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          <CalendarDays className="w-7 h-7 text-primary-600" />
          Availability Dashboard
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          View volunteer availability across the month. Click a date to
          drill down into details. Total team members: {totalMembers}
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Legend:
        </span>
        <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
          <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-800" />
          &lt; 5 (Low)
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
          <div className="w-4 h-4 rounded bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800" />
          5–10 (Moderate)
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
          <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-800" />
          10+ (Good)
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar */}
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            {/* Month navigation */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <button
                onClick={goToPrevMonth}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {MONTHS[currentMonth]} {currentYear}
                </h3>
              </div>
              <button
                onClick={goToNextMonth}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-3 uppercase tracking-wider"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Date cells */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="aspect-square border-b border-r border-gray-50 dark:border-gray-700/50"
                  />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const isToday = dateStr === todayStr;
                  const count = summaryMap[dateStr] || 0;
                  const colors = getAvailColor(count);
                  const isSelected = selectedDate === dateStr;

                  return (
                    <button
                      key={day}
                      onClick={() =>
                        setSelectedDate(
                          isSelected ? null : dateStr
                        )
                      }
                      className={`
                        aspect-square flex flex-col items-center justify-center gap-1 relative
                        border-b border-r border-gray-50 dark:border-gray-700/50
                        transition-all duration-150 cursor-pointer
                        ${colors.bg}
                        ${isSelected ? "ring-2 ring-inset ring-primary-500 dark:ring-primary-400" : ""}
                        ${isToday ? "ring-2 ring-inset ring-primary-300 dark:ring-primary-600" : ""}
                        hover:opacity-80
                      `}
                    >
                      <span
                        className={`text-sm font-medium ${
                          isToday
                            ? "text-primary-700 dark:text-primary-300"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {day}
                      </span>
                      {count > 0 && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${colors.badge}`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Drilldown panel */}
        {selectedDate && (
          <div className="lg:w-[420px] shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden sticky top-6">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {formatDate(selectedDate)}
                  </h3>
                  {dateDetail && !detailLoading && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {dateDetail.availableCount} available ·{" "}
                      {dateDetail.cancellationCount} cancelled
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedDate(null);
                    setDateDetail(null);
                  }}
                  className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Filters */}
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex flex-wrap items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                {(
                  ["All", "Volunteer", "Core", "Founding"] as RoleFilter[]
                ).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      roleFilter === r
                        ? "bg-primary-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {r}
                  </button>
                ))}
                <div className="ml-auto flex items-center gap-1">
                  <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as SortOption)
                    }
                    className="text-xs bg-transparent border-none text-gray-600 dark:text-gray-300 cursor-pointer focus:ring-0 p-0"
                  >
                    <option value="name">Name A–Z</option>
                    <option value="role">Role</option>
                  </select>
                </div>
              </div>

              {/* Content */}
              <div className="max-h-[60vh] overflow-y-auto">
                {detailLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                  </div>
                ) : !dateDetail ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
                    No data available
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {/* Available section */}
                    {dateDetail.available.length > 0 && (
                      <div className="p-5 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Available ({dateDetail.available.length})
                          </h4>
                        </div>
                        <div className="space-y-2">
                          {dateDetail.available.map((user) => (
                            <div
                              key={user.memberId}
                              className="p-3 rounded-xl bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0 overflow-hidden">
                                    {user.image_url ? (
                                      <img
                                        src={user.image_url}
                                        alt={user.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                      {user.name}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      {getRoleBadges(user).map((b) => (
                                        <span
                                          key={b.label}
                                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${b.color}`}
                                        >
                                          {b.label}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                                {user.email && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {user.email}
                                  </span>
                                )}
                                {user.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {user.phone}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5">
                                Updated: {formatTimestamp(user.updatedAt)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cancellations section */}
                    {dateDetail.cancellations.length > 0 && (
                      <div className="p-5 space-y-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                          <h4 className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">
                            Cancellations ({dateDetail.cancellations.length})
                          </h4>
                        </div>
                        <div className="space-y-2">
                          {dateDetail.cancellations.map((user) => (
                            <div
                              key={user.memberId}
                              className="p-3 rounded-xl bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0 overflow-hidden">
                                  {user.image_url ? (
                                    <img
                                      src={user.image_url}
                                      alt={user.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Users className="w-4 h-4 text-red-600 dark:text-red-400" />
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {user.name}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    {getRoleBadges(user).map((b) => (
                                      <span
                                        key={b.label}
                                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${b.color}`}
                                      >
                                        {b.label}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div className="mt-2 p-2.5 rounded-lg bg-red-100/50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50">
                                <p className="text-xs text-red-700 dark:text-red-300 font-medium">
                                  Reason:{" "}
                                  <span className="font-normal">
                                    {user.reason}
                                  </span>
                                </p>
                              </div>
                              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5">
                                Updated: {formatTimestamp(user.updatedAt)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {dateDetail.available.length === 0 &&
                      dateDetail.cancellations.length === 0 && (
                        <div className="text-center py-12 px-5">
                          <CalendarDays className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            No one has marked availability for this date yet
                          </p>
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
