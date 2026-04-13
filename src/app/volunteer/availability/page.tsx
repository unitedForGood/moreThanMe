"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  X,
  Loader2,
  Check,
  Users,
  UserCheck,
  UserX,
} from "lucide-react";

interface AvailabilityRecord {
  id: string;
  date: string;
  isAvailable: boolean;
  reason: string | null;
  updatedAt: string | null;
}

interface TeamVolunteer {
  name: string;
  image_url: string | null;
  is_founding_member: boolean;
  is_core_member: boolean;
  role: string;
}

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

function formatDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isTodayBeforeCutoff(dateStr: string, cutoffHour = 18): boolean {
  const [year, month, day] = dateStr.split("-").map(Number);
  const now = new Date();
  return (
    year === now.getFullYear() &&
    month === now.getMonth() + 1 &&
    day === now.getDate() &&
    now.getHours() < cutoffHour
  );
}

function canSelectAvailability(dateStr: string): boolean {
  const [year, month, day] = dateStr.split("-").map(Number);
  const now = new Date();
  const candidate = new Date(year, month - 1, day);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (candidate < today) return false;
  if (candidate.getTime() === today.getTime()) return now.getHours() < 18;
  return true;
}

export default function VolunteerAvailabilityPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [records, setRecords] = useState<AvailabilityRecord[]>({} as never);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Sidebar
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [teamList, setTeamList] = useState<TeamVolunteer[]>([]);
  const [teamListLoading, setTeamListLoading] = useState(false);
  const [teamCounts, setTeamCounts] = useState<Record<string, number>>({});

  // Reason modal (only for cancelling availability)
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);

  // Build availability map from records
  const availMap = useMemo(() => {
    const map: Record<
      string,
      { isAvailable: boolean; reason: string | null; updatedAt: string | null }
    > = {};
    if (Array.isArray(records)) {
      records.forEach((r) => {
        map[r.date] = {
          isAvailable: r.isAvailable,
          reason: r.reason,
          updatedAt: r.updatedAt,
        };
      });
    }
    return map;
  }, [records]);

  const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;

  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/volunteer/availability?month=${monthStr}`,
        { credentials: "include" }
      );
      const data = await res.json();
      setRecords(data.records || []);
    } catch (e) {
      console.error("Failed to fetch availability:", e);
    } finally {
      setLoading(false);
    }
  }, [monthStr]);

  const fetchTeamCounts = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/volunteer/availability/team?month=${monthStr}`,
        { credentials: "include" }
      );
      const data = await res.json();
      setTeamCounts(data.counts || {});
    } catch (e) {
      console.error("Failed to fetch team counts:", e);
    }
  }, [monthStr]);

  useEffect(() => {
    fetchAvailability();
    fetchTeamCounts();
  }, [fetchAvailability, fetchTeamCounts]);

  // Fetch team list for selected date
  const fetchTeamList = useCallback(async (date: string) => {
    setTeamListLoading(true);
    try {
      const res = await fetch(
        `/api/volunteer/availability/team?date=${date}`,
        { credentials: "include" }
      );
      const data = await res.json();
      setTeamList(data.available || []);
    } catch (e) {
      console.error("Failed to fetch team list:", e);
    } finally {
      setTeamListLoading(false);
    }
  }, []);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const submitAvailability = async (
    dateStr: string,
    isAvailable: boolean,
    reasonText?: string
  ) => {
    setSaving(dateStr);
    try {
      const res = await fetch("/api/volunteer/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          date: dateStr,
          isAvailable,
          ...(isAvailable ? {} : { reason: reasonText?.trim() || null }),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to update", "error");
        return false;
      }

      await fetchAvailability();
      await fetchTeamCounts();
      if (selectedDate === dateStr) {
        fetchTeamList(dateStr);
      }
      showToast(
        isAvailable ? "Marked as available ✓" : "Marked as not available",
        "success"
      );
      return true;
    } catch {
      showToast("Failed to update availability", "error");
      return false;
    } finally {
      setSaving(null);
    }
  };

  // Single click: select date → open sidebar
  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    fetchTeamList(dateStr);
  };

  // Toggle from sidebar
  const handleToggleAvailability = async () => {
    if (!selectedDate) return;
    const current = availMap[selectedDate];
    const isCurrentlyAvail = current?.isAvailable || false;

    if (isCurrentlyAvail) {
      // Need reason → open reason modal
      setReason("");
      setReasonError(null);
      setShowReasonModal(true);
    } else {
      // Mark available instantly
      await submitAvailability(selectedDate, true);
    }
  };

  const handleSubmitReason = async () => {
    if (!reason.trim()) {
      setReasonError("Please provide a reason for your unavailability");
      return;
    }
    if (!selectedDate) return;
    setShowReasonModal(false);
    await submitAvailability(selectedDate, false, reason);
  };

  // Navigation
  const goToPrevMonth = () => {
    setSelectedDate(null);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    const maxMonth = today.getMonth() + 1;
    const maxYear = today.getFullYear() + (maxMonth > 11 ? 1 : 0);
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

    if (
      nextYear > maxYear ||
      (nextYear === maxYear && nextMonth > maxMonth % 12)
    ) {
      return;
    }

    setSelectedDate(null);
    setCurrentMonth(nextMonth);
    setCurrentYear(nextYear);
  };

  // Calendar grid
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const todayStr = formatDateStr(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const canGoNext = (() => {
    const maxMonth = today.getMonth() + 1;
    const maxYear = today.getFullYear() + (maxMonth > 11 ? 1 : 0);
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    return !(
      nextYear > maxYear ||
      (nextYear === maxYear && nextMonth > maxMonth % 12)
    );
  })();

  const availableCount = useMemo(() => {
    if (!Array.isArray(records)) return 0;
    return records.filter((r) => r.isAvailable).length;
  }, [records]);

  const getRoleLabel = (v: TeamVolunteer) =>
    v.is_founding_member
      ? "Founding"
      : v.is_core_member
        ? "Core"
        : "Volunteer";

  const selectedDateObj = selectedDate
    ? new Date(selectedDate + "T00:00:00")
    : null;
  const selectedIsAvail =
    selectedDate && availMap[selectedDate]?.isAvailable ? true : false;
  const selectedCanToggle = selectedDate
    ? canSelectAvailability(selectedDate)
    : false;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <CalendarDays className="w-7 h-7 text-primary-600" />
          My Availability
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Click a date to view who&apos;s available and manage your
          availability
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
            Your Available Days
          </p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            {availableCount}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
            Days in Month
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {daysInMonth}
          </p>
        </div>
        <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
            Month
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {MONTHS[currentMonth].slice(0, 3)} {currentYear}
          </p>
        </div>
      </div>

      {/* ═══ Main layout: Calendar + Sidebar ═══ */}
      <div className="flex gap-6 items-start">
        {/* Calendar */}
        <div className="flex-1 min-w-0 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          {/* Month navigation */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <button
              onClick={goToPrevMonth}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {MONTHS[currentMonth]} {currentYear}
            </h2>
            <button
              onClick={goToNextMonth}
              disabled={!canGoNext}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-6 py-2.5 bg-gray-50/80 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 text-[11px] text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-green-500" />
              You&apos;re available
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-gray-200 dark:bg-gray-600" />
              Not marked
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-green-600 dark:text-green-400 font-bold text-xs">2</span>
              Team count
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700">
            {DAYS.map((day) => (
              <div
                key={day}
                className="text-center text-[11px] font-semibold text-gray-400 dark:text-gray-500 py-2.5 uppercase tracking-wider"
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
              {/* Offset empty cells */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="aspect-square border-b border-r border-gray-50 dark:border-gray-700/40"
                />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = formatDateStr(currentYear, currentMonth, day);
                const dateObj = new Date(currentYear, currentMonth, day);
                const dayOfWeek = dateObj.getDay();
                const isWeekend =
                  dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
                const isToday = dateStr === todayStr;
                const isPast = dateObj < new Date(todayStr);
                const isTodayLocked =
                  isToday && !isTodayBeforeCutoff(dateStr);
                const isAvail = availMap[dateStr]?.isAvailable || false;
                const isSaving = saving === dateStr;
                const teamCount = teamCounts[dateStr] || 0;
                const isSelected = selectedDate === dateStr;

                return (
                  <button
                    key={day}
                    onClick={() => handleDateClick(dateStr)}
                    disabled={isSaving}
                    className={`
                      aspect-square relative flex flex-col items-center justify-center
                      border-b border-r border-gray-50 dark:border-gray-700/40
                      transition-all duration-150 cursor-pointer group
                      ${isPast || isTodayLocked ? "opacity-40 cursor-not-allowed" : ""}
                      ${isSelected
                        ? "bg-primary-50 dark:bg-primary-900/20 ring-2 ring-inset ring-primary-500"
                        : isAvail
                          ? "bg-green-50/80 dark:bg-green-900/15 hover:bg-green-100 dark:hover:bg-green-900/25"
                          : isWeekend
                            ? "bg-blue-50/30 dark:bg-blue-900/10 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                            : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                      }
                      ${isToday && !isSelected ? "ring-2 ring-inset ring-primary-300 dark:ring-primary-600" : ""}
                    `}
                  >
                    {/* Date number */}
                    <span
                      className={`text-sm font-semibold leading-none ${
                        isSelected
                          ? "text-primary-700 dark:text-primary-300"
                          : isToday
                            ? "text-primary-600 dark:text-primary-400"
                            : isAvail
                              ? "text-green-700 dark:text-green-300"
                              : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {day}
                    </span>

                    {/* Status indicator */}
                    {isSaving ? (
                      <Loader2 className="w-3 h-3 mt-0.5 animate-spin text-primary-500" />
                    ) : isAvail ? (
                      <Check className="w-3 h-3 mt-0.5 text-green-600 dark:text-green-400" />
                    ) : null}

                    {/* Team count — bottom of cell */}
                    {teamCount > 0 && (
                      <span
                        className={`absolute bottom-1 text-[10px] font-bold ${
                          isSelected
                            ? "text-primary-600 dark:text-primary-300"
                            : "text-green-600/70 dark:text-green-400/70"
                        }`}
                      >
                        {teamCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ═══ Sidebar — Date detail panel ═══ */}
        <div
          className={`hidden lg:flex flex-col w-[340px] flex-shrink-0 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-300 ${
            selectedDate ? "opacity-100" : "opacity-60"
          }`}
        >
          {selectedDate && selectedDateObj ? (
            <>
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[15px] font-bold text-gray-900 dark:text-white">
                      {selectedDateObj.toLocaleDateString("en-IN", {
                        weekday: "long",
                      })}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {selectedDateObj.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Your status card */}
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">
                  Your Status
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        selectedIsAvail
                          ? "bg-green-100 dark:bg-green-900/30"
                          : "bg-gray-100 dark:bg-gray-700/50"
                      }`}
                    >
                      {selectedIsAvail ? (
                        <UserCheck className="w-4.5 h-4.5 text-green-600 dark:text-green-400" />
                      ) : (
                        <UserX className="w-4.5 h-4.5 text-gray-400 dark:text-gray-500" />
                      )}
                    </div>
                    <div>
                      <p
                        className={`text-sm font-semibold ${
                          selectedIsAvail
                            ? "text-green-700 dark:text-green-300"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {selectedIsAvail ? "Available" : "Not Available"}
                      </p>
                      {availMap[selectedDate]?.updatedAt && (
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                          Updated{" "}
                          {new Date(
                            availMap[selectedDate].updatedAt!
                          ).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Toggle button */}
                  {selectedCanToggle && (
                    <button
                      onClick={handleToggleAvailability}
                      disabled={saving === selectedDate}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm ${
                        selectedIsAvail
                          ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800/50"
                          : "bg-green-600 text-white hover:bg-green-700 shadow-green-600/15"
                      } disabled:opacity-40`}
                    >
                      {saving === selectedDate ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : selectedIsAvail ? (
                        "Cancel"
                      ) : (
                        "Mark Available"
                      )}
                    </button>
                  )}

                  {!selectedCanToggle && (
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 italic">
                      {new Date(selectedDate + "T00:00:00") < new Date(todayStr)
                        ? "Past date"
                        : "Locked"}
                    </span>
                  )}
                </div>
              </div>

              {/* Team list */}
              <div className="flex-1 min-h-0">
                <div className="px-5 py-3 flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Available Volunteers
                  </p>
                  <span
                    className={`flex items-center gap-1 text-xs font-bold ${
                      (teamCounts[selectedDate] || 0) > 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    {teamCounts[selectedDate] || 0}
                  </span>
                </div>

                <div className="max-h-[380px] overflow-y-auto">
                  {teamListLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                    </div>
                  ) : teamList.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center mx-auto mb-3">
                        <Users className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        No one yet
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        Be the first to mark available!
                      </p>
                    </div>
                  ) : (
                    <div className="px-3 pb-4 space-y-1">
                      {teamList.map((v, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                        >
                          {/* Avatar */}
                          <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-gray-600 flex-shrink-0 bg-gray-100 dark:bg-gray-700">
                            {v.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={v.image_url}
                                alt={v.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500">
                                  {v.name?.charAt(0)?.toUpperCase() || "?"}
                                </span>
                              </div>
                            )}
                          </div>
                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate leading-tight">
                              {v.name}
                            </p>
                            <span
                              className={`inline-block text-[9px] font-bold uppercase tracking-wider mt-0.5 ${
                                v.is_founding_member
                                  ? "text-amber-600 dark:text-amber-400"
                                  : v.is_core_member
                                    ? "text-blue-600 dark:text-blue-400"
                                    : "text-gray-400 dark:text-gray-500"
                              }`}
                            >
                              {getRoleLabel(v)}
                            </span>
                          </div>
                          {/* Green dot */}
                          <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Empty state — no date selected */
            <div className="flex-1 flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center mb-4">
                <CalendarDays className="w-7 h-7 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Select a date
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-[200px] leading-relaxed">
                Click on any date in the calendar to view team availability and manage your status
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Mobile: Inline date detail (below calendar) ═══ */}
      {selectedDate && selectedDateObj && (
        <div className="lg:hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          {/* Header + your status */}
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-[15px] font-bold text-gray-900 dark:text-white">
                  {selectedDateObj.toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Your status + toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    selectedIsAvail
                      ? "bg-green-100 dark:bg-green-900/30"
                      : "bg-gray-200 dark:bg-gray-600"
                  }`}
                >
                  {selectedIsAvail ? (
                    <UserCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <UserX className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  )}
                </div>
                <span
                  className={`text-sm font-semibold ${
                    selectedIsAvail
                      ? "text-green-700 dark:text-green-300"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {selectedIsAvail ? "You're available" : "Not available"}
                </span>
              </div>
              {selectedCanToggle && (
                <button
                  onClick={handleToggleAvailability}
                  disabled={saving === selectedDate}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    selectedIsAvail
                      ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50"
                      : "bg-green-600 text-white hover:bg-green-700"
                  } disabled:opacity-40`}
                >
                  {saving === selectedDate ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : selectedIsAvail ? (
                    "Cancel"
                  ) : (
                    "Mark Available"
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Team list */}
          <div className="px-5 py-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Available Volunteers
            </p>
            <span className="flex items-center gap-1 text-xs font-bold text-green-600 dark:text-green-400">
              <Users className="w-3.5 h-3.5" />
              {teamCounts[selectedDate] || 0}
            </span>
          </div>

          {teamListLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
            </div>
          ) : teamList.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No volunteers available yet
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-700/40">
              {teamList.map((v, idx) => (
                <div key={idx} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-100 dark:bg-gray-700">
                    {v.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={v.image_url}
                        alt={v.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-[11px] font-bold text-gray-400">
                          {v.name?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">
                      {v.name}
                    </p>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider ${
                        v.is_founding_member
                          ? "text-amber-600 dark:text-amber-400"
                          : v.is_core_member
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      {getRoleLabel(v)}
                    </span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ Reason Modal (only for cancelling) ═══ */}
      {showReasonModal && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Reason for Cancellation
              </h3>
              <button
                onClick={() => setShowReasonModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You&apos;re cancelling your availability for{" "}
                <strong className="text-gray-900 dark:text-white">
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                    "en-IN",
                    {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  )}
                </strong>
                . Please share why.
              </p>

              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (e.target.value.trim()) setReasonError(null);
                }}
                placeholder="e.g., Family function, Exam, Health issue..."
                rows={3}
                autoFocus
                className={`w-full px-4 py-3 rounded-xl border ${
                  reasonError
                    ? "border-red-300 dark:border-red-600 focus:ring-red-500"
                    : "border-gray-200 dark:border-gray-600 focus:ring-primary-500"
                } bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:border-transparent transition-all text-sm resize-none`}
              />
              {reasonError && (
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                  {reasonError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <button
                onClick={() => setShowReasonModal(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Keep Available
              </button>
              <button
                onClick={handleSubmitReason}
                className="px-5 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <Check className="w-4 h-4" />
          ) : (
            <X className="w-4 h-4" />
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}
