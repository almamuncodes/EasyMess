"use client";

import React, { useState, useEffect } from "react";
import { GetUser } from "@/components/action/action";
import { toast } from "sonner";
import {
  Boxes,
  TrendingDown,
  ArrowUpRight,
  RefreshCw,
  FileText,
  Scale,
  Calendar,
  Utensils,
} from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";

export default function UserRiceManagementPage() {
  const user = GetUser();
  const userId = user?.user?.id;
  const { t, lang } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    config: { enableRiceManagement: true, ricePerMeal: 1, riceUnitName: "Unit" },
    summary: { totalAdded: 0, totalConsumed: 0, remaining: 0, todayConsumed: 0 },
    deposits: [],
    consumptionHistory: [],
  });

  const fetchData = async (showLoader = false) => {
    if (!userId) return;
    if (showLoader) setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/rice/member-summary?userId=${userId}`
      );
      const resData = await res.json();
      if (resData.success) {
        setData(resData);
      } else {
        toast.error(resData.message || "Failed to load rice details");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchData(true);
  }, [userId]);

  const unit = data.config.riceUnitName || "Unit";
  const isPositive = data.summary.remaining >= 0;

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="h-32 bg-gray-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-32 bg-gray-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-32 bg-gray-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-32 bg-gray-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 rounded-3xl shadow-lg shadow-amber-500/20">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="h-7 w-7" />
            <h1 className="text-2xl md:text-3xl font-extrabold">
              {lang === "bn" ? "আমার চালের হিসাব" : "My Rice Balance"}
            </h1>
          </div>
          <p className="text-amber-100 text-sm mt-1">
            {lang === "bn"
              ? `১ মিল = ${data.config.ricePerMeal} ${unit}`
              : `1 Meal = ${data.config.ricePerMeal} ${unit}`}
          </p>
        </div>

        <button
          onClick={() => fetchData(true)}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition backdrop-blur-md self-start md:self-auto"
          title="Refresh Data"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Added */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {lang === "bn" ? "মোট চাল জমা" : "Total Deposited"}
            </p>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1">
              {data.summary.totalAdded} <span className="text-base font-medium text-gray-500">{unit}</span>
            </h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
            <ArrowUpRight size={24} />
          </div>
        </div>

        {/* Total Consumed */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {lang === "bn" ? "মোট ব্যবহৃত চাল" : "Total Consumed"}
            </p>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1">
              {data.summary.totalConsumed} <span className="text-base font-medium text-gray-500">{unit}</span>
            </h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-500 flex items-center justify-center">
            <TrendingDown size={24} />
          </div>
        </div>

        {/* Remaining Balance */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {lang === "bn" ? "অবশিষ্ট চাল" : "Remaining Balance"}
            </p>
            <h3
              className={`text-3xl font-black mt-1 ${
                isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              {data.summary.remaining} <span className="text-base font-medium text-gray-500">{unit}</span>
            </h3>
          </div>
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              isPositive
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500"
                : "bg-red-50 dark:bg-red-950/40 text-red-500"
            }`}
          >
            <Scale size={24} />
          </div>
        </div>

        {/* Today's Usage */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {lang === "bn" ? "আজকের চাল খরচ" : "Today's Consumption"}
            </p>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1">
              {data.summary.todayConsumed} <span className="text-base font-medium text-gray-500">{unit}</span>
            </h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-500 flex items-center justify-center">
            <Utensils size={24} />
          </div>
        </div>
      </div>

      {/* Grid: Deposit History & Consumption History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Deposit History */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText size={20} className="text-amber-500" />
            <span>{lang === "bn" ? "চাল জমার হিস্ট্রি" : "Rice Deposit History"}</span>
          </h2>

          {data.deposits.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No rice deposits recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-800 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-center">Amount</th>
                    <th className="py-3 px-4">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {data.deposits.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 text-gray-600 dark:text-slate-300">
                        {d.date ? new Date(d.date).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-600">
                        +{d.amount} {unit}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-400">{d.note || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Daily Consumption History */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar size={20} className="text-orange-500" />
            <span>{lang === "bn" ? "দৈনিক চাল খরচের বিবরণ" : "Daily Consumption Breakdown"}</span>
          </h2>

          {data.consumptionHistory.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No consumption records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-800 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-center">Meals Count</th>
                    <th className="py-3 px-4 text-right">Rice Used</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {data.consumptionHistory.map((c, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 text-gray-600 dark:text-slate-300">
                        {c.date ? new Date(c.date).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-gray-900 dark:text-white">
                        {c.mealCount} Meals
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-orange-500">
                        -{c.consumed} {unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
