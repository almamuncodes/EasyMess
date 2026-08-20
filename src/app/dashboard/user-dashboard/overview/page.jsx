"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import { fetchOverview } from "@/components/action/action2";
import { GetUser } from "@/components/action/action";
import { useTranslation } from "@/lib/useTranslation";
import {
  Sparkles,
  X,
  Search,
  ArrowUpDown,
  SlidersHorizontal,
  ChevronDown,
  Check,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { getBDNow, getBDDateStr } from "@/lib/date-utils";
import Image from "next/image";
import { getOptimizedImageUrl, getCachedImageMap, setCachedImageMap } from "@/lib/image-utils";
import MemberAvatar from "@/components/ui/MemberAvatar";

export const dynamic = "force-dynamic";

const display = Fraunces({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-display", display: "swap" });
const body = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });

const taka = (n) =>
  new Intl.NumberFormat("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n || 0);

function monthLabel(month, year) {
  return new Date(year, month - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
}

const SORT_OPTIONS = [
  { id: "default", labelEn: "Default Order", labelBn: "ডিফল্ট অর্ডার", icon: ArrowUpDown },
  { id: "meal-desc", labelEn: "Meal: High to Low", labelBn: "মিল: বেশি থেকে কম", icon: TrendingUp },
  { id: "meal-asc", labelEn: "Meal: Low to High", labelBn: "মিল: কম থেকে বেশি", icon: TrendingDown },
  { id: "deposit-desc", labelEn: "Deposit: High to Low", labelBn: "ডিপোজিট: বেশি থেকে কম", icon: Wallet },
  { id: "bill-desc", labelEn: "Bill: High to Low", labelBn: "বিল: বেশি থেকে কম", icon: Receipt },
  { id: "balance-desc", labelEn: "Advance: High to Low", labelBn: "অ্যাডভান্স: বেশি থেকে কম", icon: Sparkles },
  { id: "balance-asc", labelEn: "Due: High to Low", labelBn: "ডিউ: বেশি থেকে কম", icon: ArrowUpDown },
];

function getSortLabel(sortBy, isBn) {
  switch (sortBy) {
    case "meal-desc": return isBn ? "মিল: বেশি → কম" : "Meal: High → Low";
    case "meal-asc": return isBn ? "মিল: কম → বেশি" : "Meal: Low → High";
    case "deposit-desc": return isBn ? "ডিপোজিট: বেশি" : "Deposit: High";
    case "bill-desc": return isBn ? "বিল: বেশি" : "Bill: High";
    case "balance-desc": return isBn ? "অ্যাডভান্স: বেশি" : "Advance: High";
    case "balance-asc": return isBn ? "ডিউ: বেশি" : "Due: High";
    default: return isBn ? "ফিল্টার" : "Filter";
  }
}

function SummaryCard({ label, value, mono: useMono = true, icon = "📊" }) {
  return (
    <div className="rounded-2xl bg-[#FFF7ED] dark:bg-slate-900 border border-[#FFEEDD] dark:border-slate-800 p-3 min-[375px]:p-4 sm:p-5 shadow-sm">
      <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-[#EA580C] dark:text-orange-400 flex items-center gap-1">
        <span>{icon}</span> <span>{label}</span>
      </p>
      <p className={`mt-1 text-sm min-[375px]:text-base sm:text-xl md:text-2xl font-bold text-gray-950 dark:text-slate-100 whitespace-nowrap ${useMono ? "font-[family-name:var(--font-mono)]" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }) {
  const isAdvance = status === "advance";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isAdvance ? "bg-[#3F7D5C]/10 text-[#3F7D5C]" : "bg-[#B5533C]/10 text-[#B5533C]"
      }`}
    >
      {isAdvance ? "Advance" : "Due"}
    </span>
  );
}

function LeaderRow({ left, right }) {
  return (
    <div className="flex items-center justify-between text-xs sm:text-sm">
      <span className="text-gray-500 dark:text-slate-400">{left}</span>
      <span className="font-bold font-mono text-gray-900 dark:text-slate-100">{right}</span>
    </div>
  );
}

export default function UserOverviewPage() {
  const { t, lang } = useTranslation();
  const isBn = lang === "bn";

  const user = GetUser();
  const userId = user?.user?.id;
  const role = user?.user?.role || "member";

  const [month, setMonth] = useState(() => getBDNow().month);
  const [year, setYear] = useState(() => getBDNow().year);
  const [showPredictor, setShowPredictor] = useState(false);

  const [data, setData] = useState(() => {
    if (typeof window !== "undefined" && userId) {
      const cached = sessionStorage.getItem(`overview_data_${userId}_${month}_${year}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {}
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(() => !data);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortMenuRef = useRef(null);
  const [memberImageMap, setMemberImageMap] = useState(() => getCachedImageMap());

  useEffect(() => {
    function handleClickOutside(event) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredMembers = useMemo(() => {
    if (!data?.members) return [];
    let list = data.members.filter((m) =>
      m.userName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortBy === "meal-desc") {
      return [...list].sort((a, b) => (b.totalMeal || 0) - (a.totalMeal || 0));
    }
    if (sortBy === "meal-asc") {
      return [...list].sort((a, b) => (a.totalMeal || 0) - (b.totalMeal || 0));
    }
    if (sortBy === "deposit-desc") {
      return [...list].sort((a, b) => (b.deposit || 0) - (a.deposit || 0));
    }
    if (sortBy === "bill-desc") {
      return [...list].sort((a, b) => (b.bill || 0) - (a.bill || 0));
    }
    if (sortBy === "balance-desc") {
      return [...list].sort((a, b) => (b.balance || 0) - (a.balance || 0));
    }
    if (sortBy === "balance-asc") {
      return [...list].sort((a, b) => (a.balance || 0) - (b.balance || 0));
    }
    return list;
  }, [data?.members, searchQuery, sortBy]);

  // Fetch member images from mess meals API to enrich overview members & sync 7-day cache
  useEffect(() => {
    if (!userId) return;
    const todayStr = getBDDateStr();
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
    fetch(`${apiBase}/api/mess/meals?userId=${userId}&date=${todayStr}`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData?.members && Array.isArray(resData.members)) {
          const map = {};
          resData.members.forEach((m) => {
            if (m.userId && m.image) {
              map[m.userId] = m.image;
            }
          });
          setMemberImageMap((prev) => ({ ...prev, ...map }));
          setCachedImageMap(map);
        }
      })
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const key = `user_overview_data_${userId}_${month}_${year}`;
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem(key);
      if (cached) {
        try {
          setData(JSON.parse(cached));
          setLoading(false);
        } catch (e) {}
      } else {
        if (!data) setLoading(true);
      }
    }

    setError("");

    fetchOverview({ userId, month, year })
      .then((res) => {
        if (!cancelled) {
          setData(res);
          if (typeof window !== "undefined") {
            sessionStorage.setItem(key, JSON.stringify(res));
          }
        }
      })
      .catch((err) => {
        if (!cancelled && !data) setError(err.message || "Failed to load overview data");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, month, year]);

  const isManager = role === "manager" || data?.requesterRole === "manager";

  const monthOptions = useMemo(() => {
    const opts = [];
    for (let m = 1; m <= 12; m++) opts.push(m);
    return opts;
  }, []);

  const yearOptions = useMemo(() => {
    const y = getBDNow().year;
    return [y - 1, y, y + 1];
  }, []);

  async function handleDownloadPdf() {
    if (!data) return;

    setExporting(true);

    try {
      const { default: jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF();

      // Title & Month info
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(data.messName || "EasyMess", 14, 18);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Month: ${monthLabel(data.month, data.year)}`, 14, 25);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

      // Summary details row with Cash in Hand
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      const cashInHand = data.summary.totalDeposit - data.summary.totalBazaar;
      doc.text(
        `Total Deposit: ${taka(data.summary.totalDeposit)}    Total Bazaar: ${taka(
          data.summary.totalBazaar
        )}    Cash in Hand: ${taka(cashInHand)}    Total Meal: ${data.summary.totalMeal}    Meal Rate: ${taka(data.summary.mealRate)}`,
        14,
        40
      );

      // Main Table
      autoTable(doc, {
        startY: 46,
        head: [["Name", "Meal", "Deposit", "Bill", "Balance", "Status"]],
        body: data.members.map((m) => [
          m.userName,
          m.totalMeal,
          taka(m.deposit),
          taka(m.bill),
          (m.balance >= 0 ? "+" : "") + taka(m.balance),
          m.status === "advance" ? "Advance" : "Due",
        ]),
        headStyles: { fillColor: [27, 42, 38] },
        styles: { fontSize: 9 },
        didParseCell: function (cellData) {
          if (cellData.section === "body") {
            // Style Status column (index 5)
            if (cellData.column.index === 5) {
              const status = cellData.cell.raw;
              if (status === "Advance") {
                cellData.cell.styles.textColor = [63, 125, 92]; // Green
                cellData.cell.styles.fontStyle = "bold";
              } else if (status === "Due") {
                cellData.cell.styles.textColor = [181, 83, 60]; // Red
                cellData.cell.styles.fontStyle = "bold";
              }
            }
            // Style Balance column (index 4)
            if (cellData.column.index === 4) {
              const balVal = cellData.cell.raw;
              if (String(balVal).startsWith("+")) {
                cellData.cell.styles.textColor = [63, 125, 92]; // Green
              } else if (String(balVal).startsWith("-")) {
                cellData.cell.styles.textColor = [181, 83, 60]; // Red
              }
            }
          }
        }
      });

      // Prepare side-by-side Clearance Summary Table (English text to prevent garbled PDF font)
      const receiveMembers = data.members.filter((m) => m.balance > 0);
      const payMembers = data.members.filter((m) => m.balance < 0);

      const totalReceive = receiveMembers.reduce((sum, m) => sum + m.balance, 0);
      const totalPay = payMembers.reduce((sum, m) => sum + Math.abs(m.balance), 0);

      const maxRows = Math.max(receiveMembers.length, payMembers.length);
      const summaryRows = [];
      for (let i = 0; i < maxRows; i++) {
        const rec = receiveMembers[i];
        const pay = payMembers[i];
        summaryRows.push([
          rec ? rec.userName : "",
          rec ? `Tk ${taka(rec.balance)}` : "",
          "",
          pay ? pay.userName : "",
          pay ? `Tk ${taka(Math.abs(pay.balance))}` : "",
        ]);
      }
      // Add footer row for totals
      summaryRows.push([
        "Total To Receive",
        `Tk ${taka(totalReceive)}`,
        "",
        "Total To Pay",
        `Tk ${taka(totalPay)}`,
      ]);

      // Draw Clearance Summary title
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Clearance Summary", 14, doc.lastAutoTable.finalY + 12);

      // Draw Clearance Summary Table
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 16,
        head: [["To Receive (Refund)", "Amount", "", "To Pay (Due)", "Amount"]],
        body: summaryRows,
        headStyles: { fillColor: [63, 125, 92] },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 55 },
          1: { cellWidth: 30 },
          2: { cellWidth: 10, fillColor: [255, 255, 255] }, // Separator
          3: { cellWidth: 55 },
          4: { cellWidth: 30 }
        },
        didParseCell: function (cellData) {
          if (cellData.column.index === 2) {
            cellData.cell.styles.lineWidth = 0;
            cellData.cell.styles.cellPadding = 0;
          }
          if (cellData.row.index === maxRows) {
            cellData.cell.styles.fontStyle = "bold";
            if (cellData.column.index < 2) {
              cellData.cell.styles.textColor = [63, 125, 92]; // Green
            } else if (cellData.column.index > 2) {
              cellData.cell.styles.textColor = [181, 83, 60]; // Red
            }
          }
        }
      });

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Generated By EasyMess", 14, doc.lastAutoTable.finalY + 10);

      doc.save(`${(data.messName || "easymess").replace(/\s+/g, "_")}_${data.month}_${data.year}.pdf`);
    } finally {
      setExporting(false);
      toast("PDF downloaded!");
    }
  }

  return (
    <div
      className={`${display.variable} ${body.variable} ${mono.variable} min-h-screen bg-[#F2F4F1] dark:bg-slate-950 font-[family-name:var(--font-body)] text-[#1B2A26] dark:text-slate-200 border dark:border-slate-800 rounded-2xl p-4 sm:p-6`}
    >
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#C99A3E]">
              {isManager ? "Manager" : "Member"} · Monthly Overview
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold">
              {data?.messName || "EasyMess"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="rounded-md border border-[#1B2A26]/15 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C99A3E]"
            >
              {monthOptions.map((m) => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1, 1).toLocaleString("en-US", { month: "long" })}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-md border border-[#1B2A26]/15 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C99A3E]"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-[#B5533C]/30 bg-[#B5533C]/5 px-4 py-3 text-sm text-[#B5533C]">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-[#1B2A26]/10" />
            ))}
          </div>
        ) : data ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <SummaryCard label="Total Deposit" value={`৳ ${taka(data.summary.totalDeposit)}`} icon="💰" />
              <SummaryCard label="Total Bazaar" value={`৳ ${taka(data.summary.totalBazaar)}`} icon="🛒" />
              <SummaryCard label="Total Meals" value={data.summary.totalMeal} icon="🍽️" mono />
              <SummaryCard label="Meal Rate" value={`৳ ${taka(data.summary.mealRate)}`} icon="💵" />
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1B2A26]/10 dark:border-slate-800 pb-4">
              <p className="font-[family-name:var(--font-display)] text-lg font-semibold">Member Summary</p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleDownloadPdf}
                  disabled={exporting}
                  className="rounded-xl bg-[#ff6900] px-3.5 py-2 text-xs font-semibold text-white transition-all duration-150 hover:bg-[#ff6900]/90 active:scale-95 disabled:opacity-60 cursor-pointer shadow-sm"
                >
                  {exporting ? "Preparing…" : "📄 Download PDF"}
                </button>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="mt-6 relative z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-[#1B2A26]/10 dark:border-slate-800 shadow-sm">
              <div className="flex flex-1 items-center gap-2 sm:gap-3 w-full">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                  <input
                    type="text"
                    placeholder={lang === "bn" ? "মেম্বার খুঁজুন..." : "Search member..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-8 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
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

                {/* Custom Smart Filter Dropdown Trigger */}
                <div className="relative z-40" ref={sortMenuRef}>
                  <button
                    onClick={() => setIsSortOpen((prev) => !prev)}
                    type="button"
                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all duration-200 shrink-0 cursor-pointer shadow-sm ${
                      sortBy !== "default"
                        ? "bg-orange-500/10 border-orange-500/40 text-orange-600 dark:text-orange-400 ring-2 ring-orange-500/20"
                        : "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-750"
                    }`}
                  >
                    <SlidersHorizontal size={16} className={sortBy !== "default" ? "text-orange-500" : "text-gray-500 dark:text-slate-400"} />
                    <span className="whitespace-nowrap">{getSortLabel(sortBy, isBn)}</span>
                    <ChevronDown size={14} className={`transition-transform duration-200 text-gray-400 ${isSortOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Smart Filter Modal Popover */}
                  {isSortOpen && (
                    <div className="absolute right-0 mt-2 w-64 sm:w-72 z-[100] rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-gray-200/90 dark:border-slate-800 p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-2 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400 flex items-center gap-1.5">
                          <SlidersHorizontal size={13} /> {isBn ? "সর্ট ও ফিল্টার" : "Sort & Filter"}
                        </span>
                        {sortBy !== "default" && (
                          <button
                            onClick={() => {
                              setSortBy("default");
                              setIsSortOpen(false);
                            }}
                            className="text-xs text-orange-500 hover:text-orange-600 dark:hover:text-orange-400 font-semibold cursor-pointer"
                          >
                            {isBn ? "রিসেট" : "Reset"}
                          </button>
                        )}
                      </div>

                      <div className="py-1.5 space-y-1 max-h-72 overflow-y-auto">
                        {SORT_OPTIONS.map((opt) => {
                          const isSelected = sortBy === opt.id;
                          const Icon = opt.icon;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => {
                                setSortBy(opt.id);
                                setIsSortOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm transition-all duration-150 cursor-pointer ${
                                isSelected
                                  ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold border border-orange-500/20"
                                  : "text-gray-700 dark:text-slate-300 font-medium hover:bg-gray-100/80 dark:hover:bg-slate-800/80"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <Icon size={16} className={isSelected ? "text-orange-500" : "text-gray-400 dark:text-slate-500"} />
                                <span>{isBn ? opt.labelBn : opt.labelEn}</span>
                              </div>
                              {isSelected && <Check size={16} className="text-orange-500" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 self-end sm:self-center shrink-0">
                {filteredMembers.length} {lang === "bn" ? "মেম্বার" : filteredMembers.length === 1 ? "Member" : "Members"}
              </span>
            </div>

            {filteredMembers.length === 0 ? (
              <div className="mt-4 p-8 text-center text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-md border border-[#1B2A26]/10 dark:border-slate-800">
                {lang === "bn" ? "কোনো মেম্বার পাওয়া যায়নি" : "No members found"}
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="mt-4 hidden overflow-hidden rounded-2xl border border-[#1B2A26]/10 dark:border-slate-800 bg-white dark:bg-slate-900 sm:block shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#1B2A26]/10 dark:border-slate-800 text-left text-xs uppercase tracking-wide text-[#1B2A26]/50 dark:text-slate-400">
                        <th className="px-4 py-3 font-medium">Member</th>
                        <th className="px-4 py-3 font-medium">Meal</th>
                        <th className="px-4 py-3 font-medium">Deposit</th>
                        <th className="px-4 py-3 font-medium">Bill</th>
                        <th className="px-4 py-3 font-medium">Balance</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map((m, idx) => {
                        const isPositive = m.balance >= 0;
                        const imgUrl = m.image || m.userImage || m.avatar || m.photo || m.userPhoto || memberImageMap[m.userId];
                        const memberName = m.userName || m.name || "Member";
                        return (
                          <tr
                            key={m.userId}
                            className={`border-b border-[#1B2A26]/5 dark:border-slate-800/50 last:border-0 transition-colors ${
                              isPositive
                                ? "bg-emerald-50/20 hover:bg-emerald-50/40 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20"
                                : "bg-rose-50/20 hover:bg-rose-50/40 dark:bg-rose-950/10 dark:hover:bg-rose-950/20"
                            }`}
                          >
                            <td className="px-4 py-3 font-semibold">{m.userName}</td>
                            <td className="px-4 py-3 font-mono">{m.totalMeal}</td>
                            <td className="px-4 py-3 font-mono">৳ {taka(m.deposit)}</td>
                            <td className="px-4 py-3 font-mono">৳ {taka(m.bill)}</td>
                            <td
                              className={`px-4 py-3 font-mono font-bold ${
                                isPositive ? "text-[#3F7D5C] dark:text-emerald-400" : "text-[#B5533C] dark:text-rose-450"
                              }`}
                            >
                              {isPositive ? "+" : ""}
                              {taka(m.balance)}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={m.status} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="mt-4 space-y-3 sm:hidden">
                  {filteredMembers.map((m) => {
                    const isPositive = m.balance >= 0;
                    return (
                      <div
                        key={m.userId}
                        className={`rounded-2xl border backdrop-blur-xl p-4 shadow-sm transition-all duration-300 space-y-2 ${
                          isPositive
                            ? "border-emerald-200/50 bg-emerald-50/25 dark:border-emerald-900/30 dark:bg-emerald-950/15"
                            : "border-rose-200/50 bg-rose-50/25 dark:border-rose-900/30 dark:bg-rose-950/15"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-sm text-gray-900 dark:text-white">{m.userName}</p>
                          <StatusBadge status={m.status} />
                        </div>
                        <div className="space-y-1.5">
                          <LeaderRow left="Meal" right={m.totalMeal} />
                          <LeaderRow left="Deposit" right={`৳ ${taka(m.deposit)}`} />
                          <LeaderRow left="Bill" right={`৳ ${taka(m.bill)}`} />
                          <LeaderRow
                            left="Balance"
                            right={`${isPositive ? "+" : ""}৳ ${taka(m.balance)}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
