"use client";

import { useEffect, useMemo, useState } from "react";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import { fetchOverview } from "@/components/action/action2";
import { GetUser } from "@/components/action/action";
import { useTranslation } from "@/lib/useTranslation";
import { Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { getBDNow } from "@/lib/date-utils";

const display = Fraunces({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-display", display: "swap" });
const body = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });

const taka = (n) =>
  new Intl.NumberFormat("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n || 0);

function monthLabel(month, year) {
  return new Date(year, month - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
}

function SummaryCard({ label, value, mono: useMono = true, icon = "📊" }) {
  return (
    <div className="rounded-2xl bg-[#FFF7ED] dark:bg-slate-900 border border-[#FFEEDD] dark:border-slate-800 p-5 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#EA580C] dark:text-orange-400 flex items-center gap-1">
        <span>{icon}</span> {label}
      </p>
      <p className={`mt-1 text-xl sm:text-2xl font-bold text-gray-950 dark:text-slate-100 ${useMono ? "font-[family-name:var(--font-mono)]" : ""}`}>
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
      doc.setFontSize(16);
      doc.text(data.messName || "EasyMess", 14, 18);
      doc.setFontSize(10);
      doc.text(`Month: ${monthLabel(data.month, data.year)}`, 14, 25);

      autoTable(doc, {
        startY: 35,
        head: [["Name", "Meal", "Deposit", "Bill", "Balance", "Status"]],
        body: data.members.map((m) => [
          m.userName,
          m.totalMeal,
          taka(m.deposit),
          taka(m.bill),
          taka(m.balance),
          m.status === "advance" ? "Advance" : "Due",
        ]),
        headStyles: { fillColor: [27, 42, 38] },
      });

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
                  className="rounded-xl bg-[#ff6900] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#ff6900]/90 disabled:opacity-60 cursor-pointer"
                >
                  {exporting ? "Preparing…" : "📄 Download PDF"}
                </button>
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden overflow-hidden rounded-2xl border border-[#1B2A26]/10 dark:border-slate-800 bg-white dark:bg-slate-900 sm:block shadow-sm">
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
                  {data.members.map((m, idx) => (
                    <tr
                      key={m.userId}
                      className={`border-b border-[#1B2A26]/5 dark:border-slate-800/50 last:border-0 ${
                        idx % 2 === 1 ? "bg-[#1B2A26]/[0.02] dark:bg-slate-800/20" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-semibold">{m.userName}</td>
                      <td className="px-4 py-3 font-mono">{m.totalMeal}</td>
                      <td className="px-4 py-3 font-mono">৳ {taka(m.deposit)}</td>
                      <td className="px-4 py-3 font-mono">৳ {taka(m.bill)}</td>
                      <td
                        className={`px-4 py-3 font-mono font-bold ${
                          m.balance >= 0 ? "text-[#3F7D5C] dark:text-emerald-400" : "text-[#B5533C] dark:text-rose-400"
                        }`}
                      >
                        {m.balance >= 0 ? "+" : ""}
                        {taka(m.balance)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={m.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="space-y-3 sm:hidden">
              {data.members.map((m) => (
                <div key={m.userId} className="rounded-2xl border border-[#1B2A26]/10 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-2">
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
                      right={`${m.balance >= 0 ? "+" : ""}৳ ${taka(m.balance)}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
