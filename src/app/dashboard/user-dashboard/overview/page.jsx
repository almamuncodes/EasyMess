"use client";

import { useEffect, useMemo, useState } from "react";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import { fetchOverview } from "@/components/action/action2";
import { GetUser } from "@/components/action/action";
import { toast } from "sonner";
// import { fetchOverview } from "@/lib/api";

const display = Fraunces({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-display" });
const body = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });



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

function SummaryCard({ label, value, mono: useMono = true }) {
  return (
    <div className="rounded-2xl bg-[#FFF7ED] border border-[#FFEEDD] p-5 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#EA580C]">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold text-gray-950 ${useMono ? "font-[family-name:var(--font-mono)]" : ""}`}>
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
      <span className="flex-1 border-b border-dotted border-[#1B2A26]/25 translate-y-[-3px]" />
      <span className="whitespace-nowrap font-[family-name:var(--font-mono)]">{right}</span>
    </div>
  );
}

export default function OverviewDashboard({ role }) {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const user = GetUser();
const userId = user?.user?.id ;
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    fetchOverview({ userId, month, year })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "কিছু একটা ভুল হয়েছে");
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
    const y = today.getFullYear();
    return [y - 1, y, y + 1];
  }, [today]);

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
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

      doc.setFontSize(11);
      doc.text(
        `Total Deposit: ${taka(data.summary.totalDeposit)}    Total Bazaar: ${taka(
          data.summary.totalBazaar
        )}    Total Meal: ${data.summary.totalMeal}    Meal Rate: ${taka(data.summary.mealRate)}`,
        14,
        40
      );

      autoTable(doc, {
        startY: 46,
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
        styles: { fontSize: 9 },
      });

      doc.setFontSize(8);
      doc.text("Generated By EasyMess", 14, doc.lastAutoTable.finalY + 10);

      doc.save(`${(data.messName || "easymess").replace(/\s+/g, "_")}_${data.month}_${data.year}.pdf`);
    } finally {
      setExporting(false);
      toast("PDF generated successfully!");
    }
  }

  return (
    <div
      className={`${display.variable} ${body.variable} ${mono.variable} min-h-screen bg-[#F2F4F1] font-[family-name:var(--font-body)] text-[#1B2A26] border rounded-2xl`}
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
              className="rounded-md border border-[#1B2A26]/15 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C99A3E]"
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
              className="rounded-md border border-[#1B2A26]/15 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C99A3E]"
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

            {/* Export bar */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#1B2A26]/10 pb-4">
              <p className="font-[family-name:var(--font-display)] text-lg">Member Summary</p>
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadPdf}
                  disabled={exporting}
                  className="rounded-md bg-[#1B2A26] px-3 py-2 text-sm font-medium text-[#F2F4F1] transition hover:bg-[#1B2A26]/90 disabled:opacity-60"
                >
                  {exporting ? "Preparing…" : "📄 Download PDF"}
                </button>
                {isManager && (
                  <button
                    disabled
                    title="Coming soon"
                    onClick={() => alert("Coming soon!")}
                    className="rounded-md border border-[#1B2A26]/15 px-3 py-2 text-sm font-medium text-[#1B2A26]/40"
                  >
                    📊 Download Excel
                  </button>
                )}
              </div>
            </div>

            {/* Desktop table */}
            <div className="mt-4 hidden overflow-hidden rounded-md border border-[#1B2A26]/10 bg-white sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1B2A26]/10 text-left text-xs uppercase tracking-wide text-[#1B2A26]/50">
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
                      className={`border-b border-[#1B2A26]/5 last:border-0 ${
                        idx % 2 === 1 ? "bg-[#1B2A26]/[0.02]" : ""
                      }`}
                    >
                      <td className="px-4 py-3">{m.userName}</td>
                      <td className="px-4 py-3 font-[family-name:var(--font-mono)]">{m.totalMeal}</td>
                      <td className="px-4 py-3 font-[family-name:var(--font-mono)]">৳ {taka(m.deposit)}</td>
                      <td className="px-4 py-3 font-[family-name:var(--font-mono)]">৳ {taka(m.bill)}</td>
                      <td
                        className={`px-4 py-3 font-[family-name:var(--font-mono)] ${
                          m.balance >= 0 ? "text-[#3F7D5C]" : "text-[#B5533C]"
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

            {/* Mobile receipt-style cards */}
            <div className="mt-4 space-y-3 sm:hidden">
              {data.members.map((m) => (
                <div key={m.userId} className="rounded-md border border-[#1B2A26]/10 bg-white p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-medium">{m.userName}</p>
                    <StatusBadge status={m.status} />
                  </div>
                  <div className="space-y-1 text-sm text-[#1B2A26]/80">
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

