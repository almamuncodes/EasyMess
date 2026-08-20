"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
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
  Search,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";
import { getBDNow } from "@/lib/date-utils";

export const dynamic = "force-dynamic";

const display = Fraunces({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-display", display: "swap" });
const body = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const parts = String(dateStr).split("T")[0].split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);

      const monthsShort = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];
      if (!isNaN(day) && !isNaN(monthIdx) && monthIdx >= 0 && monthIdx < 12 && !isNaN(year)) {
        return `${day} ${monthsShort[monthIdx]} ${year}`;
      }
    }

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const day = d.getDate();
    const monthName = d.toLocaleString("en-US", { month: "short" });
    const yr = d.getFullYear();
    return `${day} ${monthName} ${yr}`;
  } catch (e) {
    return dateStr;
  }
}

export default function UserRiceManagementPage() {
  const user = GetUser();
  const userId = user?.user?.id;
  const { t, lang } = useTranslation();
  const isBn = lang === "bn";

  const [month, setMonth] = useState(() => getBDNow().month);
  const [year, setYear] = useState(() => getBDNow().year);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // "all", "deposits", "consumption"
  const [searchQuery, setSearchQuery] = useState("");

  const [data, setData] = useState({
    config: { enableRiceManagement: true, ricePerMeal: 1, riceUnitName: "Unit" },
    summary: { totalAdded: 0, totalConsumed: 0, remaining: 0, todayConsumed: 0 },
    deposits: [],
    consumptionHistory: [],
  });

  const monthOptions = useMemo(
    () => [
      { value: 1, labelEn: "January", labelBn: "জানুয়ারী" },
      { value: 2, labelEn: "February", labelBn: "ফেব্রুয়ারী" },
      { value: 3, labelEn: "March", labelBn: "মার্চ" },
      { value: 4, labelEn: "April", labelBn: "এপ্রিল" },
      { value: 5, labelEn: "May", labelBn: "মে" },
      { value: 6, labelEn: "June", labelBn: "জুন" },
      { value: 7, labelEn: "July", labelBn: "জুলাই" },
      { value: 8, labelEn: "August", labelBn: "আগস্ট" },
      { value: 9, labelEn: "September", labelBn: "সেপ্টেম্বর" },
      { value: 10, labelEn: "October", labelBn: "অক্টোবর" },
      { value: 11, labelEn: "November", labelBn: "নভেম্বর" },
      { value: 12, labelEn: "December", labelBn: "ডিসেম্বর" },
    ],
    []
  );

  const yearOptions = useMemo(() => {
    const currentY = getBDNow().year;
    return [currentY - 1, currentY, currentY + 1];
  }, []);

  const fetchData = async (showLoader = false) => {
    if (!userId) return;
    if (showLoader) setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/rice/member-summary?userId=${userId}&month=${month}&year=${year}`
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
  }, [userId, month, year]);

  const unit = data.config.riceUnitName || "Unit";
  const remaining = data.summary.remaining || 0;
  const totalAdded = data.summary.totalAdded || 0;
  const isPositive = remaining >= 0;

  // Calculate stock health percentage
  const stockPercentage = useMemo(() => {
    if (totalAdded <= 0) return 0;
    const pct = Math.round((remaining / totalAdded) * 100);
    return Math.max(0, Math.min(100, pct));
  }, [remaining, totalAdded]);

  // Filter deposits and consumption
  const filteredDeposits = useMemo(() => {
    if (!data.deposits) return [];
    if (!searchQuery) return data.deposits;
    return data.deposits.filter(
      (d) =>
        d.note?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.date && formatDate(d.date).toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [data.deposits, searchQuery]);

  const filteredConsumption = useMemo(() => {
    if (!data.consumptionHistory) return [];
    if (!searchQuery) return data.consumptionHistory;
    return data.consumptionHistory.filter(
      (c) => c.date && formatDate(c.date).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data.consumptionHistory, searchQuery]);

  if (loading) {
    return (
      <div className={`${display.variable} ${body.variable} ${mono.variable} min-h-screen bg-[#F2F4F1] dark:bg-slate-950 p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-pulse`}>
        <div className="h-10 bg-amber-200/50 dark:bg-slate-800 rounded-2xl w-1/3"></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-28 bg-white dark:bg-slate-900 rounded-2xl"></div>
          <div className="h-28 bg-white dark:bg-slate-900 rounded-2xl"></div>
          <div className="h-28 bg-white dark:bg-slate-900 rounded-2xl"></div>
          <div className="h-28 bg-white dark:bg-slate-900 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${display.variable} ${body.variable} ${mono.variable} min-h-screen bg-[#F2F4F1] dark:bg-slate-950 font-[family-name:var(--font-body)] text-[#1B2A26] dark:text-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6`}
    >
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-[#1B2A26]/10 dark:border-slate-800 pb-5">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#C99A3E] font-semibold flex items-center gap-1.5">
            <Boxes size={15} /> <span>{isBn ? "সদস্য রাইস ওভারভিউ" : "Member Rice Overview"}</span>
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold">
            {isBn ? "রাইস ওভারভিউ" : "Rice Overview"}
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            {isBn
              ? `মাসভিত্তিক চাল জমা, ব্যবহার ও অবশিষ্টাংশ হিসাব (১ মিল = ${data.config.ricePerMeal} ${unit})`
              : `Monthly rice deposit log, usage & balance summary (1 Meal = ${data.config.ricePerMeal} ${unit})`}
          </p>
        </div>

        {/* Month & Year Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-xl border border-[#1B2A26]/15 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-100 px-3 py-2 text-xs sm:text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C99A3E] cursor-pointer"
          >
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {isBn ? m.labelBn : m.labelEn}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-xl border border-[#1B2A26]/15 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-100 px-3 py-2 text-xs sm:text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C99A3E] cursor-pointer"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <button
            onClick={() => fetchData(true)}
            className="p-2 bg-white dark:bg-slate-900 border border-[#1B2A26]/15 dark:border-slate-800 text-gray-700 dark:text-slate-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition cursor-pointer shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Stock Health Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-gray-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            {remaining <= 0 ? (
              <span className="p-2 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl">
                <AlertTriangle size={20} />
              </span>
            ) : remaining < 5 ? (
              <span className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                <AlertTriangle size={20} />
              </span>
            ) : (
              <span className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <CheckCircle2 size={20} />
              </span>
            )}
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                {remaining <= 0
                  ? (isBn ? "⚠️ চাল স্টক শেষ!" : "⚠️ Rice Stock Out!")
                  : remaining < 5
                  ? (isBn ? "⚡ চাল কম রয়েছে — জলদি জমা দিন" : "⚡ Rice Stock Running Low")
                  : (isBn ? "✅ চালের স্টক পর্যাপ্ত আছে" : "✅ Healthy Rice Stock Balance")}
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {isBn
                  ? `মোট জমা: ${totalAdded} ${unit} | ব্যবহৃত: ${data.summary.totalConsumed} ${unit}`
                  : `Total Added: ${totalAdded} ${unit} | Consumed: ${data.summary.totalConsumed} ${unit}`}
              </p>
            </div>
          </div>

          <div className="flex items-baseline gap-1 self-end sm:self-center">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {isBn ? "অবশিষ্ট স্টক:" : "Stock Left:"}
            </span>
            <span className={`text-lg font-extrabold font-[family-name:var(--font-mono)] ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
              {remaining} {unit}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${
              stockPercentage < 15
                ? "bg-red-500"
                : stockPercentage < 40
                ? "bg-amber-500"
                : "bg-emerald-500"
            }`}
            style={{ width: `${stockPercentage}%` }}
          />
        </div>
      </div>

      {/* Summary Grid Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Added */}
        <div className="rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 backdrop-blur-xl p-4 shadow-sm hover:scale-[1.01] transition-all">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              {isBn ? "মোট চাল জমা" : "Total Deposited"}
            </span>
            <span className="text-base">🌾</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-mono)] text-gray-900 dark:text-white">
            {totalAdded} <span className="text-xs font-normal text-gray-500">{unit}</span>
          </p>
        </div>

        {/* Total Consumed */}
        <div className="rounded-2xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/40 backdrop-blur-xl p-4 shadow-sm hover:scale-[1.01] transition-all">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 dark:text-orange-300">
              {isBn ? "মোট ব্যবহৃত চাল" : "Total Consumed"}
            </span>
            <span className="text-base">🍲</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-mono)] text-gray-900 dark:text-white">
            {data.summary.totalConsumed} <span className="text-xs font-normal text-gray-500">{unit}</span>
          </p>
        </div>

        {/* Remaining Balance */}
        <div className={`rounded-2xl backdrop-blur-xl p-4 shadow-sm hover:scale-[1.01] transition-all border ${
          isPositive
            ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40"
            : "bg-rose-50/70 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/40"
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isPositive ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>
              {isBn ? "অবশিষ্ট চাল" : "Remaining Stock"}
            </span>
            <span className="text-base">⚖️</span>
          </div>
          <p className={`text-xl sm:text-2xl font-bold font-[family-name:var(--font-mono)] ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            {remaining} <span className="text-xs font-normal text-gray-500">{unit}</span>
          </p>
        </div>

        {/* Today's Usage */}
        <div className="rounded-2xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 backdrop-blur-xl p-4 shadow-sm hover:scale-[1.01] transition-all col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
              {isBn ? "আজকের চাল খরচ" : "Today's Consumption"}
            </span>
            <span className="text-base">🍽️</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-mono)] text-gray-900 dark:text-white">
            {data.summary.todayConsumed} <span className="text-xs font-normal text-gray-500">{unit}</span>
          </p>
        </div>
      </div>

      {/* Main Breakdown Section */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-6">
        {/* Controls & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-slate-800 pb-4">
          {/* Tab Selector */}
          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "all"
                  ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800 dark:hover:text-slate-200"
              }`}
            >
              {isBn ? "সকল হিস্ট্রি" : "All Records"}
            </button>
            <button
              onClick={() => setActiveTab("deposits")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "deposits"
                  ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm"
                  : "text-gray-500 hover:text-gray-800 dark:hover:text-slate-200"
              }`}
            >
              {isBn ? "চাল জমা" : "Deposits"} ({data.deposits.length})
            </button>
            <button
              onClick={() => setActiveTab("consumption")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "consumption"
                  ? "bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm"
                  : "text-gray-500 hover:text-gray-800 dark:hover:text-slate-200"
              }`}
            >
              {isBn ? "দৈনিক খরচ" : "Usage"} ({data.consumptionHistory.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isBn ? "হিস্ট্রি খুঁজুন..." : "Filter history..."}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
            />
          </div>
        </div>

        {/* Tables & Lists Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rice Deposits History */}
          {(activeTab === "all" || activeTab === "deposits") && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold flex items-center gap-2">
                  <FileText size={18} className="text-amber-500" />
                  <span>{isBn ? "চাল জমার হিস্ট্রি" : "Rice Deposit History"}</span>
                </h2>
                <span className="text-xs font-semibold text-gray-400">
                  {filteredDeposits.length} {isBn ? "টি এন্ট্রি" : "entries"}
                </span>
              </div>

              {filteredDeposits.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-slate-800">
                  <Boxes className="mx-auto text-gray-300 dark:text-slate-600 mb-2" size={32} />
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {isBn ? "কোনো চাল জমার রেকর্ড পাওয়া যায়নি" : "No rice deposits recorded for this month"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {filteredDeposits.map((d, idx) => (
                    <div
                      key={d.id || idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50/60 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800 hover:bg-gray-100/60 transition"
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white">
                          {formatDate(d.date)}
                        </p>
                        <p className="text-[11px] text-gray-400">{d.note || (isBn ? "চাল জমা এন্ট্রি" : "Deposit entry")}</p>
                      </div>
                      <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400 font-[family-name:var(--font-mono)]">
                        +{d.amount} {unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Daily Consumption Breakdown */}
          {(activeTab === "all" || activeTab === "consumption") && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Calendar size={18} className="text-orange-500" />
                  <span>{isBn ? "দৈনিক চাল খরচের বিবরণ" : "Daily Consumption Breakdown"}</span>
                </h2>
                <span className="text-xs font-semibold text-gray-400">
                  {filteredConsumption.length} {isBn ? "টি দিন" : "days"}
                </span>
              </div>

              {filteredConsumption.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-slate-800">
                  <Utensils className="mx-auto text-gray-300 dark:text-slate-600 mb-2" size={32} />
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {isBn ? "কোনো চাল খরচের তথ্য পাওয়া যায়নি" : "No consumption records found for this month"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {filteredConsumption.map((c, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50/60 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800 hover:bg-gray-100/60 transition"
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white">
                          {formatDate(c.date)}
                        </p>
                        <p className="text-[11px] text-gray-400">{c.mealCount} {isBn ? "টি মিল খাওয়া হয়েছে" : "Meals consumed"}</p>
                      </div>
                      <span className="font-bold text-sm text-orange-500 font-[family-name:var(--font-mono)]">
                        -{c.consumed} {unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
