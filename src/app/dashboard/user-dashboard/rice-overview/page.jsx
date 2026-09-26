"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import { GetUser } from "@/components/action/action";
import { toast } from "sonner";

export const dynamic = "force-dynamic";

import {
  Boxes,
  Search,
  RefreshCw,
  Download,
  X,
  UserCheck,
} from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";
import { getBDNow } from "@/lib/date-utils";

const display = Fraunces({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-display", display: "swap" });
const body = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });

function formatRice(val) {
  if (val === undefined || val === null || isNaN(val)) return "0";
  const num = Number(val);
  return Number.isInteger(num) ? num.toString() : (Math.round(num * 10) / 10).toString();
}

// SummaryCard matching manager overview theme
function SummaryCard({ label, value, subValue, mono: useMono = true, icon = "📊", isNegative = false }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${
        isNegative
          ? "bg-rose-50/80 dark:bg-rose-950/25 border border-rose-200/70 dark:border-rose-900/40"
          : "bg-amber-50/80 dark:bg-amber-950/25 border border-amber-200/70 dark:border-amber-900/40"
      } backdrop-blur-xl p-3.5 min-[375px]:p-4 sm:p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300`}
    >
      <div
        className={`absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent ${
          isNegative ? "via-rose-400/40" : "via-orange-400/40"
        } to-transparent pointer-events-none`}
      />
      <div className="flex items-center justify-between mb-1">
        <p
          className={`text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider ${
            isNegative ? "text-rose-600 dark:text-rose-400" : "text-[#EA580C] dark:text-orange-400"
          }`}
        >
          {label}
        </p>
        <span className="text-sm">{icon}</span>
      </div>
      <p
        className={`mt-0.5 text-sm min-[375px]:text-base sm:text-xl md:text-2xl font-bold ${
          isNegative ? "text-rose-700 dark:text-rose-400" : "text-gray-950 dark:text-slate-100"
        } whitespace-nowrap ${useMono ? "font-[family-name:var(--font-mono)]" : ""}`}
      >
        {value}
      </p>
      {subValue && (
        <span className="text-[10px] font-normal text-gray-500 dark:text-slate-400">
          {subValue}
        </span>
      )}
    </div>
  );
}

// StatusBadge matching manager overview theme
function StatusBadge({ status, isBn }) {
  const isSurplus = status === "surplus";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isSurplus
          ? "bg-[#3F7D5C]/10 text-[#3F7D5C] dark:text-emerald-400"
          : "bg-[#B5533C]/10 text-[#B5533C] dark:text-rose-400"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isSurplus ? "bg-[#3F7D5C] dark:bg-emerald-400" : "bg-[#B5533C] dark:bg-rose-400"
        }`}
      />
      {isSurplus ? (isBn ? "উদ্বৃত্ত (Surplus)" : "Surplus") : isBn ? "বকেয়া (Deficit)" : "Deficit"}
    </span>
  );
}

// Receipt-style LeaderRow matching overview theme
function LeaderRow({ left, right, rightClass = "" }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="whitespace-nowrap">{left}</span>
      <span className="flex-1 border-b border-dotted border-current/20 translate-y-[-3px]" />
      <span className={`whitespace-nowrap font-[family-name:var(--font-mono)] ${rightClass}`}>{right}</span>
    </div>
  );
}

