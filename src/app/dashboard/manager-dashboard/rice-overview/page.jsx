"use client";

import React, { useState, useEffect } from "react";
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
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";
import { getBDDateStr } from "@/lib/date-utils";

export default function ManagerRiceOverviewPage() {
  const user = GetUser();
  const userId = user?.user?.id;
  const { t, lang } = useTranslation();

  const bdNow = getBDDateStr();
  const defaultDateObj = new Date(bdNow);
  const [selectedMonth, setSelectedMonth] = useState(defaultDateObj.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(defaultDateObj.getFullYear());

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
      const monthObj = monthsList.find((m) => m.value === selectedMonth);
      const monthName = monthObj ? monthObj.label : selectedMonth;
      const unitStr = data.config.riceUnitName || "Unit";

      // Title & Month info
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("EasyMess - Rice Overview Report", 14, 18);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Month: ${monthName} ${selectedYear}`, 14, 25);
      doc.text(`Generated Date: ${new Date().toLocaleDateString()}`, 14, 30);

      // Summary details row
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(
        `Total Added: ${data.summary.totalMessStockAdded} ${unitStr}   |   Consumed: ${data.summary.totalMessConsumed} ${unitStr}   |   Stock Balance: ${data.summary.totalMessRemaining} ${unitStr}`,
        14,
        38
      );

      // Main Table
      autoTable(doc, {
        startY: 44,
        head: [["Member Name", "Role", "Total Added", "Consumed", "Remaining Balance"]],
        body: data.members.map((m) => [
          m.name,
          m.role ? m.role.toUpperCase() : "MEMBER",
          `${m.totalAdded} ${unitStr}`,
          `${m.totalConsumed} ${unitStr}`,
          `${m.remaining} ${unitStr}`,
        ]),
        headStyles: { fillColor: [217, 119, 6] },
        styles: { fontSize: 9 },
        didParseCell: function (cellData) {
          if (cellData.section === "body" && cellData.column.index === 4) {
            const val = cellData.cell.raw;
            if (String(val).startsWith("-")) {
              cellData.cell.styles.textColor = [220, 38, 38];
              cellData.cell.styles.fontStyle = "bold";
            } else {
              cellData.cell.styles.textColor = [16, 185, 129];
              cellData.cell.styles.fontStyle = "bold";
            }
          }
        },
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

  // Form state for adding rice deposit
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => bdNow);
  const [note, setNote] = useState("");

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

  const handleDeleteDeposit = async (depositId) => {
    if (!confirm("Are you sure you want to delete this deposit entry?")) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/rice/deposit/${depositId}?managerId=${userId}`,
        { method: "DELETE" }
      );
      const resData = await res.json();
      if (resData.success) {
        toast.success("Deposit entry deleted");
        fetchData(false);
      } else {
        toast.error(resData.message || "Failed to delete deposit");
      }
    } catch (err) {
      toast.error("Error deleting deposit");
    }
  };

  const filteredMembers = data.members.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unit = data.config.riceUnitName || "Unit";

  const monthsList = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-gray-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-32 bg-gray-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-32 bg-gray-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Clean Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#C99A3E] font-semibold">
            Rice Management · Monthly Overview
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold text-[#1B2A26] dark:text-white">
            {lang === "bn" ? "রাইস ওভারভিউ" : "Rice Overview"}
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            {lang === "bn"
              ? `মাসিক চালের ওভারভিউ ও ব্যালেন্স হিসাব (১ মিল = ${data.config.ricePerMeal} ${unit})`
              : `Monthly Rice Overview & Balance Summary (1 Meal = ${data.config.ricePerMeal} ${unit})`}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="rounded-md border border-[#1B2A26]/15 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C99A3E] cursor-pointer"
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
            className="rounded-md border border-[#1B2A26]/15 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C99A3E] cursor-pointer"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <button
            onClick={() => fetchData(true)}
            className="p-2 bg-white dark:bg-slate-900 border border-[#1B2A26]/15 dark:border-slate-800 text-gray-700 dark:text-slate-300 rounded-md hover:bg-gray-50 transition cursor-pointer shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Clean Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {/* Total Stock */}
        <div className="relative overflow-hidden rounded-2xl bg-[#FFFDF5] dark:bg-amber-950/25 border border-[#FCEECB] dark:border-amber-900/40 backdrop-blur-xl p-3.5 sm:p-5 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-[#EA580C] dark:text-orange-400 truncate">
              {lang === "bn" ? "মোট চাল জমা" : "Total Stock"}
            </p>
            <span className="text-sm">🌾</span>
          </div>
          <p className="mt-0.5 text-base sm:text-2xl font-bold font-mono text-gray-950 dark:text-slate-100">
            {data.summary.totalMessStockAdded}{" "}
            <span className="text-xs font-normal text-gray-500">{unit}</span>
          </p>
        </div>

        {/* Total Consumed */}
        <div className="relative overflow-hidden rounded-2xl bg-[#FFFDF5] dark:bg-amber-950/25 border border-[#FCEECB] dark:border-amber-900/40 backdrop-blur-xl p-3.5 sm:p-5 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-[#EA580C] dark:text-orange-400 truncate">
              {lang === "bn" ? "মোট চাল খরচ" : "Total Consumed"}
            </p>
            <span className="text-sm">🍲</span>
          </div>
          <p className="mt-0.5 text-base sm:text-2xl font-bold font-mono text-gray-950 dark:text-slate-100">
            {data.summary.totalMessConsumed}{" "}
            <span className="text-xs font-normal text-gray-500">{unit}</span>
          </p>
        </div>

        {/* Total Remaining */}
        <div className={`col-span-2 sm:col-span-1 relative overflow-hidden rounded-2xl backdrop-blur-xl p-3.5 sm:p-5 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 ${
          data.summary.totalMessRemaining >= 0
            ? "bg-[#FFFDF5] dark:bg-amber-950/25 border border-[#FCEECB] dark:border-amber-900/40"
            : "bg-red-50/60 dark:bg-red-950/25 border border-red-200/60 dark:border-red-900/40"
        }`}>
          <div className="flex items-center justify-between mb-1">
            <p className={`text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider truncate ${
              data.summary.totalMessRemaining >= 0 ? "text-[#EA580C] dark:text-orange-400" : "text-red-700 dark:text-red-400"
            }`}>
              {lang === "bn" ? "অবশিষ্ট স্টক" : "Stock Balance"}
            </p>
            <span className="text-sm">⚖️</span>
          </div>
          <p className={`mt-0.5 text-base sm:text-2xl font-bold font-mono ${
            data.summary.totalMessRemaining >= 0 ? "text-gray-950 dark:text-slate-100" : "text-red-600 dark:text-red-400"
          }`}>
            {data.summary.totalMessRemaining}{" "}
            <span className="text-xs font-normal text-gray-500">{unit}</span>
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1B2A26]/10 dark:border-slate-800 pb-4">
        <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#1B2A26] dark:text-slate-200">
          {lang === "bn" ? "মেম্বার চালের বিবরণী" : "Member Rice Balances Overview"}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={exporting}
            className="rounded-md bg-[#ff6900] px-3.5 py-2 text-xs font-semibold text-white transition-all duration-150 hover:bg-[#ff6900]/90 active:scale-95 disabled:opacity-60 cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            <Download size={14} />
            <span>{exporting ? (lang === "bn" ? "তৈরি হচ্ছে..." : "Preparing...") : (lang === "bn" ? "📄 Download PDF" : "📄 Download PDF")}</span>
          </button>

          <button
            onClick={() => {
              if (data.members.length > 0) setSelectedMemberId(data.members[0].userId);
              setIsModalOpen(true);
            }}
            className="rounded-md border border-[#1B2A26]/15 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-3.5 py-2 text-xs font-semibold transition hover:bg-gray-50 dark:hover:bg-slate-800 active:scale-95 cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>{lang === "bn" ? "চাল জমা/বিয়োগ" : "Add/Deduct Rice"}</span>
          </button>
        </div>
      </div>

      {/* Member Stock Table */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {lang === "bn" ? "মেম্বারভিত্তিক চালের হিসাব" : "Member Rice Balances Overview"}
            </h2>
            <p className="text-xs text-gray-400">
              {lang === "bn"
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
              placeholder={lang === "bn" ? "মেম্বার খুঁজুন..." : "Search member..."}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Mobile View - Cards (No Horizontal Scrolling) */}
        <div className="md:hidden divide-y divide-gray-100 dark:divide-slate-800">
          {filteredMembers.map((m) => {
            const isPositive = m.remaining >= 0;
            const imgUrl = m.image || getCachedImageMap()[m.userId];
            return (
              <div key={m.userId} className={`p-4 space-y-3 transition ${isPositive ? "bg-emerald-50/40 hover:bg-emerald-50/70 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20" : "bg-red-50/40 hover:bg-red-50/70 dark:bg-red-950/10 dark:hover:bg-red-950/20"}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <MemberAvatar src={imgUrl} name={m.name} size={34} />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{m.name}</p>
                      <span className="text-[10px] uppercase font-bold text-gray-400">{m.role}</span>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                      isPositive
                        ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                        : "bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400"
                    }`}
                  >
                    {m.remaining} {unit}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-2xl text-center text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 block font-bold uppercase">Total Added</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{m.totalAdded} {unit}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-bold uppercase">Consumed</span>
                    <span className="font-semibold text-orange-500">{m.totalConsumed} {unit}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop View - Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/60 dark:bg-slate-800/40 border-b border-gray-100 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-gray-400">
                <th className="py-4 px-6">Member</th>
                <th className="py-4 px-4 text-center">Total Added</th>
                <th className="py-4 px-4 text-center">Consumed</th>
                <th className="py-4 px-4 text-center">Remaining Balance</th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-sm">
              {filteredMembers.map((m) => {
                const isPositive = m.remaining >= 0;
                const imgUrl = m.image || getCachedImageMap()[m.userId];
                return (
                  <tr key={m.userId} className={`transition ${isPositive ? "bg-emerald-50/30 hover:bg-emerald-50/60 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20" : "bg-red-50/30 hover:bg-red-50/60 dark:bg-red-950/10 dark:hover:bg-red-950/20"}`}>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <MemberAvatar src={imgUrl} name={m.name} size={36} />
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">{m.name}</p>
                          <span className="text-[10px] uppercase font-bold text-gray-400">{m.role}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center font-semibold text-gray-900 dark:text-white">
                      {m.totalAdded} {unit}
                    </td>

                    <td className="py-4 px-4 text-center font-semibold text-orange-500">
                      {m.totalConsumed} {unit}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold ${
                          isPositive
                            ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                            : "bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400"
                        }`}
                      >
                        {m.remaining} {unit}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => {
                          setSelectedMemberId(m.userId);
                          setIsModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition inline-flex items-center gap-1 cursor-pointer"
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

      {/* Deposit History */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FileText size={20} className="text-amber-500" />
          <span>{lang === "bn" ? "চাল জমার ইতিহাস (Monthly Deposits)" : "Monthly Deposit History"}</span>
        </h2>

        {data.history.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No rice deposits recorded for this month.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-800 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4 text-center">Amount</th>
                  <th className="py-3 px-4">Note</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {data.history.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 text-gray-600 dark:text-slate-300">
                      {h.date ? new Date(h.date).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">{h.userName}</td>
                    <td className={`py-3 px-4 text-center font-bold ${h.amount >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {h.amount >= 0 ? `+${h.amount}` : h.amount} {unit}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-400">{h.note || "—"}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteDeposit(h.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition"
                        title="Delete Deposit Entry"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Deposit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">
              {lang === "bn" ? "চাল জমা/বিয়োগ এন্ট্রি করুন" : "Add / Deduct Rice Transaction"}
            </h3>

            <form onSubmit={handleAddDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                  Select Member
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-sm font-medium outline-none focus:border-amber-500"
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
                  Amount ({unit}) — Positive to Add (+), Negative to Deduct (-)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`e.g. 50 to add, or -5 to deduct`}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-sm font-medium outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-sm font-medium outline-none focus:border-amber-500"
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
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-sm font-medium outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 shadow-md transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
