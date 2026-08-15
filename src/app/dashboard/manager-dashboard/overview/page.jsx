"use client";

import { useEffect, useMemo, useState } from "react";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import { fetchOverview } from "@/components/action/action2";
import { GetUser } from "@/components/action/action";
import { useTranslation } from "@/lib/useTranslation";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { getBDNow, getBDDateStr } from "@/lib/date-utils";
import Image from "next/image";
import { getOptimizedImageUrl, getCachedImageMap, setCachedImageMap } from "@/lib/image-utils";
import MemberAvatar from "@/components/ui/MemberAvatar";

export const dynamic = "force-dynamic";
// import { fetchOverview } from "@/lib/api";

const display = Fraunces({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-display", display: "swap" });
const body = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });



const taka = (n) =>
  new Intl.NumberFormat("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n || 0);

function monthLabel(month, year) {
  return new Date(year, month - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
}

// Perforated "tear tab" edge — the signature element.
// A row of little punched circles, like a receipt stub.
function Perforation({ className = "" }) {
  return (
    <div
      className={`h-3 w-full ${className}`}
      style={{
        backgroundImage:
          "radial-gradient(circle at 6px 6px, #F2F4F1 3px, transparent 3.5px)",
        backgroundSize: "14px 12px",
        backgroundRepeat: "repeat-x",
        backgroundColor: "#1B2A26",
      }}
    />
  );
}

function SummaryCard({ label, value, mono: useMono = true, icon = "📊" }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-amber-50/80 dark:bg-amber-950/25 border border-amber-200/70 dark:border-amber-900/40 backdrop-blur-xl p-3.5 min-[375px]:p-4 sm:p-5 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300">
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-orange-400/40 to-transparent pointer-events-none" />
      <div className="flex items-center justify-between mb-1">
        <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-[#EA580C] dark:text-orange-400">
          {label}
        </p>
        <span className="text-sm">{icon}</span>
      </div>
      <p className={`mt-0.5 text-sm min-[375px]:text-base sm:text-xl md:text-2xl font-bold text-gray-950 dark:text-slate-100 whitespace-nowrap ${useMono ? "font-[family-name:var(--font-mono)]" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }) {
  const isAdvance = status === "advance";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${isAdvance ? "bg-[#3F7D5C]/10 text-[#3F7D5C]" : "bg-[#B5533C]/10 text-[#B5533C]"
        }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isAdvance ? "bg-[#3F7D5C]" : "bg-[#B5533C]"}`} />
      {isAdvance ? "Advance" : "Due"}
    </span>
  );
}

// Row with a dotted "receipt leader" between name and figure
function LeaderRow({ left, right }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="whitespace-nowrap">{left}</span>
      <span className="flex-1 border-b border-dotted border-current/20 translate-y-[-3px]" />
      <span className="whitespace-nowrap font-[family-name:var(--font-mono)]">{right}</span>
    </div>
  );
}

export default function OverviewDashboard({ role }) {
  const { t, lang } = useTranslation();
  const isBn = lang === "bn";
  const [month, setMonth] = useState(() => getBDNow().month);
  const [year, setYear] = useState(() => getBDNow().year);
  const [showPredictor, setShowPredictor] = useState(false);

  const user = GetUser();
  const userId = user?.user?.id;

  const [data, setData] = useState(() => {
    if (typeof window !== "undefined" && userId) {
      const cached = sessionStorage.getItem(`overview_data_${userId}_${month}_${year}`);
      if (cached) {
        try { return JSON.parse(cached); } catch (e) { }
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(() => !data);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [memberImageMap, setMemberImageMap] = useState(() => getCachedImageMap());

  const filteredMembers = useMemo(() => {
    if (!data?.members) return [];
    return data.members.filter((m) =>
      m.userName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data?.members, searchQuery]);

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

    const key = `overview_data_${userId}_${month}_${year}`;
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem(key);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setData(parsed);
          setLoading(false);
        } catch (e) { }
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
        if (!cancelled && !data) setError(err.message || "কিছু একটা ভুল হয়েছে");
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
      toast("PDF generated successfully!");
    }
  }

  return (
    <div
      className={`${display.variable} ${body.variable} ${mono.variable} min-h-screen bg-[#F2F4F1] dark:bg-slate-950 font-[family-name:var(--font-body)] text-[#1B2A26] dark:text-slate-200 border dark:border-slate-800 rounded-2xl`}
    >
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
          <div className="mb-6 rounded-md border border-[#B5533C]/30 bg-[#B5533C]/5 px-4 py-3 text-sm text-[#B5533C]">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-md bg-[#1B2A26]/10" />
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

            {/* Action Bar */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#1B2A26]/10 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <p className="font-[family-name:var(--font-display)] text-lg">Member Summary</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleDownloadPdf}
                  disabled={exporting}
                  className="rounded-md bg-[#ff6900] px-3 py-2 text-sm font-medium text-[#F2F4F1] transition-all duration-150 hover:bg-[#1B2A26]/90 active:scale-95 disabled:opacity-60 cursor-pointer shadow-sm"
                >
                  {exporting ? "Preparing…" : "📄 Download PDF"}
                </button>
              </div>
            </div>
            {/* Search Bar */}
            <div className="mt-6 flex items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder={lang === "bn" ? "মেম্বার খুঁজুন..." : "Search member..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/60 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition backdrop-blur-sm"
                />
              </div>
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                {filteredMembers.length} {lang === "bn" ? "মেম্বার" : filteredMembers.length === 1 ? "Member" : "Members"}
              </span>
            </div>

            {filteredMembers.length === 0 ? (
              <div className="mt-4 p-8 text-center text-gray-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/80 dark:border-slate-800">
                {lang === "bn" ? "কোনো মেম্বার পাওয়া যায়নি" : "No members found"}
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="mt-4 hidden overflow-hidden rounded-2xl border border-gray-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-slate-800 text-left text-xs uppercase tracking-wide text-[#1B2A26]/50 dark:text-slate-400 bg-gray-50/50 dark:bg-slate-800/40">
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
                            className={`border-b border-gray-100 dark:border-slate-800/50 last:border-0 transition-colors ${
                              isPositive
                                ? "bg-emerald-50/20 hover:bg-emerald-50/40 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20"
                                : "bg-rose-50/20 hover:bg-rose-50/40 dark:bg-rose-950/10 dark:hover:bg-rose-950/20"
                            }`}
                          >
                            <td className="px-4 py-3 font-medium">
                              <div className="flex items-center gap-3 min-w-0">
                                <MemberAvatar src={imgUrl} name={memberName} size={36} />
                                <span className="font-semibold text-gray-900 dark:text-slate-100">{memberName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-[family-name:var(--font-mono)]">{m.totalMeal}</td>
                            <td className="px-4 py-3 font-[family-name:var(--font-mono)]">৳ {taka(m.deposit)}</td>
                            <td className="px-4 py-3 font-[family-name:var(--font-mono)]">৳ {taka(m.bill)}</td>
                            <td
                              className={`px-4 py-3 font-[family-name:var(--font-mono)] font-bold ${
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

                {/* Mobile receipt-style cards */}
                <div className="mt-4 space-y-3 sm:hidden">
                  {filteredMembers.map((m) => {
                    const isPositive = m.balance >= 0;
                    const imgUrl = m.image || m.userImage || m.avatar || m.photo || m.userPhoto || memberImageMap[m.userId];
                    const memberName = m.userName || m.name || "Member";
                    return (
                      <div
                        key={m.userId}
                        className={`rounded-2xl border backdrop-blur-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 ${
                          isPositive
                            ? "border-emerald-200/50 bg-emerald-50/25 dark:border-emerald-900/30 dark:bg-emerald-950/15"
                            : "border-rose-200/50 bg-rose-50/25 dark:border-rose-900/30 dark:bg-rose-950/15"
                        }`}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <MemberAvatar src={imgUrl} name={memberName} size={40} />
                            <p className="font-bold truncate text-base text-gray-900 dark:text-slate-100">{memberName}</p>
                          </div>
                          <StatusBadge status={m.status} />
                        </div>
                        <div className="space-y-1 text-sm text-[#1B2A26]/80 dark:text-slate-300">
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