export default function UserRiceOverviewPage() {
  const user = GetUser();
  const userId = user?.user?.id;
  const { t, lang } = useTranslation();
  const isBn = lang === "bn";

  const [selectedMonth, setSelectedMonth] = useState(() => getBDNow().month);
  const [selectedYear, setSelectedYear] = useState(() => getBDNow().year);

  const [data, setData] = useState({
    messName: "",
    config: { enableRiceManagement: true, ricePerMeal: 1, riceUnitName: "Unit" },
    summary: { totalMessStockAdded: 0, totalMessConsumed: 0, totalMessRemaining: 0 },
    members: [],
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const fetchData = async (showLoader = false) => {
    if (!userId) return;
    if (showLoader) setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/rice/summary?userId=${userId}&month=${selectedMonth}&year=${selectedYear}`
      );
      const resData = await res.json();
      if (resData.success) {
        setData(resData);
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

  const unit = data.config.riceUnitName || "Unit";

  // Filter members by search
  const filteredMembers = useMemo(() => {
    if (!data.members) return [];
    if (!searchQuery.trim()) return data.members;
    const q = searchQuery.toLowerCase();
    return data.members.filter((m) => m.name?.toLowerCase().includes(q));
  }, [data.members, searchQuery]);

  // Current logged in member's rice record
  const currentUserRecord = useMemo(() => {
    if (!data.members || !userId) return null;
    return data.members.find((m) => String(m.userId) === String(userId));
  }, [data.members, userId]);

  // Handle PDF Export
  const handleDownloadPdf = async () => {
    if (!data || !data.members || data.members.length === 0) {
      toast.error(isBn ? "এক্সপোর্ট করার জন্য কোনো তথ্য নেই" : "No member data to export");
      return;
    }
    setExporting(true);

    try {
      const { default: jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF();
      const englishMonths = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
      ];
      const monthName = englishMonths[selectedMonth - 1] || selectedMonth;
      const unitStr = data.config.riceUnitName || "Unit";

      // Title & Header info
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(27, 42, 38);
      doc.text(data.messName || "EasyMess", 14, 18);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(`Month: ${monthName} ${selectedYear}`, 14, 25);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

      // Summary stats row
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(
        `Total Added: ${formatRice(data.summary.totalMessStockAdded)} ${unitStr}    Total Consumed: ${formatRice(
          data.summary.totalMessConsumed
        )} ${unitStr}    Stock Balance: ${formatRice(data.summary.totalMessRemaining)} ${unitStr}`,
        14,
        38
      );

      // Main Member Table with Status
      autoTable(doc, {
        startY: 44,
        head: [["Name", "Role", "Added", "Consumed", "Balance", "Status"]],
        body: data.members.map((m) => {
          const bal = Number(m.remaining) || 0;
          const isSurplus = bal > 0;
          const isDeficit = bal < 0;
          const isMe = String(m.userId) === String(userId);
          return [
            m.name + (isMe ? " (You)" : ""),
            m.role ? m.role.toUpperCase() : "MEMBER",
            `${formatRice(m.totalAdded)} ${unitStr}`,
            `${formatRice(m.totalConsumed)} ${unitStr}`,
            (isSurplus ? "+" : "") + `${formatRice(bal)} ${unitStr}`,
            isSurplus ? "Surplus" : isDeficit ? "Deficit" : "Settled",
          ];
        }),
        headStyles: { fillColor: [27, 42, 38], textColor: [255, 255, 255] },
        styles: { fontSize: 9 },
        didParseCell: function (cellData) {
          if (cellData.section === "body") {
            if (cellData.column.index === 5) {
              const status = cellData.cell.raw;
              if (status === "Surplus") {
                cellData.cell.styles.textColor = [63, 125, 92];
                cellData.cell.styles.fontStyle = "bold";
              } else if (status === "Deficit") {
                cellData.cell.styles.textColor = [181, 83, 60];
                cellData.cell.styles.fontStyle = "bold";
              }
            }
            if (cellData.column.index === 4) {
              const balVal = String(cellData.cell.raw || "");
              if (balVal.startsWith("+")) {
                cellData.cell.styles.textColor = [63, 125, 92];
              } else if (balVal.startsWith("-")) {
                cellData.cell.styles.textColor = [181, 83, 60];
              }
            }
          }
        },
      });

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.text("Generated By EasyMess", 14, doc.lastAutoTable.finalY + 10);

      const fileName = `${(data.messName || "Rice_Overview").replace(/\s+/g, "_")}_Rice_${monthName}_${selectedYear}.pdf`;
      doc.save(fileName);
      toast.success(isBn ? "পিডিএফ সফলভাবে ডাউনলোড হয়েছে" : "PDF downloaded successfully");
    } catch (err) {
      console.error(err);
      toast.error(isBn ? "পিডিএফ তৈরি করতে সমস্যা হয়েছে" : "Failed to generate PDF");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div
        className={`${display.variable} ${body.variable} ${mono.variable} min-h-screen bg-[#F2F4F1] dark:bg-slate-950 p-4 md:p-8 max-w-5xl mx-auto space-y-6 border dark:border-slate-800 rounded-2xl animate-pulse`}
      >
        <div className="h-10 bg-[#1B2A26]/10 dark:bg-slate-800 rounded-2xl w-1/3" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="h-24 bg-white dark:bg-slate-900 rounded-2xl" />
          <div className="h-24 bg-white dark:bg-slate-900 rounded-2xl" />
          <div className="h-24 bg-white dark:bg-slate-900 rounded-2xl" />
          <div className="h-24 bg-white dark:bg-slate-900 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${display.variable} ${body.variable} ${mono.variable} min-h-screen bg-[#F2F4F1] dark:bg-slate-950 font-[family-name:var(--font-body)] text-[#1B2A26] dark:text-slate-200 border dark:border-slate-800 rounded-2xl`}
    >
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#C99A3E] font-medium flex items-center gap-1.5">
              <Boxes size={14} /> <span>{isBn ? "সদস্য · রাইস ওভারভিউ" : "Member · Rice Overview"}</span>
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold">
              {data?.messName || (isBn ? "রাইস ওভারভিউ" : "Rice Overview")}
            </h1>
            <p className="text-xs text-[#1B2A26]/70 dark:text-slate-400 mt-1">
              {isBn
                ? `সম্পূর্ণ মেসের চালের স্টক ও সদস্যদের ব্যবহারের সারসংক্ষেপ (১ মিল = ${data.config.ricePerMeal} ${unit})`
                : `Overall mess rice stock & member consumption report (1 Meal = ${data.config.ricePerMeal} ${unit})`}
            </p>
          </div>

          {/* Month, Year & Refresh Controls */}
          <div className="flex items-center gap-2">
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
              className="rounded-md p-2 border border-[#1B2A26]/15 dark:border-slate-800 bg-white dark:bg-slate-900 text-[#1B2A26] dark:text-slate-200 hover:bg-gray-100/80 dark:hover:bg-slate-800 transition shadow-sm cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SummaryCard
            label={isBn ? "মোট চাল জমা" : "Total Stock Added"}
            value={`${formatRice(data.summary.totalMessStockAdded)} ${unit}`}
            icon="🌾"
          />
          <SummaryCard
            label={isBn ? "মোট ব্যবহৃত চাল" : "Total Consumed"}
            value={`${formatRice(data.summary.totalMessConsumed)} ${unit}`}
            icon="🍲"
          />
          <SummaryCard
            label={isBn ? "অবশিষ্ট মেস স্টক" : "Stock Balance"}
            value={`${data.summary.totalMessRemaining >= 0 ? "+" : ""}${formatRice(data.summary.totalMessRemaining)} ${unit}`}
            icon="⚖️"
            isNegative={data.summary.totalMessRemaining < 0}
          />
          <SummaryCard
            label={isBn ? "আপনার চালের হিসাব" : "Your Rice Balance"}
            value={
              currentUserRecord
                ? `${currentUserRecord.remaining >= 0 ? "+" : ""}${formatRice(currentUserRecord.remaining)} ${unit}`
                : "—"
            }
            subValue={
              currentUserRecord
                ? currentUserRecord.remaining > 0
                  ? (isBn ? "উদ্বৃত্ত আছে" : "Surplus")
                  : currentUserRecord.remaining < 0
                  ? (isBn ? "বকেয়া আছে" : "Due / Deficit")
                  : (isBn ? "সমান" : "Settled")
                : null
            }
            icon="🍚"
            isNegative={currentUserRecord ? currentUserRecord.remaining < 0 : false}
          />
        </div>

        {/* Action Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#1B2A26]/10 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <p className="font-[family-name:var(--font-display)] text-lg">
              {isBn ? "মেম্বার চালের বিবরণী" : "Member Rice Balances"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={exporting}
              className="rounded-md bg-[#ff6900] px-3 py-2 text-sm font-medium text-[#F2F4F1] transition-all duration-150 hover:bg-[#1B2A26]/90 active:scale-95 disabled:opacity-60 cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <Download size={14} />
              <span>{exporting ? (isBn ? "তৈরি হচ্ছে…" : "Preparing…") : isBn ? "📄 Download PDF" : "📄 Download PDF"}</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-3 sm:p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
            <input
              type="text"
              placeholder={isBn ? "মেম্বার খুঁজুন..." : "Search member..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-white/60 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition backdrop-blur-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 rounded-full"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 self-end sm:self-center shrink-0">
            {filteredMembers.length} {isBn ? "মেম্বার" : filteredMembers.length === 1 ? "Member" : "Members"}
          </span>
        </div>

        {/* Main Member List */}
        {filteredMembers.length === 0 ? (
          <div className="mt-4 p-8 text-center text-gray-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/80 dark:border-slate-800">
            {isBn ? "কোনো মেম্বার পাওয়া যায়নি" : "No members found"}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="mt-4 hidden overflow-hidden rounded-2xl border border-gray-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-800 text-left text-xs uppercase tracking-wide text-[#1B2A26]/50 dark:text-slate-400 bg-gray-50/50 dark:bg-slate-800/40">
                    <th className="px-4 py-3 font-medium">Member</th>
                    <th className="px-4 py-3 font-medium text-center">Total Added</th>
                    <th className="px-4 py-3 font-medium text-center">Consumed</th>
                    <th className="px-4 py-3 font-medium text-center">Remaining Balance</th>
                    <th className="px-4 py-3 font-medium text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((m) => {
                    const isPositive = m.remaining >= 0;
                    const statusType = isPositive ? "surplus" : "deficit";
                    const isMe = String(m.userId) === String(userId);

                    return (
                      <tr
                        key={m.userId}
                        className={`border-b border-gray-100 dark:border-slate-800/50 last:border-0 transition-colors ${
                          isMe
                            ? "bg-amber-50/40 dark:bg-amber-950/20"
                            : isPositive
                            ? "bg-emerald-50/20 hover:bg-emerald-50/40 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20"
                            : "bg-rose-50/20 hover:bg-rose-50/40 dark:bg-rose-950/10 dark:hover:bg-rose-950/20"
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                          <div className="flex items-center gap-1.5">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-semibold text-sm text-gray-900 dark:text-white">{m.name}</p>
                                {isMe && (
                                  <span className="px-1.5 py-0.2 text-[9px] font-bold bg-[#ff6900] text-white rounded">
                                    {isBn ? "আপনি" : "You"}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] uppercase font-bold text-gray-400">{m.role || "MEMBER"}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 font-[family-name:var(--font-mono)] text-center">
                          {formatRice(m.totalAdded)} {unit}
                        </td>

                        <td className="px-4 py-3 font-[family-name:var(--font-mono)] text-center text-[#EA580C] dark:text-orange-400 font-medium">
                          {formatRice(m.totalConsumed)} {unit}
                        </td>

                        <td
                          className={`px-4 py-3 font-[family-name:var(--font-mono)] text-center font-bold ${
                            isPositive ? "text-[#3F7D5C] dark:text-emerald-400" : "text-[#B5533C] dark:text-rose-450"
                          }`}
                        >
                          {isPositive ? "+" : ""}
                          {formatRice(m.remaining)} {unit}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <StatusBadge status={statusType} isBn={isBn} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Receipt-style Cards */}
            <div className="mt-4 space-y-3 sm:hidden">
              {filteredMembers.map((m) => {
                const isPositive = m.remaining >= 0;
                const statusType = isPositive ? "surplus" : "deficit";
                const isMe = String(m.userId) === String(userId);

                return (
                  <div
                    key={m.userId}
                    className={`rounded-2xl border backdrop-blur-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 ${
                      isMe
                        ? "ring-2 ring-orange-500/40 border-orange-300 bg-orange-50/20 dark:bg-orange-950/20"
                        : isPositive
                        ? "border-emerald-200/50 bg-emerald-50/25 dark:border-emerald-900/30 dark:bg-emerald-950/15"
                        : "border-rose-200/50 bg-rose-50/25 dark:border-rose-900/30 dark:bg-rose-950/15"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-sm text-gray-900 dark:text-white">{m.name}</p>
                          {isMe && (
                            <span className="px-1.5 py-0.2 text-[9px] font-bold bg-[#ff6900] text-white rounded">
                              {isBn ? "আপনি" : "You"}
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] uppercase font-bold text-gray-400">{m.role || "MEMBER"}</span>
                      </div>
                      <StatusBadge status={statusType} isBn={isBn} />
                    </div>

                    <div className="space-y-1 text-sm text-[#1B2A26]/80 dark:text-slate-300 my-2">
                      <LeaderRow left={isBn ? "মোট জমা" : "Total Added"} right={`${formatRice(m.totalAdded)} ${unit}`} />
                      <LeaderRow left={isBn ? "ব্যবহৃত" : "Consumed"} right={`${formatRice(m.totalConsumed)} ${unit}`} rightClass="text-orange-500 font-semibold" />
                      <LeaderRow
                        left={isBn ? "অবশিষ্ট ব্যালেন্স" : "Stock Balance"}
                        right={`${isPositive ? "+" : ""}${formatRice(m.remaining)} ${unit}`}
                        rightClass={`font-bold ${isPositive ? "text-[#3F7D5C] dark:text-emerald-400" : "text-[#B5533C] dark:text-rose-450"}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
