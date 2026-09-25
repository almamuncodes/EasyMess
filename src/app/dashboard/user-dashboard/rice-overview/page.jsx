"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import { GetUser } from "@/components/action/action";
import { toast } from "sonner";
import {
  Boxes,
  TrendingDown,
  ArrowUpRight,
  RefreshCw,
  FileText,
  Calendar,
  Scale,
  Search,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Download,
  AlertTriangle,
  UserCheck,
} from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";
import { getBDNow } from "@/lib/date-utils";
import MemberAvatar from "@/components/ui/MemberAvatar";
import { getCachedImageMap } from "@/lib/image-utils";

export const dynamic = "force-dynamic";

const display = Fraunces({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-display", display: "swap" });
const body = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });

function formatRice(val) {
  const num = parseFloat(val);
  if (isNaN(num)) return "0";
  return num % 1 === 0 ? num.toString() : num.toFixed(2);
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

export default function UserRiceOverviewPage() {
  const user = GetUser();
  const userId = user?.user?.id;
  const { t, lang } = useTranslation();
  const isBn = lang === "bn";

  const [selectedMonth, setSelectedMonth] = useState(() => getBDNow().month);
  const [selectedYear, setSelectedYear] = useState(() => getBDNow().year);

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedMemberId, setExpandedMemberId] = useState(null);

  const [data, setData] = useState({
    messName: "",
    config: { enableRiceManagement: true, ricePerMeal: 1, riceUnitName: "Unit" },
    summary: { totalMessStockAdded: 0, totalMessConsumed: 0, totalMessRemaining: 0 },
    members: [],
    deposits: [],
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

  // Current logged in member's rice balance
  const currentUserRecord = useMemo(() => {
    if (!data.members || !userId) return null;
    return data.members.find((m) => String(m.userId) === String(userId));
  }, [data.members, userId]);

  // Clearance Summary calculations
  const surplusMembers = useMemo(() => {
    if (!data.members) return [];
    return data.members.filter((m) => (Number(m.remaining) || 0) > 0);
  }, [data.members]);

  const deficitMembers = useMemo(() => {
    if (!data.members) return [];
    return data.members.filter((m) => (Number(m.remaining) || 0) < 0);
  }, [data.members]);

  const totalSurplus = useMemo(() => {
    return surplusMembers.reduce((sum, m) => sum + (Number(m.remaining) || 0), 0);
  }, [surplusMembers]);

  const totalDeficit = useMemo(() => {
    return deficitMembers.reduce((sum, m) => sum + Math.abs(Number(m.remaining) || 0), 0);
  }, [deficitMembers]);

  // Group deposits by member
  const depositsByMember = useMemo(() => {
    const map = {};
    (data.deposits || []).forEach((d) => {
      const mId = d.userId;
      if (!map[mId]) map[mId] = [];
      map[mId].push(d);
    });
    return map;
  }, [data.deposits]);

  // Handle PDF Export matching exact styling of Image 1
  const handleDownloadPdf = async () => {
    if (!data || !data.members) return;
    setExporting(true);

    try {
      const { default: jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF();
      const englishMonths = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const monthName = englishMonths[selectedMonth - 1] || selectedMonth;
      const unitStr = data.config.riceUnitName || "Unit";

      // 1. Title & Header info
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(234, 88, 12); // EasyMess Brand Orange
      doc.text(data.messName || "EasyMess", 14, 18);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.text(`Month: ${monthName} ${selectedYear}`, 14, 25);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

      // 2. Summary stats row
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42); // Slate-900
      doc.text(
        `Total Added: ${formatRice(data.summary.totalMessStockAdded)} ${unitStr}    Total Consumed: ${formatRice(data.summary.totalMessConsumed)} ${unitStr}    Stock Balance: ${formatRice(data.summary.totalMessRemaining)} ${unitStr}`,
        14,
        38
      );

      // 3. Main Member Table with Status
      autoTable(doc, {
        startY: 44,
        head: [["Name", "Role", "Added", "Consumed", "Balance", "Status"]],
        body: data.members.map((m) => {
          const bal = Number(m.remaining) || 0;
          const isSurplus = bal > 0;
          const isDeficit = bal < 0;
          return [
            m.name + (String(m.userId) === String(userId) ? " (You)" : ""),
            m.role ? m.role.toUpperCase() : "MEMBER",
            `${formatRice(m.totalAdded)} ${unitStr}`,
            `${formatRice(m.totalConsumed)} ${unitStr}`,
            (isSurplus ? "+" : "") + `${formatRice(bal)} ${unitStr}`,
            isSurplus ? "Surplus" : isDeficit ? "Deficit" : "Settled",
          ];
        }),
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] }, // Sleek Modern Slate
        styles: { fontSize: 9 },
        didParseCell: function (cellData) {
          if (cellData.section === "body") {
            // Style Status column (index 5)
            if (cellData.column.index === 5) {
              const status = cellData.cell.raw;
              if (status === "Surplus") {
                cellData.cell.styles.textColor = [16, 185, 129]; // Emerald 500
                cellData.cell.styles.fontStyle = "bold";
              } else if (status === "Deficit") {
                cellData.cell.styles.textColor = [239, 68, 68]; // Rose 500
                cellData.cell.styles.fontStyle = "bold";
              }
            }
            // Style Balance column (index 4)
            if (cellData.column.index === 4) {
              const balVal = String(cellData.cell.raw || "");
              if (balVal.startsWith("+")) {
                cellData.cell.styles.textColor = [16, 185, 129];
              } else if (balVal.startsWith("-")) {
                cellData.cell.styles.textColor = [239, 68, 68];
              }
            }
          }
        },
      });

      // 4. Prepare Clearance Summary Table (Surplus vs Deficit)
      const maxRows = Math.max(surplusMembers.length, deficitMembers.length);
      const summaryRows = [];
      for (let i = 0; i < maxRows; i++) {
        const surp = surplusMembers[i];
        const def = deficitMembers[i];
        summaryRows.push([
          surp ? surp.name : "",
          surp ? `${formatRice(surp.remaining)} ${unitStr}` : "",
          "",
          def ? def.name : "",
          def ? `${formatRice(Math.abs(def.remaining))} ${unitStr}` : "",
        ]);
      }
      // Add totals footer row
      summaryRows.push([
        "Total Surplus (To Return)",
        `${formatRice(totalSurplus)} ${unitStr}`,
        "",
        "Total Deficit (To Pay)",
        `${formatRice(totalDeficit)} ${unitStr}`,
      ]);

      // Draw Clearance Summary title
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(234, 88, 12); // EasyMess Brand Orange
      doc.text("Clearance Summary", 14, doc.lastAutoTable.finalY + 12);

      // Draw Clearance Summary Table
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 16,
        head: [["To Receive (Surplus)", "Amount", "", "To Pay (Deficit)", "Amount"]],
        body: summaryRows,
        headStyles: { fillColor: [234, 88, 12], textColor: [255, 255, 255] }, // EasyMess Brand Orange
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 55 },
          1: { cellWidth: 30 },
          2: { cellWidth: 10, fillColor: [255, 255, 255] }, // Separator
          3: { cellWidth: 55 },
          4: { cellWidth: 30 },
        },
        didParseCell: function (cellData) {
          if (cellData.column.index === 2) {
            cellData.cell.styles.lineWidth = 0;
            cellData.cell.styles.cellPadding = 0;
          }
          if (cellData.row.index === maxRows) {
            cellData.cell.styles.fontStyle = "bold";
            if (cellData.column.index < 2) {
              cellData.cell.styles.textColor = [16, 185, 129]; // Emerald
            } else if (cellData.column.index > 2) {
              cellData.cell.styles.textColor = [239, 68, 68]; // Rose
            }
          }
        },
      });

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184); // Slate-400
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

  return (
    <div
      className={`${display.variable} ${body.variable} ${mono.variable} min-h-screen bg-slate-50/60 dark:bg-slate-950 font-[family-name:var(--font-body)] text-gray-900 dark:text-slate-100 border border-gray-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6`}
    >
      {/* Top Header / Title Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
            <Boxes size={16} />
            <span>{isBn ? "মেস চালের সারসংক্ষেপ" : "Mess Rice Overview"}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-display)] text-gray-950 dark:text-white">
            {data.messName ? `${data.messName} — ` : ""}
            {isBn ? "রাইস ওভারভিউ রিপোর্ট" : "Rice Overview Report"}
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            {isBn
              ? `সম্পূর্ণ মেসের চালের স্টক, সদস্যদের ব্যবহার ও সমন্বয় বিবরণী (১ মিল = ${data.config.ricePerMeal} ${unit})`
              : `Overall mess rice stock, member usage & clearance summary (1 Meal = ${data.config.ricePerMeal} ${unit})`}
          </p>
        </div>

        {/* Filter & Export Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {isBn ? m.labelBn : m.labelEn}
              </option>
            ))}
          </select>

          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Refresh Button */}
          <button
            onClick={() => fetchData(true)}
            disabled={loading}
            className="p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300 transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>

          {/* Download PDF Button */}
          <button
            onClick={handleDownloadPdf}
            disabled={exporting || loading}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Download size={14} />
            <span>{exporting ? (isBn ? "ডাউনলোড হচ্ছে..." : "Exporting...") : (isBn ? "📄 ডাউনলোড PDF" : "📄 Download PDF")}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Stock Added */}
        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">{isBn ? "মোট জমা চাল" : "Total Stock Added"}</span>
            <Boxes size={16} className="text-amber-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-mono)] text-gray-900 dark:text-white">
            {formatRice(data.summary.totalMessStockAdded)} <span className="text-xs font-normal text-gray-400">{unit}</span>
          </p>
          <p className="text-[10px] text-gray-400">{isBn ? "মেসের সব মেম্বারের মোট জমা" : "Total rice deposited by members"}</p>
        </div>

        {/* Total Consumed */}
        <div className="p-4 rounded-2xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/40 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-700 dark:text-orange-300">{isBn ? "মোট ব্যবহৃত চাল" : "Total Consumed"}</span>
            <TrendingDown size={16} className="text-orange-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-mono)] text-orange-500">
            {formatRice(data.summary.totalMessConsumed)} <span className="text-xs font-normal text-gray-400">{unit}</span>
          </p>
          <p className="text-[10px] text-gray-400">{isBn ? "মিল হিসেবে ব্যবহৃত চাল" : "Calculated from eaten meals"}</p>
        </div>

        {/* Mess Stock Remaining */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">{isBn ? "মেস স্টক ব্যালেন্স" : "Mess Stock Balance"}</span>
            <Scale size={16} className={data.summary.totalMessRemaining >= 0 ? "text-amber-500" : "text-rose-500"} />
          </div>
          <p
            className={`text-xl sm:text-2xl font-bold font-[family-name:var(--font-mono)] ${
              data.summary.totalMessRemaining >= 0 ? "text-amber-700 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {formatRice(data.summary.totalMessRemaining)} <span className="text-xs font-normal text-gray-400">{unit}</span>
          </p>
          <p className="text-[10px] text-gray-400">
            {data.summary.totalMessRemaining >= 0
              ? (isBn ? "স্টক উদ্বৃত্ত আছে" : "In Stock Surplus")
              : (isBn ? "মেসে চালের ঘাটতি রয়েছে" : "Overall Stock Deficit")}
          </p>
        </div>

        {/* Current User's Personal Status Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-slate-900 dark:to-slate-800/80 border border-amber-200/80 dark:border-slate-700 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
            <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
              <UserCheck size={14} />
              <span>{isBn ? "আপনার চালের হিসাব" : "Your Rice Balance"}</span>
            </span>
          </div>
          {currentUserRecord ? (
            <>
              <p
                className={`text-xl sm:text-2xl font-bold font-[family-name:var(--font-mono)] ${
                  currentUserRecord.remaining >= 0 ? "text-amber-700 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {currentUserRecord.remaining >= 0 ? "+" : ""}
                {formatRice(currentUserRecord.remaining)} <span className="text-xs font-normal text-gray-500">{unit}</span>
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                {currentUserRecord.remaining > 0
                  ? (isBn ? "✅ আপনার চাল জমা বেশি আছে" : "✅ Surplus rice balance")
                  : currentUserRecord.remaining < 0
                  ? (isBn ? "⚠️ আপনার চাল বকেয়া আছে — জমা দিন" : "⚠️ Due/Deficit — Please deposit")
                  : (isBn ? "হিসাব সমান (০)" : "Settled")}
              </p>
            </>
          ) : (
            <p className="text-xs text-gray-400 mt-2">{isBn ? "রেকর্ড নেই" : "No record"}</p>
          )}
        </div>
      </div>

      {/* Main Member Stock Overview Table */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Boxes size={18} className="text-amber-500" />
              <span>{isBn ? "সকল মেম্বারের চালের হিসাব" : "All Members Rice Stock"}</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isBn
                ? "চলতি মাসে প্রত্যেক মেম্বারের মোট জমা, মিল খরচ ও অবশিষ্ট ব্যালেন্স"
                : "Total deposits, consumed units & current balance for each member"}
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
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
            const isMe = String(m.userId) === String(userId);
            const isPositive = m.remaining >= 0;
            const imgUrl = m.image || getCachedImageMap()[m.userId];
            return (
              <div
                key={m.userId}
                className={`p-3.5 rounded-xl border transition space-y-3 bg-white dark:bg-slate-900 ${
                  isMe
                    ? "ring-2 ring-amber-500/50 bg-amber-50/20 dark:bg-amber-950/20 border-amber-300"
                    : isPositive
                    ? "border-amber-200/60 dark:border-amber-900/30"
                    : "border-rose-200/60 dark:border-rose-900/30"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <MemberAvatar src={imgUrl} name={m.name} size={36} />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">{m.name}</p>
                        {isMe && (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-500 text-white rounded">
                            {isBn ? "আপনি" : "You"}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] uppercase font-bold text-gray-400">{m.role || "MEMBER"}</span>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold font-[family-name:var(--font-mono)] ${
                      isPositive
                        ? "bg-amber-100/80 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-rose-100/80 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                    }`}
                  >
                    {isPositive ? "+" : ""}{formatRice(m.remaining)} {unit}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-slate-800/60 p-2.5 rounded-xl text-center text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 block font-bold uppercase">{isBn ? "মোট জমা" : "Total Added"}</span>
                    <span className="font-bold font-[family-name:var(--font-mono)] text-gray-900 dark:text-white">{formatRice(m.totalAdded)} {unit}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-bold uppercase">{isBn ? "ব্যবহৃত" : "Consumed"}</span>
                    <span className="font-bold font-[family-name:var(--font-mono)] text-orange-500">{formatRice(m.totalConsumed)} {unit}</span>
                  </div>
                </div>
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
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {filteredMembers.map((m) => {
                const isMe = String(m.userId) === String(userId);
                const isPositive = m.remaining >= 0;
                const imgUrl = m.image || getCachedImageMap()[m.userId];
                return (
                  <tr
                    key={m.userId}
                    className={`transition ${
                      isMe
                        ? "bg-amber-50/40 dark:bg-amber-950/20 font-medium"
                        : "hover:bg-amber-50/20 dark:hover:bg-slate-800/30"
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <MemberAvatar src={imgUrl} name={m.name} size={36} />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">{m.name}</p>
                            {isMe && (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-500 text-white rounded">
                                {isBn ? "আপনি" : "You"}
                              </span>
                            )}
                          </div>
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
                            ? "bg-amber-100/70 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-rose-100/70 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        }`}
                      >
                        {isPositive ? "+" : ""}{formatRice(m.remaining)} {unit}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          m.remaining > 0
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : m.remaining < 0
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            : "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300"
                        }`}
                      >
                        {m.remaining > 0 ? (isBn ? "উদ্বৃত্ত (Surplus)" : "Surplus") : m.remaining < 0 ? (isBn ? "বকেয়া (Deficit)" : "Deficit") : (isBn ? "সমান" : "Settled")}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clearance Summary Section (Reconciliation) */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Scale size={18} className="text-amber-500" />
              <span>{isBn ? "ক্লিয়ারেন্স সামারি (চালের সমন্বয় বিবরণী)" : "Clearance Summary (Stock Reconciliation)"}</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isBn
                ? "কার কত চাল উদ্বৃত্ত (ফেরত পাবে) এবং কার কত চাল বকেয়া (জমা দিতে হবে)"
                : "Breakdown of members with surplus rice (to return) vs deficit rice (due to pay)"}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
              {isBn ? `মোট উদ্বৃত্ত: ${formatRice(totalSurplus)} ${unit}` : `Total Surplus: ${formatRice(totalSurplus)} ${unit}`}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40">
              {isBn ? `মোট বকেয়া: ${formatRice(totalDeficit)} ${unit}` : `Total Deficit: ${formatRice(totalDeficit)} ${unit}`}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Surplus Rice Card (To Return / Refund) */}
          <div className="rounded-2xl border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/10 dark:bg-amber-950/10 overflow-hidden shadow-sm">
            <div className="p-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span>{isBn ? "উদ্বৃত্ত চাল (ফেরত পাবে)" : "To Receive (Surplus Rice)"}</span>
              </span>
              <span className="text-xs font-bold font-[family-name:var(--font-mono)]">
                {formatRice(totalSurplus)} {unit}
              </span>
            </div>
            <div className="divide-y divide-amber-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
              {surplusMembers.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400">
                  {isBn ? "কারো চাল উদ্বৃত্ত নেই" : "No surplus members"}
                </div>
              ) : (
                surplusMembers.map((m) => (
                  <div key={m.userId} className="p-3 flex items-center justify-between hover:bg-amber-50/40 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MemberAvatar src={m.image || getCachedImageMap()[m.userId]} name={m.name} size={30} />
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {m.name} {String(m.userId) === String(userId) ? (isBn ? "(আপনি)" : "(You)") : ""}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-[family-name:var(--font-mono)] shrink-0">
                      +{formatRice(m.remaining)} {unit}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 bg-amber-50 dark:bg-slate-800/80 border-t border-amber-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-300">
              <span>{isBn ? "মোট ফেরতযোগ্য চাল" : "Total To Receive"}</span>
              <span className="font-[family-name:var(--font-mono)]">{formatRice(totalSurplus)} {unit}</span>
            </div>
          </div>

          {/* Deficit Rice Card (To Pay / Due) */}
          <div className="rounded-2xl border border-rose-200/80 dark:border-rose-900/40 bg-rose-50/10 dark:bg-rose-950/10 overflow-hidden shadow-sm">
            <div className="p-3.5 bg-gradient-to-r from-rose-500 to-red-600 text-white flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span>{isBn ? "বকেয়া চাল (জমা দিতে হবে)" : "To Pay (Deficit Rice)"}</span>
              </span>
              <span className="text-xs font-bold font-[family-name:var(--font-mono)]">
                {formatRice(totalDeficit)} {unit}
              </span>
            </div>
            <div className="divide-y divide-rose-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
              {deficitMembers.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400">
                  {isBn ? "কারো চাল বকেয়া নেই" : "No deficit members"}
                </div>
              ) : (
                deficitMembers.map((m) => (
                  <div key={m.userId} className="p-3 flex items-center justify-between hover:bg-rose-50/40 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MemberAvatar src={m.image || getCachedImageMap()[m.userId]} name={m.name} size={30} />
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {m.name} {String(m.userId) === String(userId) ? (isBn ? "(আপনি)" : "(You)") : ""}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 font-[family-name:var(--font-mono)] shrink-0">
                      -{formatRice(Math.abs(m.remaining))} {unit}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 bg-rose-50 dark:bg-slate-800/80 border-t border-rose-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-rose-900 dark:text-rose-300">
              <span>{isBn ? "মোট বকেয়া চাল" : "Total To Pay"}</span>
              <span className="font-[family-name:var(--font-mono)]">{formatRice(totalDeficit)} {unit}</span>
            </div>
          </div>
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
                : "Click on any member card to view their deposit logs for this month"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.members.map((m) => {
            const memberDeposits = depositsByMember[m.userId] || [];
            const isExpanded = expandedMemberId === m.userId;
            const imgUrl = m.image || getCachedImageMap()[m.userId];
            const isMe = String(m.userId) === String(userId);

            return (
              <div
                key={m.userId}
                className={`border rounded-xl transition overflow-hidden ${
                  isExpanded
                    ? "border-amber-500 bg-amber-50/10 dark:border-amber-500/50 dark:bg-amber-950/10"
                    : "border-gray-200/70 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                }`}
              >
                <div
                  onClick={() => setExpandedMemberId(isExpanded ? null : m.userId)}
                  className="p-3.5 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <MemberAvatar src={imgUrl} name={m.name} size={36} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate">{m.name}</p>
                        {isMe && (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-500 text-white rounded">
                            {isBn ? "আপনি" : "You"}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400">
                        {memberDeposits.length} {isBn ? "টি ডিপোজিট" : "deposits"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block uppercase font-bold">{isBn ? "মোট জমা" : "Total"}</span>
                      <span className="text-xs font-bold font-[family-name:var(--font-mono)] text-gray-900 dark:text-white">
                        {formatRice(m.totalAdded)} {unit}
                      </span>
                    </div>
                    {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-3 bg-gray-50/70 dark:bg-slate-800/40 border-t border-gray-100 dark:border-slate-800 space-y-2">
                    {memberDeposits.length === 0 ? (
                      <p className="text-center text-xs text-gray-400 py-3">
                        {isBn ? "এই মাসে কোনো চাল জমা দেওয়ার রেকর্ড নেই" : "No deposits recorded for this month"}
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {memberDeposits.map((dep, idx) => (
                          <div
                            key={dep._id || idx}
                            className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-gray-200/50 dark:border-slate-700/50 text-xs"
                          >
                            <div>
                              <span className="font-bold text-gray-800 dark:text-gray-200">
                                {formatRice(dep.quantity)} {unit}
                              </span>
                              <span className="text-[10px] text-gray-400 ml-2">
                                {formatDate(dep.date)}
                              </span>
                            </div>
                            {dep.note && (
                              <span className="text-[10px] text-gray-500 italic max-w-[150px] truncate">
                                &quot;{dep.note}&quot;
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
