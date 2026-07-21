"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { GetUser } from "@/components/action/action";
import { useTranslation } from "@/lib/useTranslation";
import { ShoppingBag, TrendingUp, Calendar, Award, BarChart3, ChevronDown, AlertCircle, ShoppingCart } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const taka = (n) =>
  new Intl.NumberFormat("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n || 0);

const getBazaarAmount = (b) => {
  if (!b) return 0;
  if (b.totalAmount !== undefined && b.totalAmount !== null) return Number(b.totalAmount);
  if (b.amount !== undefined && b.amount !== null) return Number(b.amount);
  return 0;
};

function renderBazaarSummaryTitle(b) {
  if (!b) return "Bazaar";
  if (typeof b.note === "string" && b.note.trim()) return b.note;
  if (typeof b.description === "string" && b.description.trim()) return b.description;
  if (Array.isArray(b.items) && b.items.length > 0) {
    const titles = b.items
      .map((item) => (typeof item === "string" ? item : item?.title || item?.name || item?.item || ""))
      .filter(Boolean);
    if (titles.length > 0) return titles.join(", ");
  }
  if (typeof b.items === "string" && b.items.trim()) return b.items;
  if (typeof b.bazaarBy === "string" && b.bazaarBy.trim()) return `Bazaar by ${b.bazaarBy}`;
  return "Bazaar Log";
}

export default function ManagerBazaarAnalysisPage() {
  const { t, lang } = useTranslation();
  const isBn = lang === "bn";

  const user = GetUser();
  const managerId = user?.user?.id;

  const now = new Date();
  const currentMonth = String(now.getMonth() + 1);
  const currentYear = String(now.getFullYear());

  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [expandedIds, setExpandedIds] = useState(new Set());

  const [bazaars, setBazaars] = useState(() => {
    if (typeof window !== "undefined" && managerId) {
      const cached = sessionStorage.getItem(`mgr_bazaar_analysis_${managerId}_${currentMonth}_${currentYear}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          return parsed.bazaars || [];
        } catch (e) {}
      }
    }
    return [];
  });
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(() => bazaars.length === 0);
  const [errorMsg, setErrorMsg] = useState("");

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const loadData = useCallback(async () => {
    if (!managerId) return;

    const cacheKey = `mgr_bazaar_analysis_${managerId}_${month}_${year}`;
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setBazaars(parsed.bazaars || []);
          setGrandTotal(parsed.grandTotal || 0);
        } catch (e) {}
      } else {
        if (bazaars.length === 0) setLoading(true);
      }
    }

    setErrorMsg("");
    try {
      const params = new URLSearchParams({ managerId });
      if (month) params.set("month", month);
      if (year) params.set("year", year);

      const res = await fetch(`${API_BASE}/api/bazaars?${params.toString()}`);
      const data = await res.json();

      if (!data.success) throw new Error(data.message || "Failed to load bazaar analysis");

      const newBazaars = data.data || [];
      const newGrandTotal = data.grandTotal || 0;

      setBazaars(newBazaars);
      setGrandTotal(newGrandTotal);

      if (typeof window !== "undefined") {
        sessionStorage.setItem(cacheKey, JSON.stringify({ bazaars: newBazaars, grandTotal: newGrandTotal }));
      }
    } catch (err) {
      setErrorMsg(err.message || "Could not connect to server");
    } finally {
      setLoading(false);
    }
  }, [managerId, month, year, bazaars.length]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real data analytics
  const stats = useMemo(() => {
    const count = bazaars.length;
    const calcTotal = grandTotal || bazaars.reduce((acc, b) => acc + getBazaarAmount(b), 0);
    const avgAmount = count > 0 ? calcTotal / count : 0;

    let maxBazaar = null;

    bazaars.forEach((b) => {
      const amt = getBazaarAmount(b);
      if (!maxBazaar || amt > getBazaarAmount(maxBazaar)) maxBazaar = b;
    });

    return { totalAmount: calcTotal, count, avgAmount, maxBazaar };
  }, [bazaars, grandTotal]);

  const maxDailyAmount = useMemo(() => {
    if (bazaars.length === 0) return 1000;
    const maxVal = Math.max(...bazaars.map((b) => getBazaarAmount(b)));
    return maxVal > 0 ? maxVal : 1000;
  }, [bazaars]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-orange-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-3 sm:p-6 lg:p-8 text-gray-900 dark:text-slate-100">
      <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6">
        
        {/* Modern Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 sm:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[11px] sm:text-xs font-semibold uppercase tracking-wider mb-2">
              <BarChart3 className="w-3.5 h-3.5" />
              Manager · {t("bazaarAnalysis")}
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
              {isBn ? "বাজার খরচ এনালাইসিস" : "Bazaar Expense Analytics"}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5">
              {isBn ? "লাইভ ডাটাবেজ এনালাইসিস চার্ট ও বিস্তারিত খরচের তালিকা" : "Live daily bazaar spending graphs and item breakdown"}
            </p>
          </div>

          {/* Responsive Selectors */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-xs font-semibold focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={String(m)}>
                  {new Date(2000, m - 1, 1).toLocaleString("default", { month: "short" })}
                </option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-xs font-semibold focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Responsive Overview Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-gray-400 mb-1.5">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                {isBn ? "মোট বাজার" : "Total Spend"}
              </span>
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />
            </div>
            <p className="text-lg sm:text-2xl font-black font-mono">
              ৳{taka(stats.totalAmount)}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-gray-400 mb-1.5">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                {isBn ? "মোট দিন" : "Total Entries"}
              </span>
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
            </div>
            <p className="text-lg sm:text-2xl font-black font-mono">
              {stats.count} {isBn ? "টি" : "logs"}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-gray-400 mb-1.5">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {isBn ? "গড় বাজার" : "Daily Avg"}
              </span>
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
            </div>
            <p className="text-lg sm:text-2xl font-black font-mono">
              ৳{taka(stats.avgAmount)}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-gray-400 mb-1.5">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                {isBn ? "সর্বোচ্চ বাজার" : "Highest Single"}
              </span>
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500" />
            </div>
            <p className="text-lg sm:text-2xl font-black font-mono">
              ৳{taka(getBazaarAmount(stats.maxBazaar))}
            </p>
          </div>
        </div>

        {/* Visual Bar Chart (Graph) */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-3 sm:space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-orange-500" />
                {isBn ? "দৈনিক খরচের গ্রাফ চার্ট" : "Daily Bazaar Spending Graph"}
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-400 font-mono mt-0.5">
                Avg: ৳{taka(stats.avgAmount)} · Peak: ৳{taka(maxDailyAmount)}
              </p>
            </div>

            {/* Compact Color Legend */}
            <div className="flex items-center gap-2.5 text-[10px] sm:text-xs font-semibold bg-gray-50 dark:bg-slate-800/80 px-2.5 py-1 rounded-xl border border-gray-100 dark:border-slate-700">
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                {isBn ? "পিক" : "Peak"}
              </span>
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                {isBn ? "গড়ের উপরে" : "Above Avg"}
              </span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {isBn ? "স্বাভাবিক" : "Normal"}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="h-56 flex items-center justify-center text-xs text-gray-400 animate-pulse">
              {isBn ? "গ্রাফ চার্ট লোড হচ্ছে..." : "Loading graph..."}
            </div>
          ) : bazaars.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-xs text-gray-400 gap-2">
              <AlertCircle className="w-6 h-6 text-gray-300" />
              {isBn ? "এই মাসে কোনো বাজার রেকর্ড নেই" : "No bazaar records for this month"}
            </div>
          ) : (
            <div className="relative pt-4 pb-1">
              <div className="h-56 flex items-end gap-2.5 sm:gap-3 overflow-x-auto pb-3 px-2 border-b border-gray-100 dark:border-slate-800">
                {bazaars.map((b, i) => {
                  const amt = getBazaarAmount(b);
                  const pct = Math.max(15, Math.min(100, (amt / maxDailyAmount) * 100));
                  const dateObj = b.date ? new Date(b.date) : null;
                  const dateNum = dateObj ? dateObj.getDate() : i + 1;
                  const isMax = stats.maxBazaar && stats.maxBazaar._id === b._id;

                  let barGradient = "bg-gradient-to-t from-emerald-500 to-teal-400 border border-emerald-400/40";
                  let badgeColor = "text-emerald-600 dark:text-emerald-400 font-bold";

                  if (isMax || amt >= maxDailyAmount * 0.8) {
                    barGradient = "bg-gradient-to-t from-red-600 via-rose-500 to-orange-400 border border-red-500/60 shadow-md shadow-red-500/20";
                    badgeColor = "text-red-600 dark:text-red-400 font-black";
                  } else if (amt >= stats.avgAmount) {
                    barGradient = "bg-gradient-to-t from-amber-500 to-yellow-400 border border-amber-400/50";
                    badgeColor = "text-amber-600 dark:text-amber-400 font-bold";
                  }

                  return (
                    <div
                      key={b._id || i}
                      onClick={() => b._id && toggleExpand(b._id)}
                      className="flex-1 min-w-[44px] max-w-[60px] flex flex-col items-center gap-1.5 group cursor-pointer"
                    >
                      <span className={`text-[10px] sm:text-[11px] font-mono transition-transform group-hover:-translate-y-0.5 ${badgeColor}`}>
                        ৳{taka(amt)}
                      </span>

                      <div className="w-full h-36 bg-gray-100 dark:bg-slate-800/80 rounded-xl flex items-end p-1 border border-gray-200/50 dark:border-slate-800 shadow-inner">
                        <div
                          className={`w-full rounded-lg transition-all duration-300 group-hover:brightness-110 shadow-sm ${barGradient}`}
                          style={{ height: `${pct}%` }}
                        />
                      </div>

                      <span className="text-[10px] font-mono text-gray-500 dark:text-slate-400 font-medium">
                        {dateNum} {dateObj ? dateObj.toLocaleString("default", { month: "short" }) : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Perfectly Mobile-Responsive Itemized Accordions */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="pb-2 border-b border-gray-100 dark:border-slate-800">
            <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-orange-500" />
              {isBn ? "দৈনিক বাজারের বিস্তারিত তালিকা" : "Daily Bazaar Item Breakdown"}
            </h3>
            <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
              {isBn ? "আইটেমে ক্লিক করে আলাদা পণ্যের দরদাম দেখুন" : "Click to toggle item-by-item prices"}
            </p>
          </div>

          {bazaars.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No bazaar logs available.</p>
          ) : (
            <div className="space-y-2.5 sm:space-y-3">
              {bazaars.map((b, idx) => {
                const bId = b._id || String(idx);
                const isExpanded = expandedIds.has(bId);
                const amt = getBazaarAmount(b);
                const dateObj = b.date ? new Date(b.date) : null;
                const formattedDate = dateObj
                  ? dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : "Log Date";
                const itemCount = Array.isArray(b.items) ? b.items.length : 0;

                return (
                  <div
                    key={bId}
                    className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-800/40 overflow-hidden transition-all shadow-sm hover:border-orange-500/30"
                  >
                    {/* Header: Clean, Non-wrapping Responsive Flexbox */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(bId)}
                      className="w-full p-3 sm:p-4 flex items-center justify-between text-left cursor-pointer hover:bg-gray-100/60 dark:hover:bg-slate-800/80 transition gap-2 sm:gap-4"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        {/* Icon */}
                        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">
                          🛍️
                        </div>

                        {/* Title & Date Info - Clean layout preventing bad multiline wraps */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-slate-100 whitespace-nowrap">
                              {formattedDate}
                            </span>
                            {itemCount > 0 && (
                              <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[9px] sm:text-[10px] font-bold whitespace-nowrap">
                                {itemCount} {isBn ? "টি আইটেম" : "items"}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5 truncate">
                            {renderBazaarSummaryTitle(b)} · By <strong className="text-gray-700 dark:text-slate-300">{typeof b.bazaarBy === "string" ? b.bazaarBy : "Member"}</strong>
                          </p>
                        </div>
                      </div>

                      {/* Right Amount & Arrow */}
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <span className="font-mono font-black text-sm sm:text-base text-orange-600 dark:text-orange-400">
                          ৳{taka(amt)}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                            isExpanded ? "rotate-180 text-orange-500" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {/* Accordion Itemized Price List */}
                    {isExpanded && (
                      <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-1 border-t border-gray-100 dark:border-slate-800 space-y-2 bg-white dark:bg-slate-900">
                        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-400 pt-2 mb-2">
                          {isBn ? "পণ্যের মূল্য তালিকা:" : "Item Price List:"}
                        </p>

                        {Array.isArray(b.items) && b.items.length > 0 ? (
                          <div className="grid gap-1.5 sm:gap-2 grid-cols-1 sm:grid-cols-2">
                            {b.items.map((it, itemIdx) => {
                              const title = typeof it === "string" ? it : it?.title || it?.name || it?.item || "Item";
                              const itemAmt = typeof it === "object" ? it?.amount : null;

                              return (
                                <div
                                  key={itemIdx}
                                  className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-slate-800/80 border border-gray-100 dark:border-slate-800 text-xs"
                                >
                                  <span className="font-medium text-gray-800 dark:text-slate-200 truncate pr-2">
                                    • {title}
                                  </span>
                                  {itemAmt !== undefined && itemAmt !== null && (
                                    <span className="font-mono font-bold text-gray-900 dark:text-white shrink-0">
                                      ৳{taka(itemAmt)}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">
                            {b.note || renderBazaarSummaryTitle(b)} (Total: ৳{taka(amt)})
                          </p>
                        )}
                      </div>
                    )}
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
