"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  X,
  Loader2,
  Check,
} from "lucide-react";

interface AvailabilityRecord {
  id: string;
  date: string;
  isAvailable: boolean;
  reason: string | null;
  updatedAt: string | null;
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
  const [saving, setSaving] = useState<string | null>(null); // date currently being saved
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingDate, setPendingDate] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<
    "mark-available" | "mark-unavailable" | null
  >(null);
  const [reasonDate, setReasonDate] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

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

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // Show toast with auto-dismiss
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

  // Ask for confirmation before changing availability on any date
  const handleDateClick = async (dateStr: string) => {
    if (!canSelectAvailability(dateStr)) return;

    const current = availMap[dateStr];
    const isCurrentlyAvailable = current?.isAvailable || false;
    setPendingDate(dateStr);
    setPendingAction(isCurrentlyAvailable ? "mark-unavailable" : "mark-available");
    setShowConfirmModal(true);
  };

  const handleConfirmDateAction = async () => {
    if (!pendingDate || !pendingAction) return;

    if (pendingAction === "mark-available") {
      await submitAvailability(pendingDate, true);
      setShowConfirmModal(false);
      setPendingDate(null);
      setPendingAction(null);
      return;
    }

    setShowConfirmModal(false);
    setReasonDate(pendingDate);
    setReason("");
    setReasonError(null);
    setShowReasonModal(true);
  };

  // Submit reason for unavailability
  const handleSubmitReason = async () => {
    if (!reason.trim()) {
      setReasonError("Please provide a reason for your unavailability");
      return;
    }
    if (!reasonDate) return;

    setShowReasonModal(false);
    try {
      await submitAvailability(reasonDate, false, reason);
    } finally {
      setReasonDate(null);
      setReason("");
      setPendingDate(null);
      setPendingAction(null);
    }
  };

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
    // Limit to current month + 1
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

  // Check if we can go forward
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

  // Count available days this month
  const availableCount = useMemo(() => {
    if (!Array.isArray(records)) return 0;
    return records.filter((r) => r.isAvailable).length;
  }, [records]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-primary-600" />
            My Availability
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Click on dates to mark when you&apos;re available for teaching
            sessions
          </p>
        </div>

        {/*
          Quick action intentionally disabled for now per request:
          "Mark all weekends available"
        */}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
            Available Days
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

      {/* Calendar */}
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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {MONTHS[currentMonth]} {currentYear}
            </h2>
          </div>
          <button
            onClick={goToNextMonth}
            disabled={!canGoNext}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <div className="w-3 h-3 rounded-sm bg-green-500" />
            Available
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <div className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-gray-600" />
            Not Marked
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <div className="w-3 h-3 rounded-sm bg-primary-100 dark:bg-primary-900/40 ring-1 ring-primary-300" />
            Today
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <div className="w-3 h-3 rounded-sm bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-200" />
            Weekend
          </div>
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
            {/* Empty cells for offset */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="aspect-square border-b border-r border-gray-50 dark:border-gray-700/50"
              />
            ))}

            {/* Date cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = formatDateStr(currentYear, currentMonth, day);
              const dateObj = new Date(currentYear, currentMonth, day);
              const dayOfWeek = dateObj.getDay();
              const isWeekend =
                dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
              const isToday = dateStr === todayStr;
              const isPast = dateObj < new Date(todayStr);
              const isTodayLocked = isToday && !isTodayBeforeCutoff(dateStr);
              const isSelectable = canSelectAvailability(dateStr);
              const isAvail = availMap[dateStr]?.isAvailable || false;
              const isSaving = saving === dateStr;
              const updatedAt = availMap[dateStr]?.updatedAt;

              return (
                <button
                  key={day}
                  onClick={() => isSelectable && handleDateClick(dateStr)}
                  disabled={!isSelectable || isSaving}
                  title={
                    isPast
                      ? "Past date"
                      : isTodayLocked
                        ? "Selection for today closes at 6:00 PM"
                      : isAvail
                        ? `Available${updatedAt ? ` · Updated ${new Date(updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : ""}`
                        : "Click to mark available"
                  }
                  className={`
                    aspect-square flex flex-col items-center justify-center gap-0.5 relative
                    border-b border-r border-gray-50 dark:border-gray-700/50
                    transition-all duration-150 group
                    ${!isSelectable ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:scale-[1.02]"}
                    ${isToday ? "ring-2 ring-inset ring-primary-400 dark:ring-primary-500" : ""}
                    ${isAvail ? "bg-green-50 dark:bg-green-900/20" : isWeekend ? "bg-blue-50/50 dark:bg-blue-900/10" : "bg-white dark:bg-gray-800"}
                    ${isSelectable && !isAvail ? "hover:bg-green-50/50 dark:hover:bg-green-900/10" : ""}
                    ${isSelectable && isAvail ? "hover:bg-green-100 dark:hover:bg-green-900/30" : ""}
                  `}
                >
                  <span
                    className={`text-sm font-medium ${
                      isToday
                        ? "text-primary-700 dark:text-primary-300"
                        : isAvail
                          ? "text-green-700 dark:text-green-300"
                          : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {day}
                  </span>

                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-500" />
                  ) : isAvail ? (
                    <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                  ) : (
                    <span className="w-3.5 h-3.5" />
                  )}

                  {/* Weekend indicator */}
                  {isWeekend && isSelectable && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400 dark:bg-blue-500 opacity-60" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Reason Modal */}
      {showConfirmModal && pendingDate && pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Confirm Availability Update
              </h3>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {pendingAction === "mark-available"
                  ? "Do you want to mark this date as available?"
                  : "Do you want to mark this date as not available? You will be asked to provide a reason in the next step."}
              </p>
              <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                {new Date(pendingDate + "T00:00:00").toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingDate(null);
                  setPendingAction(null);
                }}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDateAction}
                className="px-5 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {showReasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md overflow-hidden animate-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Reason for Unavailability
              </h3>
              <button
                onClick={() => {
                  setShowReasonModal(false);
                  setReasonDate(null);
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You were marked as <strong className="text-green-600">available</strong> on{" "}
                <strong>
                  {reasonDate &&
                    new Date(reasonDate + "T00:00:00").toLocaleDateString(
                      "en-IN",
                      {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    )}
                </strong>
                . Please provide a reason for changing your availability.
              </p>

              <div>
                <textarea
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (e.target.value.trim()) setReasonError(null);
                  }}
                  placeholder="e.g., Family function, Exam preparation, Health issue..."
                  rows={3}
                  autoFocus
                  className={`w-full px-4 py-3 rounded-xl border ${
                    reasonError
                      ? "border-red-300 dark:border-red-600 focus:ring-red-500"
                      : "border-gray-200 dark:border-gray-600 focus:ring-primary-500"
                  } bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:border-transparent transition-all text-sm resize-none`}
                />
                {reasonError && (
                  <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
                    {reasonError}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <button
                onClick={() => {
                  setShowReasonModal(false);
                  setReasonDate(null);
                }}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReason}
                className="px-5 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all animate-in ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
