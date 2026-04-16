"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, CalendarDays, Lock, IndianRupee, Clock } from "lucide-react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { useRouter } from "next/navigation";
import { canAccessAdminHref } from "@/lib/adminRoles";
import type { AdminRole } from "@/lib/adminRoles";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

interface ChartDataPoint {
  month: string;
  amount: number;
}

interface DashboardStats {
  financeData: {
    totalVerifiedAmount: number;
    pendingDonationsCount: number;
    chartData: ChartDataPoint[];
  } | null;
  availability: {
    weekendDates: string;
    weekendAvailabilityCount: number;
  };
}

export default function DashboardAnalytics({ role }: { role: AdminRole | AdminRole[] }) {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard-stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load dashboard stats", err);
        setLoading(false);
      });
  }, []);

  const hasFinanceAccess = canAccessAdminHref(role, "/admin/donate");
  const hasAvailabilityAccess = canAccessAdminHref(role, "/admin/availability");

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        backgroundColor: "rgba(17, 24, 39, 0.9)",
        titleColor: "#f3f4f6",
        bodyColor: "#f3f4f6",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(context.parsed.y);
            }
            return label;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        border: { dash: [4, 4] },
        grid: {
          color: "rgba(107, 114, 128, 0.1)",
        },
        ticks: {
          callback: function(value: any) {
            if (value >= 1000) {
              return '₹' + value / 1000 + 'k';
            }
            return '₹' + value;
          }
        }
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
  };

  const lineData = {
    labels: stats?.financeData?.chartData.map((d) => d.month) || [],
    datasets: [
      {
        fill: true,
        label: "Donations",
        data: stats?.financeData?.chartData.map((d) => d.amount) || [],
        borderColor: "rgb(16, 185, 129)", // emerald-500
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.4, // Smooth curve
        pointBackgroundColor: "rgb(16, 185, 129)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    subtitle, 
    onClick, 
    access, 
    gradient 
  }: { 
    title: string, 
    value: string | number, 
    icon: any, 
    subtitle: string, 
    onClick: () => void, 
    access: boolean, 
    gradient: string 
  }) => (
    <motion.div
      whileHover={access ? { y: -4, scale: 1.01 } : {}}
      onClick={() => access && onClick()}
      className={`relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 ${
        access 
          ? "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:shadow-xl cursor-pointer" 
          : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50 opacity-80 cursor-not-allowed"
      }`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 rounded-full ${gradient}`} />
      
      {!access && (
        <div className="absolute top-4 right-4 text-gray-400">
          <Lock className="w-5 h-5" />
        </div>
      )}

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-xl border ${access ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-100 dark:border-gray-700" : "bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-400"}`}>
            <Icon className="w-6 h-6" />
          </div>
          <h3 className="text-gray-500 dark:text-gray-400 font-medium">{title}</h3>
        </div>
        
        <div className="mt-6">
          <p className={`text-4xl font-bold tracking-tight ${access ? "text-gray-900 dark:text-white" : "text-gray-400 blur-sm select-none"}`}>
            {loading ? "..." : (access ? value : "••••••")}
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            {subtitle}
          </p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="mb-12 space-y-6">
      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Verified Donations"
          value={new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(stats?.financeData?.totalVerifiedAmount || 0)}
          icon={IndianRupee}
          subtitle="Total confirmed donations"
          onClick={() => router.push("/admin/donate")}
          access={hasFinanceAccess}
          gradient="bg-emerald-500"
        />
        
        <StatCard
          title="Pending Verification"
          value={stats?.financeData?.pendingDonationsCount || 0}
          icon={Clock}
          subtitle="Donations needing attention"
          onClick={() => router.push("/admin/donate")}
          access={hasFinanceAccess}
          gradient="bg-amber-500"
        />

        <StatCard
          title="Weekend Availability"
          value={stats?.availability?.weekendAvailabilityCount || 0}
          icon={Users}
          subtitle={`Available for ${stats?.availability?.weekendDates || "upcoming weekend"}`}
          onClick={() => router.push("/admin/availability")}
          access={hasAvailabilityAccess}
          gradient="bg-blue-500"
        />
      </div>

      {/* Chart Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Donation Trends
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Verified donation volume over the last 6 months</p>
          </div>
          {!hasFinanceAccess && (
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800/50">
              <Lock className="w-4 h-4" />
              Finance Access Required
            </div>
          )}
        </div>

        <div className="relative h-[300px] w-full">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse flex space-x-2">
                <div className="h-3 w-3 bg-emerald-500 rounded-full"></div>
                <div className="h-3 w-3 bg-emerald-500 rounded-full animation-delay-200"></div>
                <div className="h-3 w-3 bg-emerald-500 rounded-full animation-delay-400"></div>
              </div>
            </div>
          ) : !hasFinanceAccess ? (
            <div className="absolute inset-0 flex items-center justify-center flex-col z-10 backdrop-blur-md bg-white/30 dark:bg-gray-800/30 rounded-xl">
              <Lock className="w-12 h-12 text-gray-400 mb-3" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">You need Finance role to view this chart</p>
            </div>
          ) : (
            <Line data={lineData} options={chartOptions as any} />
          )}
        </div>
      </motion.div>
    </div>
  );
}
