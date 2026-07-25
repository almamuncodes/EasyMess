"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Calendar, Wallet, ShoppingBag } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const taka = (n) =>
  new Intl.NumberFormat("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0);

export default function PersonalAnalyticsChart({ userId }) {
  const { t, lang } = useTranslation();
  const isBn = lang === "bn";

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    fetch(`${API_BASE}/api/user/analytics/${userId}`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          setData(resData.data || []);
        }
      })
      .catch((err) => console.error("Error loading analytics chart:", err))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-1/3"></div>
        <div className="h-40 bg-gray-100 dark:bg-slate-800/60 rounded-2xl"></div>
      </div>
    );
  }

  const maxMealCount = Math.max(...data.map((m) => m.totalMeals), 90);
  const maxDepositAmt = Math.max(...data.map((m) => m.totalDeposit), 5000);

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-orange-500" />
            {isBn ? "ব্যক্তিগত খাবার ও খরচের বিশ্লেষণ (গত ৬ মাস)" : "Personal Meal & Expense Trend Analytics"}
          </h3>
          <p className="text-[11px] sm:text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            {isBn ? "মাসের ক্রমানুসারে আপনার মোট মিল ও জমার ট্রেন্ড" : "Month-by-month meal consumption and deposit trend analysis"}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            {isBn ? "মিল সংখ্যা" : "Meals"}
          </span>
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            {isBn ? "জমা টাকা" : "Deposit"}
          </span>
        </div>
      </div>

      {/* Visual Chart Bars */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((m, idx) => {
          const mealPct = Math.min(100, Math.round((m.totalMeals / maxMealCount) * 100));
          const depPct = Math.min(100, Math.round((m.totalDeposit / maxDepositAmt) * 100));

          return (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-gray-50/60 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800 space-y-3 shadow-sm hover:border-orange-500/30 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800 dark:text-slate-200 font-mono">
                  🗓️ {m.monthName}
                </span>
                <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full bg-orange-500/10">
                  {m.totalMeals} {isBn ? "মিল" : "meals"}
                </span>
              </div>

              {/* Meals Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-medium text-gray-600 dark:text-slate-400">
                  <span>{isBn ? "মোট মিল:" : "Total Meals:"}</span>
                  <span className="font-bold text-orange-600 dark:text-orange-400">{m.totalMeals}</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(5, mealPct)}%` }}
                  />
                </div>
              </div>

              {/* Deposit Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-medium text-gray-600 dark:text-slate-400">
                  <span>{isBn ? "জমা টাকা:" : "Total Deposit:"}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">৳{taka(m.totalDeposit)}</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(5, depPct)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
