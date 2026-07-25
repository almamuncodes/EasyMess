"use client";

import React, { useState, useEffect, useCallback } from "react";
import { GetUser } from "@/components/action/action";
import { useTranslation } from "@/lib/useTranslation";
import {
  History,
  Activity,
  User,
  Clock,
  AlertCircle,
  ShoppingBag,
  Wallet,
  Utensils,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import PageLoader from "@/components/ui/PageLoader";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ActivityLogPage() {
  const { t, lang } = useTranslation();
  const isBn = lang === "bn";

  const user = GetUser();
  const userId = user?.user?.id;

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    if (!userId) return;

    try {
      const res = await fetch(`${API_BASE}/api/activity-logs?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data || []);
      }
    } catch (err) {
      console.error("Error loading activity logs:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const getCategoryConfig = (category, action) => {
    if (category === "bazaar" || action?.includes("bazaar")) {
      if (action === "bazaar_update") {
        return {
          icon: ShoppingBag,
          badge: isBn ? "✏️ এডিট" : "✏️ Edited",
          badgeColor: "bg-amber-500 text-white",
        };
      }
      if (action === "bazaar_delete") {
        return {
          icon: ShoppingBag,
          badge: isBn ? "🗑️ ডিলিট" : "🗑️ Deleted",
          badgeColor: "bg-red-500 text-white",
        };
      }
      return {
        icon: ShoppingBag,
        badge: isBn ? "🛒 নতুন বাজার" : "🛒 New Bazaar",
        badgeColor: "bg-orange-500 text-white",
      };
    }

    if (category === "deposit" || action?.includes("deposit")) {
      if (action === "deposit_delete") {
        return {
          icon: Wallet,
          badge: isBn ? "🗑️ জমা বাতিল" : "🗑️ Removed Deposit",
          badgeColor: "bg-red-500 text-white",
        };
      }
      return {
        icon: Wallet,
        badge: isBn ? "💰 টাকা জমা" : "💰 Deposit Paid",
        badgeColor: "bg-emerald-500 text-white",
      };
    }

    if (category === "meal" || action?.includes("meal")) {
      return {
        icon: Utensils,
        badge: isBn ? "🍽️ মিল পরিবর্তন" : "🍽️ Meal Toggle",
        badgeColor: "bg-blue-500 text-white",
      };
    }

    if (category === "schedule" || action?.includes("duty")) {
      return {
        icon: Calendar,
        badge: isBn ? "📅 বাজার ডিউটি" : "📅 Bazaar Duty",
        badgeColor: "bg-purple-500 text-white",
      };
    }

    return {
      icon: Activity,
      badge: isBn ? "⚙️ মেস আপডেট" : "⚙️ Activity",
      badgeColor: "bg-gray-700 text-white",
    };
  };

  if (loading) return <PageLoader text={isBn ? "মেসের অ্যাক্টিভিটি লগ লোড হচ্ছে..." : "Loading activity log..."} />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-orange-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-3 sm:p-6 lg:p-8 text-gray-900 dark:text-slate-100">
      <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 sm:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <History className="w-3.5 h-3.5" />
              {isBn ? "মেস কার্যক্রমের টাইমলাইন" : "Activity Log & Timeline"}
            </div>
            <h1 className="text-lg sm:text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              {isBn ? "মেসের সাম্প্রতিক সকল কর্মকাণ্ড" : "Recent Mess Activity Feed"}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
              {isBn ? "বাজার (যোগ/এডিট/ডিলিট), টাকা জমা, মিল এবং মেম্বার আপডেটের বিবরণী" : "Real-time timeline of bazaar logs, deposit payments, meal updates & edits"}
            </p>
          </div>
        </div>

        {/* 50-Item FIFO Trim Info Banner */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-start gap-2.5 sm:gap-3 text-xs text-orange-950 dark:text-orange-200">
          <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="font-bold leading-snug">
              {isBn ? "💡 স্বয়ংক্রিয় রিং-বাফার হিস্ট্রি লিমিট (সর্বোচ্চ ৫০টি)" : "💡 Auto Ring-Buffer History Limit (Max 50 Logs)"}
            </p>
            <p className="text-[11px] text-orange-800 dark:text-orange-300/90 mt-0.5 leading-relaxed">
              {isBn
                ? "এখানে মেসের সর্বাধুনিক ৫০টি কার্যক্রম সংরক্ষিত থাকে। ৫০টির বেশি এন্ট্রি হলে সবচেয়ে পুরনো রেকর্ডগুলো স্বয়ংক্রিয়ভাবে মুছে যায়।"
                : "Keeps the latest 50 mess events. When a 51st event occurs, the oldest history log automatically trims off."}
            </p>
          </div>
        </div>

        {/* Timeline Log Feed */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100 dark:border-slate-800">
            <h3 className="text-xs sm:text-base font-bold flex items-center gap-2 text-gray-900 dark:text-white">
              <Activity className="w-4 h-4 text-orange-500 shrink-0" />
              {isBn ? "সাম্প্রতিক হিস্ট্রি (সর্বশেষ ৫০টি)" : "Recent History Feed (Latest 50)"}
            </h3>
            <span className="px-2.5 py-0.5 sm:py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-mono text-[11px] sm:text-xs font-bold shrink-0">
              {logs.length} / 50 {isBn ? "টি রেকর্ড" : "records"}
            </span>
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <AlertCircle className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-xs text-gray-400">
                {isBn ? "এখনো কোনো কার্যক্রমের ইতিহাস রেকর্ড হয়নি।" : "No activity recorded yet."}
              </p>
            </div>
          ) : (
            <div className="relative border-l-2 border-orange-500/20 dark:border-slate-800 ml-2.5 sm:ml-4 space-y-3.5 sm:space-y-4 pl-3.5 sm:pl-6 py-1">
              {logs.map((log, idx) => {
                const dateObj = new Date(log.createdAt);
                const formattedDate = dateObj.toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                const cfg = getCategoryConfig(log.category, log.action);
                const IconComponent = cfg.icon;

                return (
                  <div key={log._id || idx} className="relative group">
                    {/* Circle Bullet Icon */}
                    <div className="absolute -left-[22px] sm:-left-[35px] top-3.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white dark:bg-slate-900 border border-orange-500/40 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                      <IconComponent className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-500" />
                    </div>

                    <div className="p-3.5 sm:p-4 rounded-2xl bg-gray-50/60 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800 shadow-xs space-y-2 hover:border-orange-500/20 transition-all">
                      
                      {/* Responsive Top Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white flex items-center gap-1.5 shrink-0">
                            <User className="w-3.5 h-3.5 text-orange-500" />
                            {log.userName || "Member"}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold shrink-0 ${cfg.badgeColor}`}>
                            {cfg.badge}
                          </span>
                        </div>

                        <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3" />
                          {formattedDate}
                        </span>
                      </div>

                      {/* Log Action Details */}
                      <p className="text-xs sm:text-sm text-gray-700 dark:text-slate-300 font-medium leading-normal break-words">
                        {log.details || log.action}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
