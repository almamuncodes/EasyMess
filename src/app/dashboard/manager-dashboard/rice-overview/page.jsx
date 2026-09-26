"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import { GetUser } from "@/components/action/action";
import { toast } from "sonner";
import { setCachedImageMap } from "@/lib/image-utils";

export const dynamic = "force-dynamic";

import {
  Boxes,
  Plus,
  Trash2,
  Search,
  RefreshCw,
  FileText,
  Scale,
  Download,
  X,
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
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
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

// SummaryCard matching overview/page.jsx design language
function SummaryCard({ label, value, mono: useMono = true, icon = "📊", isNegative = false }) {
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
    </div>
  );
}

// StatusBadge matching overview/page.jsx
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

// Receipt-style LeaderRow matching overview/page.jsx
function LeaderRow({ left, right, rightClass = "" }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="whitespace-nowrap">{left}</span>
      <span className="flex-1 border-b border-dotted border-current/20 translate-y-[-3px]" />
      <span className={`whitespace-nowrap font-[family-name:var(--font-mono)] ${rightClass}`}>{right}</span>
    </div>
  );
}

export default function ManagerRiceOverviewPage() {
  const user = GetUser();
  const userId = user?.user?.id;
  const { t, lang } = useTranslation();
  const isBn = lang === "bn";

  const bdNow = getBDDateStr();
  const [selectedMonth, setSelectedMonth] = useState(() => getBDNow().month);
  const [selectedYear, setSelectedYear] = useState(() => getBDNow().year);

  const [data, setData] = useState(() => {
    if (typeof window !== "undefined" && userId) {
      const cached = sessionStorage.getItem(`rice_summary_${userId}_${selectedMonth}_${selectedYear}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {}
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

      // 1. Title & Header info
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(27, 42, 38); // Forest Dark
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
        `Total Added: ${formatRice(data.summary.totalMessStockAdded)} ${unitStr}    Total Consumed: ${formatRice(
          data.summary.totalMessConsumed
        )} ${unitStr}    Stock Balance: ${formatRice(data.summary.totalMessRemaining)} ${unitStr}`,
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
            m.name,
            m.role ? m.role.toUpperCase() : "MEMBER",
            `${formatRice(m.totalAdded)} ${unitStr}`,
            `${formatRice(m.totalConsumed)} ${unitStr}`,
            (isSurplus ? "+" : "") + `${formatRice(bal)} ${unitStr}`,
            isSurplus ? "Surplus" : isDeficit ? "Deficit" : "Settled",
          ];
        }),
        headStyles: { fillColor: [27, 42, 38], textColor: [255, 255, 255] }, // Signature #1B2A26
        styles: { fontSize: 9 },
        didParseCell: function (cellData) {
          if (cellData.section === "body") {
            // Style Status column (index 5)
            if (cellData.column.index === 5) {
              const status = cellData.cell.raw;
              if (status === "Surplus") {
                cellData.cell.styles.textColor = [63, 125, 92]; // Emerald #3F7D5C
                cellData.cell.styles.fontStyle = "bold";
              } else if (status === "Deficit") {
                cellData.cell.styles.textColor = [181, 83, 60]; // Rose #B5533C
                cellData.cell.styles.fontStyle = "bold";
              }
            }
            // Style Balance column (index 4)
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

      // 4. Prepare Clearance Summary Table (Surplus vs Deficit)
      const surplusMembers = data.members.filter((m) => (Number(m.remaining) || 0) > 0);
      const deficitMembers = data.members.filter((m) => (Number(m.remaining) || 0) < 0);

      const totalSurplus = surplusMembers.reduce((sum, m) => sum + (Number(m.remaining) || 0), 0);
      const totalDeficit = deficitMembers.reduce((sum, m) => sum + Math.abs(Number(m.remaining) || 0), 0);

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
      doc.setTextColor(27, 42, 38);
      doc.text("Clearance Summary", 14, doc.lastAutoTable.finalY + 12);

      // Draw Clearance Summary Table
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 16,
        head: [["To Receive (Surplus)", "Amount", "", "To Pay (Deficit)", "Amount"]],
        body: summaryRows,
        headStyles: { fillColor: [63, 125, 92], textColor: [255, 255, 255] }, // Emerald Green
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
              cellData.cell.styles.textColor = [63, 125, 92]; // Emerald
            } else if (cellData.column.index > 2) {
              cellData.cell.styles.textColor = [181, 83, 60]; // Rose
            }
          }
        },
      });

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184); // Slate-400
      doc.text("Generated By EasyMess", 14, doc.lastAutoTable.finalY + 10);

      doc.save(`${(data.messName || "EasyMess").replace(/\s+/g, "_")}_Rice_Report_${monthName}_${selectedYear}.pdf`);
      toast.success(isBn ? "পিডিএফ রিপোর্ট ডাউনলোড হয়েছে!" : "PDF report downloaded successfully!");
    } catch (err) {
      console.error("PDF Export Error:", err);
      toast.error(isBn ? "পিডিএফ তৈরিতে সমস্যা হয়েছে" : "Failed to generate PDF report");
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
              <Boxes size={14} /> <span>{isBn ? "ম্যানেজার · রাইস প্যানেল" : "Manager · Rice Overview"}</span>
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold">
              {data?.messName || (isBn ? "রাইস ওভারভিউ" : "Rice Overview")}
            </h1>
            <p className="text-xs text-[#1B2A26]/70 dark:text-slate-400 mt-1">
              {isBn
                ? `মাসিক চাল জমা, মোট খরচ ও অবশিষ্টাংশ রিপোর্ট (১ মিল = ${data.config.ricePerMeal} ${unit})`
                : `Monthly rice deposit summary & member stock balance (1 Meal = ${data.config.ricePerMeal} ${unit})`}
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
            label={isBn ? "মিল প্রতি চাল" : "Per Meal Rate"}
            value={`${data.config.ricePerMeal} ${unit}`}
            icon="🍚"
            mono
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

            <button
              onClick={() => {
                if (data.members.length > 0) setSelectedMemberId(data.members[0].userId);
                setIsModalOpen(true);
              }}
              className="rounded-md border border-[#1B2A26]/15 dark:border-slate-800 bg-white dark:bg-slate-900 text-[#1B2A26] dark:text-slate-200 px-3 py-2 text-sm font-medium transition hover:bg-gray-100/80 dark:hover:bg-slate-800 active:scale-95 cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>{isBn ? "চাল জমা/বিয়োগ (+/-)" : "Add/Deduct Rice"}</span>
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
                    return (
                      <tr
                        key={m.userId}
                        className={`border-b border-gray-100 dark:border-slate-800/50 last:border-0 transition-colors ${
                          isPositive
                            ? "bg-emerald-50/20 hover:bg-emerald-50/40 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20"
                            : "bg-rose-50/20 hover:bg-rose-50/40 dark:bg-rose-950/10 dark:hover:bg-rose-950/20"
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                          <div>
                            <p className="font-semibold text-sm text-gray-900 dark:text-white">{m.name}</p>
                            <span className="text-[10px] uppercase font-bold text-gray-400">{m.role || "MEMBER"}</span>
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

                return (
                  <div
                    key={m.userId}
                    className={`rounded-2xl border backdrop-blur-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 ${
                      isPositive
                        ? "border-emerald-200/50 bg-emerald-50/25 dark:border-emerald-900/30 dark:bg-emerald-950/15"
                        : "border-rose-200/50 bg-rose-50/25 dark:border-rose-900/30 dark:bg-rose-950/15"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">{m.name}</p>
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

        {/* Clearance Summary Section (Reconciliation) */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <Scale size={18} className="text-[#EA580C]" />
                <span className="font-[family-name:var(--font-display)]">
                  {isBn ? "ক্লিয়ারেন্স সামারি (চালের সমন্বয় বিবরণী)" : "Clearance Summary (Stock Reconciliation)"}
                </span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {isBn
                  ? "কার কত চাল উদ্বৃত্ত (ফেরত পাবে) এবং কার কত চাল বকেয়া (জমা দিতে হবে)"
                  : "Breakdown of members with surplus rice (to return) vs deficit rice (due to pay)"}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#3F7D5C] dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                {isBn ? `মোট উদ্বৃত্ত: ${formatRice(totalSurplus)} ${unit}` : `Total Surplus: ${formatRice(totalSurplus)} ${unit}`}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-[#B5533C] dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40">
                {isBn ? `মোট বকেয়া: ${formatRice(totalDeficit)} ${unit}` : `Total Deficit: ${formatRice(totalDeficit)} ${unit}`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Surplus Rice Card (To Return / Refund) */}
            <div className="rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 bg-emerald-50/15 dark:bg-emerald-950/10 overflow-hidden shadow-sm">
              <div className="p-3.5 bg-[#3F7D5C] text-white flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider">
                  {isBn ? "উদ্বৃত্ত চাল (ফেরত পাবে)" : "To Receive (Surplus Rice)"}
                </span>
                <span className="text-xs font-bold font-[family-name:var(--font-mono)]">
                  +{formatRice(totalSurplus)} {unit}
                </span>
              </div>
              <div className="divide-y divide-emerald-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                {surplusMembers.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-400">
                    {isBn ? "কারো চাল উদ্বৃত্ত নেই" : "No surplus members"}
                  </div>
                ) : (
                  surplusMembers.map((m) => (
                    <div
                      key={m.userId}
                      className="p-3 flex items-center justify-between hover:bg-emerald-50/40 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{m.name}</span>
                      <span className="text-xs font-bold text-[#3F7D5C] dark:text-emerald-400 font-[family-name:var(--font-mono)] shrink-0">
                        +{formatRice(m.remaining)} {unit}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 bg-emerald-50/80 dark:bg-slate-800/80 border-t border-emerald-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-300">
                <span>{isBn ? "মোট ফেরতযোগ্য চাল" : "Total To Receive"}</span>
                <span className="font-[family-name:var(--font-mono)]">+{formatRice(totalSurplus)} {unit}</span>
              </div>
            </div>

            {/* Deficit Rice Card (To Pay / Due) */}
            <div className="rounded-2xl border border-rose-200/80 dark:border-rose-900/40 bg-rose-50/15 dark:bg-rose-950/10 overflow-hidden shadow-sm">
              <div className="p-3.5 bg-[#B5533C] text-white flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider">
                  {isBn ? "বকেয়া চাল (জমা দিতে হবে)" : "To Pay (Deficit Rice)"}
                </span>
                <span className="text-xs font-bold font-[family-name:var(--font-mono)]">
                  -{formatRice(totalDeficit)} {unit}
                </span>
              </div>
              <div className="divide-y divide-rose-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                {deficitMembers.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-400">
                    {isBn ? "কারো চাল বকেয়া নেই" : "No deficit members"}
                  </div>
                ) : (
                  deficitMembers.map((m) => (
                    <div
                      key={m.userId}
                      className="p-3 flex items-center justify-between hover:bg-rose-50/40 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{m.name}</span>
                      <span className="text-xs font-bold text-[#B5533C] dark:text-rose-400 font-[family-name:var(--font-mono)] shrink-0">
                        -{formatRice(Math.abs(m.remaining))} {unit}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 bg-rose-50/80 dark:bg-slate-800/80 border-t border-rose-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-rose-900 dark:text-rose-300">
                <span>{isBn ? "মোট বকেয়া চাল" : "Total To Pay"}</span>
                <span className="font-[family-name:var(--font-mono)]">-{formatRice(totalDeficit)} {unit}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Deposit History - Accordion */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <FileText size={18} className="text-[#EA580C]" />
                <span className="font-[family-name:var(--font-display)]">
                  {isBn ? "সদস্যভিত্তিক চাল জমার ইতিহাস" : "Monthly Deposit History"}
                </span>
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
            <div className="p-8 text-center bg-gray-50/50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-slate-800">
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
                const isPositive = m.remaining >= 0;

                return (
                  <div
                    key={m.userId}
                    className="rounded-2xl overflow-hidden bg-white/60 dark:bg-slate-800/50 border border-gray-200/80 dark:border-slate-800 transition"
                  >
                    {/* Member Accordion Header */}
                    <div
                      onClick={() => setExpandedMemberId(isExpanded ? null : m.userId)}
                      className="w-full p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-gray-100/60 dark:hover:bg-slate-800/80 transition"
                    >
                      {/* Member Info */}
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
                          <span>
                            {isBn ? "মোট জমা" : "Total Added"}:{" "}
                            <strong className="text-[#3F7D5C] dark:text-emerald-400">
                              +{formatRice(m.totalAdded)} {unit}
                            </strong>
                          </span>
                        </p>
                      </div>

                      {/* Status & Accordion Toggle */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200/60 dark:border-slate-800">
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] uppercase font-bold text-gray-400 block">
                            {isBn ? "অবশিষ্ট ব্যালেন্স" : "Stock Balance"}
                          </span>
                          <span
                            className={`text-sm font-bold font-[family-name:var(--font-mono)] ${
                              isPositive ? "text-[#3F7D5C] dark:text-emerald-400" : "text-[#B5533C] dark:text-rose-400"
                            }`}
                          >
                            {isPositive ? "+" : ""}
                            {formatRice(m.remaining)} {unit}
                          </span>
                        </div>

                        <div className="p-1.5 rounded-md bg-white dark:bg-slate-900 text-gray-500 dark:text-slate-300 border border-gray-200 dark:border-slate-700 shadow-sm">
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
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
                            className="px-3 py-1.5 bg-[#ff6900] hover:bg-[#1B2A26] text-white rounded-md text-xs font-semibold transition flex items-center gap-1 cursor-pointer shadow-sm"
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
                                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700/60"
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                                        isAdd
                                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                                          : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                                      }`}
                                    >
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
                                    <span
                                      className={`text-sm font-bold font-[family-name:var(--font-mono)] ${
                                        isAdd ? "text-[#3F7D5C] dark:text-emerald-400" : "text-[#B5533C] dark:text-rose-400"
                                      }`}
                                    >
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
      </div>

      {/* Add Deposit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-gray-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Plus size={18} className="text-[#ff6900]" />
                <span className="font-[family-name:var(--font-display)]">
                  {isBn ? "চাল জমা/বিয়োগ এন্ট্রি করুন" : "Add / Deduct Rice Deposit"}
                </span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-1 rounded-full cursor-pointer"
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
                  className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
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
                  className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
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
                  className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#ff6900] hover:bg-[#1B2A26] text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer"
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
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-gray-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 w-full max-w-sm shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-center">
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
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {isBn ? "ক্যানসেল" : "Cancel"}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-500/20 transition disabled:opacity-50 cursor-pointer"
              >
                {deleting ? (isBn ? "মুছছে..." : "Deleting...") : isBn ? "হ্যাঁ, মুছুন" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
