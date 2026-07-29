"use client";
import React, { useEffect, useState, useMemo } from "react";
import { GetUser } from "@/components/action/action";
import { useTranslation } from "@/lib/useTranslation";
import { toast } from "sonner";
import Image from "next/image";
import {
  BarChart3,
  Building,
  Users,
  Utensils,
  Wallet,
  ShoppingBag,
  TrendingUp,
  RefreshCcw,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  MapPin,
  Flame,
} from "lucide-react";

export default function AdminAnalyticsPage() {
  const user = GetUser();
  const adminUserId = user?.user?.id;
  const { lang } = useTranslation();
  const isBn = lang === "bn";

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [analytics, setAnalytics] = useState(() => {
    if (typeof window !== "undefined" && adminUserId) {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const cached = sessionStorage.getItem(`admin_analytics_${adminUserId}_${currentMonth}_${currentYear}`);
      if (cached) {
        try { return JSON.parse(cached); } catch (e) {}
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(() => !analytics);

  const taka = (n) =>
    new Intl.NumberFormat("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n || 0);

  const months = [
    { value: 1, label: isBn ? "জানুয়ারি" : "January" },
    { value: 2, label: isBn ? "ফেব্রুয়ারি" : "February" },
    { value: 3, label: isBn ? "মার্চ" : "March" },
    { value: 4, label: isBn ? "এপ্রিল" : "April" },
    { value: 5, label: isBn ? "মে" : "May" },
    { value: 6, label: isBn ? "জুন" : "June" },
    { value: 7, label: isBn ? "জুলাই" : "July" },
    { value: 8, label: isBn ? "আগস্ট" : "August" },
    { value: 9, label: isBn ? "সেপ্টেম্বর" : "September" },
    { value: 10, label: isBn ? "অক্টোবর" : "October" },
    { value: 11, label: isBn ? "নভেম্বর" : "November" },
    { value: 12, label: isBn ? "ডিসেম্বর" : "December" },
  ];

  const years = [2024, 2025, 2026, 2027];

  const fetchAnalytics = async (force = false) => {
    if (!adminUserId) return;

    if (!force && typeof window !== "undefined") {
      const cached = sessionStorage.getItem(`admin_analytics_${adminUserId}_${selectedMonth}_${selectedYear}`);
      if (cached) {
        try {
          setAnalytics(JSON.parse(cached));
          setLoading(false);
          return;
        } catch (e) {}
      }
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/analytics?userId=${adminUserId}&month=${selectedMonth}&year=${selectedYear}`
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setAnalytics(data);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(`admin_analytics_${adminUserId}_${selectedMonth}_${selectedYear}`, JSON.stringify(data));
        }
      } else {
        toast.error(data.message || (isBn ? "এনালিটিক্স লোড করতে ব্যর্থ" : "Failed to load analytics"));
      }
    } catch (err) {
      console.error(err);
      toast.error(isBn ? "সার্ভার এরর" : "Server error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchAnalytics(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminUserId, selectedMonth, selectedYear]);

  const totals = analytics?.totals || {};

  const filteredMesses = useMemo(() => {
    const list = analytics?.messBreakdown || [];
    return list.filter((m) => {
      const matchesSearch =
        m.messName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.messLocation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.inviteCode?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || m.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [analytics?.messBreakdown, searchQuery, statusFilter]);

  const selectedMonthName = months.find((m) => m.value === selectedMonth)?.label;

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <BarChart3 className="text-orange-500" size={26} />
            {isBn ? "মেসওয়াইজ মাসিক খরচ ও অ্যাক্টিভিটি রিপোর্ট" : "Mess Financial & Activity Analytics"}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
            {isBn
              ? "মাস নির্বাচন করে দেখুন কোন মেসের বাজার খরচ, ডিপোজিট, মোট মিল ও মিলরেট কেমন ছিল।"
              : "Filter by month/year to inspect bazaar expenses, deposits, meals count, and activity status for each mess."}
          </p>
        </div>
        <button
          onClick={() => fetchAnalytics(true)}
          className="self-start sm:self-auto px-4 py-2 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-xl text-xs font-semibold hover:bg-orange-100 transition flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
          <span>{isBn ? "রিফ্রেশ" : "Refresh"}</span>
        </button>
      </div>

      {/* Month, Year & Status Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
        {/* Month Selector */}
        <div className="sm:col-span-3">
          <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">
            {isBn ? "মাস নির্বাচন করুন" : "Select Month"}
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Year Selector */}
        <div className="sm:col-span-3">
          <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">
            {isBn ? "বছর নির্বাচন করুন" : "Select Year"}
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="sm:col-span-3">
          <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">
            {isBn ? "মেস স্ট্যাটাস" : "Activity Status"}
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          >
            <option value="all">{isBn ? "সকল মেস (All Messes)" : "All Messes"}</option>
            <option value="active">{isBn ? "সক্রিয় মেস (Active Messes)" : "Active Messes"}</option>
            <option value="inactive">{isBn ? "নিষ্ক্রিয় মেস (Inactive Messes)" : "Inactive Messes"}</option>
          </select>
        </div>

        {/* Mess Search */}
        <div className="sm:col-span-3">
          <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">
            {isBn ? "মেসের নাম দিয়ে খুঁজুন" : "Search Mess"}
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder={isBn ? "মেসের নাম..." : "Search mess..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Selected Month Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase">
                {selectedMonthName} {selectedYear} Messes
              </span>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  {totals.totalMess || 0}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  {totals.activeMessCount || 0} Active
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase">
                {selectedMonthName} Total Deposits
              </span>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 pt-1">
                ৳ {taka(totals.monthTotalDeposit)}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase">
                {selectedMonthName} Total Bazaar
              </span>
              <p className="text-xl font-bold text-rose-600 dark:text-rose-400 pt-1">
                ৳ {taka(totals.monthTotalBazaar)}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase">
                {selectedMonthName} Total Meals
              </span>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400 pt-1">
                {totals.monthTotalMeals || 0}
              </p>
            </div>
          </div>

          {/* Per-Mess Breakdown Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Building size={20} className="text-orange-500" />
                {selectedMonthName} {selectedYear} - {isBn ? "প্রতিটি মেসের বিস্তারিত রিপোর্ট" : "Per-Mess Monthly Breakdown"}
              </h2>
              <span className="text-xs font-semibold text-gray-400">
                {filteredMesses.length} {isBn ? "টি মেস পাওয়া গেছে" : "Messes Found"}
              </span>
            </div>

            {filteredMesses.length === 0 ? (
              <div className="p-12 text-center text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800">
                {isBn ? "কোনো মেসের ডাটা পাওয়া যায়নি" : "No messes match your selected filters"}
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50/80 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        <th className="py-4 px-6">Mess Name & Location</th>
                        <th className="py-4 px-4 text-center">Status</th>
                        <th className="py-4 px-4 text-center">Members</th>
                        <th className="py-4 px-4 text-right">Bazaar Cost</th>
                        <th className="py-4 px-4 text-right">Total Deposits</th>
                        <th className="py-4 px-4 text-right">Total Meals</th>
                        <th className="py-4 px-6 text-right">Meal Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                      {filteredMesses.map((m, idx) => {
                        const isEven = idx % 2 === 0;
                        const rowBg = isEven
                          ? "bg-white dark:bg-slate-900"
                          : "bg-orange-50/30 dark:bg-orange-950/10";
                        const isActive = m.status === "active";

                        return (
                          <tr key={m._id} className={`${rowBg} hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition`}>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                {m.messImage ? (
                                  <Image
                                    src={m.messImage}
                                    alt={m.messName}
                                    width={40}
                                    height={40}
                                    quality={40}
                                    className="w-10 h-10 rounded-xl object-cover border border-gray-200 dark:border-slate-700"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400 flex items-center justify-center font-bold text-sm">
                                    <Building size={20} />
                                  </div>
                                )}
                                <div>
                                  <p className="font-bold text-gray-900 dark:text-white text-sm">
                                    {m.messName}
                                  </p>
                                  <p className="text-xs text-gray-400 flex items-center gap-1">
                                    <MapPin size={12} className="text-orange-500 shrink-0" />
                                    <span>{m.messLocation || "No Location"}</span>
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold capitalize ${
                                  isActive
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                    : "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400"
                                }`}
                              >
                                {isActive ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                                {isActive ? (isBn ? "অ্যাক্টিভ" : "Active") : (isBn ? "নিষ্ক্রিয়" : "Inactive")}
                              </span>
                            </td>

                            <td className="py-4 px-4 text-center font-semibold text-gray-700 dark:text-slate-300">
                              {m.totalMembers}
                            </td>

                            <td className="py-4 px-4 text-right font-bold text-rose-600 dark:text-rose-400">
                              ৳ {taka(m.totalBazaar)}
                            </td>

                            <td className="py-4 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                              ৳ {taka(m.totalDeposit)}
                            </td>

                            <td className="py-4 px-4 text-right font-bold text-amber-600 dark:text-amber-400">
                              {m.totalMealsPoints}
                            </td>

                            <td className="py-4 px-6 text-right">
                              <span className="inline-block px-2.5 py-1 bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 rounded-lg font-bold text-xs">
                                ৳ {m.mealRate} / meal
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile & Tablet Card View */}
                <div className="block lg:hidden space-y-3">
                  {filteredMesses.map((m, idx) => {
                    const isEven = idx % 2 === 0;
                    const cardBg = isEven
                      ? "bg-white dark:bg-slate-900"
                      : "bg-orange-50/40 dark:bg-orange-950/15";
                    const isActive = m.status === "active";

                    return (
                      <div
                        key={m._id}
                        className={`p-4 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-3 ${cardBg}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {m.messImage ? (
                              <Image
                                src={m.messImage}
                                alt={m.messName}
                                width={40}
                                height={40}
                                quality={40}
                                className="w-10 h-10 rounded-xl object-cover border border-gray-200 dark:border-slate-700"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400 flex items-center justify-center font-bold text-sm">
                                <Building size={20} />
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white text-sm">
                                {m.messName}
                              </p>
                              <p className="text-xs text-gray-400 flex items-center gap-1">
                                <MapPin size={12} className="text-orange-500 shrink-0" />
                                <span>{m.messLocation || "No Location"}</span>
                              </p>
                            </div>
                          </div>

                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1 ${
                              isActive
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                          >
                            {isActive ? "Active" : "Inactive"}
                          </span>
                        </div>

                        {/* Breakdown Grid */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-slate-800/80 text-xs">
                          <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/60 space-y-0.5">
                            <span className="text-[10px] text-gray-400 uppercase font-semibold">Bazaar Cost</span>
                            <p className="font-bold text-rose-600 dark:text-rose-400">৳ {taka(m.totalBazaar)}</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/60 space-y-0.5">
                            <span className="text-[10px] text-gray-400 uppercase font-semibold">Deposits</span>
                            <p className="font-bold text-emerald-600 dark:text-emerald-400">৳ {taka(m.totalDeposit)}</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/60 space-y-0.5">
                            <span className="text-[10px] text-gray-400 uppercase font-semibold">Total Meals</span>
                            <p className="font-bold text-amber-600 dark:text-amber-400">{m.totalMealsPoints}</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/60 space-y-0.5">
                            <span className="text-[10px] text-gray-400 uppercase font-semibold">Meal Rate</span>
                            <p className="font-bold text-orange-600 dark:text-orange-400">৳ {m.mealRate}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
