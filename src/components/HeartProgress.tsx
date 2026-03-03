"use client"
import { useState, useEffect } from "react";
interface DonationStats {
  total_amount: number;
}

export default function HeartProgress() {
  const [stats, setStats] = useState<DonationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [animationStarted, setAnimationStarted] = useState(false);
  const [animatedAmount, setAnimatedAmount] = useState(0);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/donations/stats");
      const data = await res.json().catch(() => ({}));
      const totalAmount = data.total_amount_verified ?? data.total_amount ?? 0;
      setStats({ total_amount: totalAmount });
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
      // Start showing amount after a short delay so we don't flash ₹0
      setTimeout(() => setAnimationStarted(true), 400);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  useEffect(() => {
    if (!stats) return;

    const target = stats.total_amount;
    let frameId: number;
    const duration = 1000; // ms
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const value = Math.round(target * progress);
      setAnimatedAmount(value);
      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [stats?.total_amount]);

  const currentAmount = animatedAmount || stats?.total_amount || 0;

  // Show "Fetching..." until we have finished loading AND a short delay (avoids flashing ₹0)
  const stillFetching = loading || !animationStarted;

  if (stillFetching) {
    return (
      <div className="flex flex-col items-center justify-center text-center relative">
        <div className="relative flex flex-col items-center justify-center">
          <div className="relative w-52 h-52 mt-[-70px]">
            <svg
              className="w-48 h-48 text-primary-100 dark:text-primary-900/30 animate-pulse"
              viewBox="0 0 100 100"
              fill="currentColor"
            >
              <path d="M50 85.5C25.5 70.5 10 55.5 10 40.5C10 28.5 18 20.5 30 20.5C38 20.5 45 24.5 50 30.5C55 24.5 62 20.5 70 20.5C82 20.5 90 28.5 90 40.5C90 55.5 74.5 70.5 50 85.5Z" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium text-primary-700">Fetching...</span>
            </div>
          </div>
          <div className="space-y-2 mt-4">
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
              Total amount raised
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center relative">
      <div className="relative flex flex-col items-center justify-center">
        {/* Heart Container */}
        <div className="relative w-52 h-52 mt-[-70px] transform transition-all duration-1000 hover:scale-105">
          {/* Background Heart (Outline) */}
          <svg
            className="absolute inset-2 w-48 h-48 text-primary-100 dark:text-primary-900/30 transition-all duration-500"
            viewBox="0 0 100 100"
            fill="currentColor"
          >
            <path 
              d="M50 85.5C25.5 70.5 10 55.5 10 40.5C10 28.5 18 20.5 30 20.5C38 20.5 45 24.5 50 30.5C55 24.5 62 20.5 70 20.5C82 20.5 90 28.5 90 40.5C90 55.5 74.5 70.5 50 85.5Z"
            />
          </svg>
          
          {/* Filled Heart (brand color) */}
          <svg
            className="absolute inset-2 w-48 h-48 transition-all duration-1000 ease-out"
            viewBox="0 0 100 100"
            fill="currentColor"
            style={{ filter: "drop-shadow(0 4px 12px rgba(165, 28, 48, 0.25))" }}
          >
            <path 
              className="text-primary-600"
              d="M50 85.5C25.5 70.5 10 55.5 10 40.5C10 28.5 18 20.5 30 20.5C38 20.5 45 24.5 50 30.5C55 24.5 62 20.5 70 20.5C82 20.5 90 28.5 90 40.5C90 55.5 74.5 70.5 50 85.5Z"
            />
          </svg>
          
          {/* Amount Text inside heart - show actual amount so we never flash ₹0 */}
          <div className="absolute inset-2 flex items-center justify-center px-4">
            <div className="text-center transform transition-all duration-500">
              <div className="text-2xl sm:text-3xl font-bold text-white drop-shadow-md">
                {formatAmount(currentAmount)}
              </div>
            </div>
          </div>
        </div>
        
        {/* Amount Details */}
        <div className="space-y-2 mt-4">
          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            Total amount raised
          </div>
          <p className="text-lg text-neutral-600 dark:text-neutral-500">
            Every contribution helps us create positive change
          </p>
        </div>
      </div>
    </div>
  );
}
