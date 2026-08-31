"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import { GetUser } from "@/components/action/action";
import { toast } from "sonner";
import Image from "next/image";
import { getOptimizedImageUrl, getCachedImageMap, setCachedImageMap } from "@/lib/image-utils";
import MemberAvatar from "@/components/ui/MemberAvatar";

export const dynamic = "force-dynamic";
import {
  Boxes,
  Plus,
  Trash2,
  Calendar,
  Search,
  TrendingDown,
  ArrowUpRight,
  RefreshCw,
  FileText,
  Scale,
  Download,
  X,
  User,
  Sparkles,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";
import { getBDNow, getBDDateStr } from "@/lib/date-utils";

const display = Fraunces({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-display", display: "swap" });
const body = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });

function formatRice(val) {
  if (val === undefined || val === null || isNaN(val)) return "0";
  const num = Number(val);
  return Number.isInteger(num) ? num.toString() : (Math.round(num * 10) / 10).toString();
}

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

export default function ManagerRiceOverviewPage() {
  const user = GetUser();
  const userId = user?.user?.id;
  const { t, lang } = useTranslation();
  const isBn = lang === "bn";

  const bdNow = getBDDateStr();
  const defaultDateObj = new Date(bdNow);
  const [selectedMonth, setSelectedMonth] = useState(() => getBDNow().month);
  const [selectedYear, setSelectedYear] = useState(() => getBDNow().year);

  const [data, setData] = useState(() => {
    if (typeof window !== "undefined" && userId) {
      const cached = sessionStorage.getItem(`rice_summary_${userId}_${selectedMonth}_${selectedYear}`);
      if (cached) {
        try { return JSON.parse(cached); } catch (e) {}
      }
    }
    return {
      config: { enableRiceManagement: true, ricePerMeal: 1, riceUnitName: "Unit" },
      summary: { totalMessStockAdded: 0, totalMessConsumed: 0, totalMessRemaining: 0 },
      members: [],
      history: [],
    };
  });
  const [loading, setLoading] = useState(() => !data || data.members.length === 0);

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [expandedMemberId, setExpandedMemberId] = useState(null);

  // Form state for adding rice deposit
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => bdNow);
  const [note, setNote] = useState("");

  // Delete modal state
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async (showLoader = false) => {
    if (!userId) return;
    if (showLoader && (!data || !data.members || data.members.length === 0)) setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/rice/summary?userId=${userId}&month=${selectedMonth}&year=${selectedYear}`
      );
      const resData = await res.json();
      if (resData.success) {
        setData(resData);
        if (resData.members && Array.isArray(resData.members)) {
          const map = {};
          resData.members.forEach((m) => {
            if (m.userId && m.image) {
              map[m.userId] = m.image;
            }
          });
          setCachedImageMap(map);
        }
        if (typeof window !== "undefined") {
          sessionStorage.setItem(`rice_summary_${userId}_${selectedMonth}_${selectedYear}`, JSON.stringify(resData));
        }
      } else {
        toast.error(resData.message || "Failed to load rice summary");
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
  }, [userId, selectedMonth, selectedYear]);

  async function handleDownloadPdf() {
    if (!data || data.members.length === 0) {
      toast.error("No member data to export");
      return;
    }
    setExporting(true);

    try {
      const { default: jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF();
      const englishMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const monthName = englishMonths[selectedMonth - 1] || selectedMonth;
      const unitStr = data.config.riceUnitName || "Unit";

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("EasyMess - Manager Rice Overview Report", 14, 18);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Month: ${monthName} ${selectedYear}`, 14, 25);
      doc.text(`Generated Date: ${new Date().toLocaleDateString()}`, 14, 30);

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(
        `Total Added: ${formatRice(data.summary.totalMessStockAdded)} ${unitStr}   |   Consumed: ${formatRice(data.summary.totalMessConsumed)} ${unitStr}   |   Stock Balance: ${formatRice(data.summary.totalMessRemaining)} ${unitStr}`,
        14,
        38
      );

      autoTable(doc, {
        startY: 44,
        head: [["Member Name", "Role", "Total Added", "Consumed", "Remaining Balance"]],
        body: data.members.map((m) => [
          m.name,
          m.role ? m.role.toUpperCase() : "MEMBER",
          `${formatRice(m.totalAdded)} ${unitStr}`,
          `${formatRice(m.totalConsumed)} ${unitStr}`,
          `${formatRice(m.remaining)} ${unitStr}`,
        ]),
        headStyles: { fillColor: [217, 119, 6] },
        styles: { fontSize: 9 },
      });

      doc.save(`Rice_Overview_${monthName}_${selectedYear}.pdf`);
      toast.success("PDF report downloaded successfully!");
    } catch (err) {
      console.error("PDF Export Error:", err);
      toast.error("Failed to generate PDF report");
    } finally {
      setExporting(false);
    }
  }

  const handleAddDeposit = async (e) => {
    e.preventDefault();
    if (!selectedMemberId || !amount || !date) {
      toast.error("Please fill in member, amount and date");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/rice/deposit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            managerId: userId,
            userId: selectedMemberId,
            amount: parseFloat(amount),
            date,
            note,
          }),
        }
      );
      const resData = await res.json();
      if (resData.success) {
        toast.success("Rice transaction recorded successfully!");
        setIsModalOpen(false);
        setAmount("");
        setNote("");
        fetchData(false);
      } else {
        toast.error(resData.message || "Failed to record transaction");
      }
    } catch (err) {
      toast.error("Error saving rice deposit");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/rice/deposit/${deleteTargetId}?managerId=${userId}`,
        { method: "DELETE" }
      );
      const resData = await res.json();
      if (resData.success) {
        toast.success(isBn ? "চাল জমার এন্ট্রি মুছে ফেলা হয়েছে" : "Deposit entry deleted");
        setDeleteTargetId(null);
        fetchData(false);
      } else {
        toast.error(resData.message || (isBn ? "মুছে ফেলতে সমস্যা হয়েছে" : "Failed to delete deposit"));
      }
    } catch (err) {
      toast.error(isBn ? "সার্ভার সংযোগে ত্রুটি" : "Error deleting deposit");
    } finally {
      setDeleting(false);
    }
  };

  const filteredMembers = useMemo(() => {
    if (!data.members) return [];
    return data.members.filter((m) =>
      m.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data.members, searchQuery]);

  const memberHistoryGrouped = useMemo(() => {
    if (!data.history || !Array.isArray(data.history)) return {};
    const map = {};
    data.history.forEach((h) => {
      if (!map[h.userId]) map[h.userId] = [];
      map[h.userId].push(h);
    });
    return map;
  }, [data.history]);

  const unit = data.config.riceUnitName || "Unit";

  const monthsList = [
    { value: 1, label: isBn ? "জানুয়ারী" : "January" },
    { value: 2, label: isBn ? "ফেব্রুয়ারী" : "February" },
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

  if (loading) {
    return (
      <div className={`${display.variable} ${body.variable} ${mono.variable} min-h-screen bg-[#F2F4F1] dark:bg-slate-950 p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-pulse`}>
        <div className="h-10 bg-amber-200/50 dark:bg-slate-800 rounded-2xl w-1/3"></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
            <Boxes size={15} /> <span>{isBn ? "ম্যানেজার রাইস প্যানেল" : "Manager Rice Panel"}</span>
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold">
            {isBn ? "রাইস ওভারভিউ" : "Rice Overview"}
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            {isBn
              ? `মাসিক চাল জমা, মোট খরচ ও অবশিষ্টাংশ রিপোর্ট (১ মিল = ${data.config.ricePerMeal} ${unit})`
              : `Monthly rice deposit summary & member stock balance (1 Meal = ${data.config.ricePerMeal} ${unit})`}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="rounded-xl border border-[#1B2A26]/15 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-100 px-3 py-2 text-xs sm:text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C99A3E] cursor-pointer"
          >
            {monthsList.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="rounded-xl border border-[#1B2A26]/15 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-100 px-3 py-2 text-xs sm:text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C99A3E] cursor-pointer"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Stock */}
        <div className="relative overflow-hidden rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 backdrop-blur-xl p-4 shadow-sm hover:scale-[1.01] transition-all">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              {isBn ? "মোট চাল জমা" : "Total Stock Added"}
            </span>
            <span className="text-base">🌾</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-mono)] text-gray-900 dark:text-white">
            {formatRice(data.summary.totalMessStockAdded)} <span className="text-xs font-normal text-gray-500">{unit}</span>
          </p>
        </div>

        {/* Total Consumed */}
        <div className="relative overflow-hidden rounded-2xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/40 backdrop-blur-xl p-4 shadow-sm hover:scale-[1.01] transition-all">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 dark:text-orange-300">
              {isBn ? "মোট ব্যবহৃত চাল" : "Total Consumed"}
            </span>
            <span className="text-base">🍲</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-mono)] text-gray-900 dark:text-white">
            {formatRice(data.summary.totalMessConsumed)} <span className="text-xs font-normal text-gray-500">{unit}</span>
          </p>
        </div>

        {/* Total Remaining */}
        <div className={`col-span-2 sm:col-span-1 relative overflow-hidden rounded-2xl backdrop-blur-xl p-4 shadow-sm hover:scale-[1.01] transition-all border ${
          data.summary.totalMessRemaining >= 0
            ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40"
            : "bg-rose-50/70 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/40"
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${
              data.summary.totalMessRemaining >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"
            }`}>
              {isBn ? "অবশিষ্ট মেস স্টক" : "Stock Balance"}
            </span>
            <span className="text-base">⚖️</span>
          </div>
          <p className={`text-xl sm:text-2xl font-bold font-[family-name:var(--font-mono)] ${
            data.summary.totalMessRemaining >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
          }`}>
            {formatRice(data.summary.totalMessRemaining)} <span className="text-xs font-normal text-gray-500">{unit}</span>
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1B2A26]/10 dark:border-slate-800 pb-4">
        <p className="font-[family-name:var(--font-display)] text-lg font-semibold">
          {isBn ? "মেম্বার চালের বিবরণী" : "Member Rice Balances"}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={exporting}
            className="rounded-xl bg-[#ff6900] px-3.5 py-2 text-xs font-semibold text-white transition-all duration-150 hover:bg-[#ff6900]/90 active:scale-95 disabled:opacity-60 cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            <Download size={14} />
            <span>{exporting ? (isBn ? "তৈরি হচ্ছে..." : "Preparing...") : (isBn ? "📄 Download PDF" : "📄 Download PDF")}</span>
          </button>

          <button
            onClick={() => {
              if (data.members.length > 0) setSelectedMemberId(data.members[0].userId);
              setIsModalOpen(true);
            }}
            className="rounded-xl border border-[#1B2A26]/15 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-3.5 py-2 text-xs font-semibold transition hover:bg-gray-50 dark:hover:bg-slate-800 active:scale-95 cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>{isBn ? "চাল জমা/বিয়োগ (+/-)" : "Add/Deduct Rice"}</span>
          </button>
        </div>
      </div>

      {/* Member Stock List / Table */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold">
              {isBn ? "মেম্বারভিত্তিক চালের হিসাব" : "Member Rice Balances Overview"}
            </h2>
            <p className="text-xs text-gray-400">
              {isBn
                ? "চলতি মাসের সদস্যভিত্তিক চাল জমা, ব্যবহার ও অবশিষ্টাংশ"
                : "Monthly breakdown of rice deposits, consumption, and balance per member"}
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isBn ? "মেম্বার খুঁজুন..." : "Search member..."}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
            />
          </div>
        </div>

        {/* Mobile View - Cards */}
        <div className="md:hidden space-y-2.5">
          {filteredMembers.map((m) => {
            const isPositive = m.remaining >= 0;
            const imgUrl = m.image || getCachedImageMap()[m.userId];
            return (
              <div
                key={m.userId}
                className={`p-3.5 rounded-xl border transition space-y-3 ${
                  isPositive
                    ? "bg-emerald-50/30 border-emerald-200/50 dark:bg-emerald-950/10 dark:border-emerald-900/30"
                    : "bg-rose-50/30 border-rose-200/50 dark:bg-rose-950/10 dark:border-rose-900/30"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <MemberAvatar src={imgUrl} name={m.name} size={36} />
                    <div>
                      <p className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">{m.name}</p>
                      <span className="text-[10px] uppercase font-bold text-gray-400">{m.role || "MEMBER"}</span>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold font-[family-name:var(--font-mono)] ${
                      isPositive
                        ? "bg-emerald-100/70 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                        : "bg-rose-100/70 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                    }`}
                  >
                    {formatRice(m.remaining)} {unit}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-white/70 dark:bg-slate-800/60 p-2.5 rounded-xl text-center text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 block font-bold uppercase">{isBn ? "মোট জমা" : "Total Added"}</span>
                    <span className="font-bold font-[family-name:var(--font-mono)] text-gray-900 dark:text-white">{formatRice(m.totalAdded)} {unit}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-bold uppercase">{isBn ? "ব্যবহৃত" : "Consumed"}</span>
                    <span className="font-bold font-[family-name:var(--font-mono)] text-orange-500">{formatRice(m.totalConsumed)} {unit}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedMemberId(m.userId);
                    setIsModalOpen(true);
                  }}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                >
                  <Plus size={14} />
                  <span>{isBn ? "চাল জমা দিন" : "Deposit Rice"}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Desktop View - Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-gray-400 bg-gray-50/50 dark:bg-slate-800/40">
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4 text-center">Total Added</th>
                <th className="py-3 px-4 text-center">Consumed</th>
                <th className="py-3 px-4 text-center">Remaining Balance</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {filteredMembers.map((m) => {
                const isPositive = m.remaining >= 0;
                const imgUrl = m.image || getCachedImageMap()[m.userId];
                return (
                  <tr
                    key={m.userId}
                    className={`transition ${
                      isPositive
                        ? "hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20"
                        : "hover:bg-rose-50/30 dark:hover:bg-rose-950/20"
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <MemberAvatar src={imgUrl} name={m.name} size={36} />
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">{m.name}</p>
                          <span className="text-[10px] uppercase font-bold text-gray-400">{m.role || "MEMBER"}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold font-[family-name:var(--font-mono)] text-gray-900 dark:text-white">
                      {formatRice(m.totalAdded)} {unit}
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold font-[family-name:var(--font-mono)] text-orange-500">
                      {formatRice(m.totalConsumed)} {unit}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold font-[family-name:var(--font-mono)] ${
                          isPositive
                            ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {formatRice(m.remaining)} {unit}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedMemberId(m.userId);
                          setIsModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition inline-flex items-center gap-1 cursor-pointer shadow-sm"
                      >
                        <Plus size={14} />
                        <span>Deposit</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Deposit History - Grouped by Member (Accordion Layout) */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <FileText size={18} className="text-amber-500" />
              <span>{isBn ? "সদস্যভিত্তিক চাল জমার ইতিহাস" : "Monthly Deposit History"}</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isBn
                ? "সদস্যভিত্তিক চাল জমার হিস্ট্রি দেখতে যেকোনো মেম্বারের ওপর ক্লিক করুন"
                : "Click on any member card to expand their deposit entries for this month"}
            </p>
          </div>
          <span className="text-xs font-semibold text-gray-400 bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-full w-fit">
            {data.history.length} {isBn ? "টি মোট এন্ট্রি" : "total entries"}
          </span>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-slate-800">
            <Boxes className="mx-auto text-gray-300 dark:text-slate-600 mb-2" size={32} />
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {isBn ? "কোনো মেম্বার পাওয়া যায়নি" : "No members found"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMembers.map((m) => {
              const historyList = memberHistoryGrouped[m.userId] || [];
              const isExpanded = expandedMemberId === m.userId;
              const imgUrl = m.image || getCachedImageMap()[m.userId];
              const isPositive = m.remaining >= 0;

              return (
                <div
                  key={m.userId}
                  className="rounded-2xl overflow-hidden bg-gray-50/70 dark:bg-slate-800/50 border border-gray-200/80 dark:border-slate-800 transition"
                >
                  {/* Member Accordion Header */}
                  <div
                    onClick={() => setExpandedMemberId(isExpanded ? null : m.userId)}
                    className="w-full p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-gray-100/60 dark:hover:bg-slate-800/80 transition"
                  >
                    {/* Member Info */}
                    <div className="flex items-center gap-3">
                      <MemberAvatar src={imgUrl} name={m.name} size={40} />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-gray-900 dark:text-white">{m.name}</p>
                          <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                            {m.role || "MEMBER"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 font-medium mt-0.5 flex flex-wrap items-center gap-2">
                          <span>{historyList.length} {isBn ? "টি এন্ট্রি" : "entries"}</span>
                          <span>•</span>
                          <span>{isBn ? "মোট জমা" : "Total Added"}: <strong className="text-emerald-600 dark:text-emerald-400">+{formatRice(m.totalAdded)} {unit}</strong></span>
                        </p>
                      </div>
                    </div>

                    {/* Status Badges & Accordion Toggle */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200/60 dark:border-slate-800">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">{isBn ? "অবশিষ্ট ব্যালেন্স" : "Stock Balance"}</span>
                        <span className={`text-sm font-extrabold font-[family-name:var(--font-mono)] ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                          {formatRice(m.remaining)} {unit}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMemberId(m.userId);
                            setIsModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-sm"
                          title="Deposit Rice"
                        >
                          <Plus size={13} />
                          <span className="hidden sm:inline">{isBn ? "জমা" : "Deposit"}</span>
                        </button>
                        <div className="p-1.5 rounded-xl bg-white dark:bg-slate-900 text-gray-500 dark:text-slate-300 border border-gray-200 dark:border-slate-700 shadow-sm">
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content (Deposit Entries List for this Member) */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-dashed border-gray-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 space-y-3">
                      <div className="flex items-center justify-between pt-2">
                        <p className="text-xs font-bold text-gray-500 dark:text-slate-400">
                          {isBn ? `${m.name}-এর চাল জমার ইতিহাস` : `Deposit Records for ${m.name}`}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMemberId(m.userId);
                            setIsModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-sm"
                        >
                          <Plus size={14} />
                          <span>{isBn ? "নতুন চাল জমা" : "+ New Deposit"}</span>
                        </button>
                      </div>

                      {historyList.length === 0 ? (
                        <p className="text-xs text-center text-gray-400 py-4 italic bg-gray-50/50 dark:bg-slate-800/40 rounded-xl">
                          {isBn ? "এই মাসে এই মেম্বারের কোনো চাল জমা রেকর্ড নেই" : "No deposit records for this member in this month"}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {historyList.map((h) => {
                            const isAdd = h.amount >= 0;
                            return (
                              <div
                                key={h.id}
                                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700/60"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${isAdd ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"}`}>
                                    {isAdd ? "+" : "-"}
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                                      {formatDate(h.date)}
                                    </p>
                                    {h.note && (
                                      <p className="text-[11px] text-gray-500 dark:text-slate-400">
                                        💬 {h.note}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span className={`text-sm font-bold font-[family-name:var(--font-mono)] ${isAdd ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                                    {isAdd ? `+${formatRice(h.amount)}` : formatRice(h.amount)} {unit}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteTargetId(h.id);
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-rose-500 transition rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                                    title="Delete Deposit Entry"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Deposit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Plus size={18} className="text-amber-500" />
                <span>{isBn ? "চাল জমা/বিয়োগ এন্ট্রি করুন" : "Add / Deduct Rice Deposit"}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-1 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                  Select Member
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  {data.members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                  Amount ({unit}) — Positive (+) to Add, Negative (-) to Deduct
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 50 to add, or -5 to deduct"
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Rice deposit or adjustment note"
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "Saving..." : "Save Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 w-full max-w-sm shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>

            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                {isBn ? "এন্ট্রি টি মুছে ফেলবেন?" : "Delete Deposit Entry?"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {isBn
                  ? "আপনি কি নিশ্চিত যে এই চাল জমার হিস্ট্রিটি মুছে ফেলতে চান? এই অ্যাকশনটি রিকভার করা যাবে না।"
                  : "Are you sure you want to delete this rice deposit record? This action cannot be undone."}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {isBn ? "ক্যানসেল" : "Cancel"}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 transition disabled:opacity-50 cursor-pointer"
              >
                {deleting ? (isBn ? "মুছছে..." : "Deleting...") : (isBn ? "হ্যাঁ, মুছুন" : "Yes, Delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
