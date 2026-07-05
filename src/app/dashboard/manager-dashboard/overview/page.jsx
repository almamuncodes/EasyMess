"use client";

import { useEffect, useMemo, useState } from "react";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import { fetchOverview } from "@/components/action/action2";
import { GetUser } from "@/components/action/action";
import { toast } from "sonner";
// import { fetchOverview } from "@/lib/api";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-display",
});
const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

const taka = (n) =>
  new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n || 0);

function monthLabel(month, year) {
  return new Date(year, month - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
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
      <p
        className={`mt-1 text-2xl font-bold text-gray-950 ${useMono ? "font-[family-name:var(--font-mono)]" : ""}`}
      >
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
        isAdvance
          ? "bg-[#3F7D5C]/10 text-[#3F7D5C]"
          : "bg-[#B5533C]/10 text-[#B5533C]"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isAdvance ? "bg-[#3F7D5C]" : "bg-[#B5533C]"}`}
      />
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
      <span className="whitespace-nowrap font-[family-name:var(--font-mono)]">
        {right}
      </span>
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
  const userId = user?.user?.id;
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

  // handle download pdf
  // Uses html2canvas + jsPDF: renders the hidden #pdf-content block (real browser
  // rendering) into an image, then places that image into the PDF. This avoids
  // jsPDF's default font limitation, so Bangla (and any other language) renders
  // correctly since the browser itself is doing the text rendering.
 async function handleDownloadPdf() {
  if (!data) return;

  setExporting(true);

  try {
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    await document.fonts.ready;

    const element = document.getElementById("pdf-content");

    const canvas = await html2canvas(element, {
      scale: 1.5, // reduced from 2 to keep file size reasonable
      backgroundColor: "#ffffff",
      useCORS: true,
    });

    // JPEG with 0.85 quality instead of PNG - drastically smaller file size
    const imgData = canvas.toDataURL("image/jpeg", 0.85);

    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    doc.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      doc.addPage();
      doc.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    doc.save(
      `${(data.messName || "easymess").replace(/\s+/g, "_")}_${data.month}_${data.year}.pdf`,
    );
  } finally {
    setExporting(false);
    toast("PDF generated successfully!");
  }
}
  // handle download excel
  async function handleDownloadExcel() {
    if (!data) return;
    setExporting(true);

    try {
      const ExcelJS = await import("exceljs");
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Report");

      // PREMIUM EXCEL COLOR PALETTE
      const WHITE = "FFFFFFFF"; // White Background
      const HEADER = "FF1E293B"; // Dark Slate
      const TITLE = "FF0F766E"; // Emerald
      const BLUE = "FF2563EB"; // Table Header Blue
      const SUMMARY = "FFE0F2FE"; // Summary Light Blue
      const LIGHT = "FFF8FAFC"; // Alternate Row
      const BORDER = "FFE5E7EB"; // Border
      const GREEN = "FF16A34A"; // Positive
      const RED = "FFDC2626"; // Negative

      ws.columns = [
        { width: 24 },
        { width: 12 },
        { width: 14 },
        { width: 12 },
        { width: 16 },
        { width: 10 },
        { width: 12 },
      ];

      // Background Color
      for (let r = 1; r <= 20 + data.members.length; r++) {
        for (let c = 1; c <= 7; c++) {
          ws.getCell(r, c).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: WHITE },
          };
        }
      }

      ws.getCell("A1").value = data.messName || "EasyMess";
      ws.getCell("A1").font = { bold: true, size: 20, color: { argb: TITLE } };

      ws.getCell("A2").value = `Month: ${monthLabel(data.month, data.year)}`;
      ws.getCell("A2").font = { bold: true, size: 12 };

      ws.getCell("A3").value = `Generated: ${new Date().toLocaleDateString()}`;
      ws.getCell("A3").font = { italic: true, color: { argb: HEADER } };

      const summaryRow = ws.getRow(5);
      summaryRow.getCell(1).value =
        `Total Deposit: ${data.summary.totalDeposit}`;
      summaryRow.getCell(2).value = `Total Bazaar: ${data.summary.totalBazaar}`;
      summaryRow.getCell(3).value = `Total Meal: ${data.summary.totalMeal}`;
      summaryRow.getCell(4).value = `Meal Rate: ${data.summary.mealRate}`;

      [1, 2, 3, 4].forEach((c) => {
        summaryRow.getCell(c).font = { bold: true, color: { argb: HEADER } };
        summaryRow.getCell(c).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: SUMMARY },
        };
      });

      const headerRow = ws.getRow(7);
      ["Name", "Meal", "Deposit", "Bill", "Balance", "Status"].forEach(
        (h, i) => {
          const cell = headerRow.getCell(i + 1);
          cell.value = h;
          cell.font = { bold: true, size: 12, color: { argb: WHITE } };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: BLUE },
          };
        },
      );

      data.members.forEach((m, idx) => {
        const row = ws.getRow(8 + idx);
        row.getCell(1).value = m.userName;
        row.getCell(2).value = m.totalMeal;
        row.getCell(3).value = m.deposit;
        row.getCell(4).value = m.bill;
        row.getCell(5).value = m.balance;
        row.getCell(6).value = m.status === "advance" ? "Advance" : "Due";

        row.getCell(1).font = { bold: true, color: { argb: HEADER } };
        row.getCell(5).font = {
          bold: true,
          color: { argb: m.balance < 0 ? RED : GREEN },
        };
      });

      const footerRowIdx = 9 + data.members.length;
      ws.mergeCells(`A${footerRowIdx}:F${footerRowIdx}`);
      ws.getCell(`A${footerRowIdx}`).value = "Generated By EasyMess";

      ws.getCell(`A${footerRowIdx}`).font = {
        size: 16,
        bold: true,
        color: { argb: TITLE },
      };
      ws.getCell(`A${footerRowIdx}`).alignment = { horizontal: "center" };

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(data.messName || "easymess").replace(/\s+/g, "_")}_${data.month}_${data.year}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
      toast("Excel generated successfully!");
    }
  }

  return (
    <div
      className={`${display.variable} ${body.variable} ${mono.variable} min-h-screen border-none rounded-2xl bg-[#F2F4F1] font-[family-name:var(--font-body)] text-[#1B2A26]`}
    >
      {/* Hidden report block used only for PDF export via html2canvas - not shown on screen */}
      {data && (
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <div
            id="pdf-content"
            style={{
              width: "800px",
              padding: "24px",
              background: "#fff",
              color: "#000",
              fontFamily: "'Noto Sans Bengali', 'Hind Siliguri', sans-serif",
            }}
          >
            <h2>{data.messName || "EasyMess"}</h2>
            <p>Month: {monthLabel(data.month, data.year)}</p>
            <p>Generated: {new Date().toLocaleDateString()}</p>

            <p>
              Total Deposit: ৳ {taka(data.summary.totalDeposit)} &nbsp;&nbsp;
              Total Bazaar: ৳ {taka(data.summary.totalBazaar)} &nbsp;&nbsp;
              Total Meal: {data.summary.totalMeal} &nbsp;&nbsp;
              Meal Rate: ৳ {taka(data.summary.mealRate)}
            </p>

            <table
              style={{ width: "100%", borderCollapse: "collapse", marginTop: "16px" }}
            >
              <thead>
                <tr style={{ background: "#1b2a26", color: "#fff" }}>
                  <th style={{ padding: "6px", textAlign: "left" }}>Name</th>
                  <th style={{ padding: "6px" }}>Meal</th>
                  <th style={{ padding: "6px" }}>Deposit</th>
                  <th style={{ padding: "6px" }}>Bill</th>
                  <th style={{ padding: "6px" }}>Balance</th>
                  <th style={{ padding: "6px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.members.map((m) => (
                  <tr key={m.userId} style={{ borderBottom: "1px solid #ddd" }}>
                    <td style={{ padding: "6px" }}>{m.userName}</td>
                    <td style={{ padding: "6px", textAlign: "center" }}>
                      {m.totalMeal}
                    </td>
                    <td style={{ padding: "6px", textAlign: "center" }}>
                      {taka(m.deposit)}
                    </td>
                    <td style={{ padding: "6px", textAlign: "center" }}>
                      {taka(m.bill)}
                    </td>
                    <td style={{ padding: "6px", textAlign: "center" }}>
                      {taka(m.balance)}
                    </td>
                    <td style={{ padding: "6px", textAlign: "center" }}>
                      {m.status === "advance" ? "Advance" : "Due"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p style={{ fontSize: "10px", marginTop: "20px" }}>
              Generated By EasyMess
            </p>
          </div>
        </div>
      )}

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
                  {new Date(2000, m - 1, 1).toLocaleString("en-US", {
                    month: "long",
                  })}
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
              <div
                key={i}
                className="h-24 animate-pulse rounded-md bg-[#1B2A26]/10"
              />
            ))}
          </div>
        ) : data ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <SummaryCard
                label="Total Deposit"
                value={`৳ ${taka(data.summary.totalDeposit)}`}
                icon="💰"
              />
              <SummaryCard
                label="Total Bazaar"
                value={`৳ ${taka(data.summary.totalBazaar)}`}
                icon="🛒"
              />
              <SummaryCard
                label="Total Meals"
                value={data.summary.totalMeal}
                icon="🍽️"
                mono
              />
              <SummaryCard
                label="Meal Rate"
                value={`৳ ${taka(data.summary.mealRate)}`}
                icon="💵"
              />
            </div>

            {/* Export bar */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#1B2A26]/10 pb-4">
              <p className="font-[family-name:var(--font-display)] text-lg">
                Member Summary
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadPdf}
                  disabled={exporting}
                  className="hover:cursor-pointer rounded-md bg-[#ff6900] px-3 py-2 text-sm font-medium text-[#F2F4F1] transition hover:bg-[#ff6900]/90 disabled:opacity-60"
                >
                  {exporting ? "Preparing…" : "📄 Download PDF"}
                </button>
                {isManager && (
                  <button
                    title="Coming soon"
                    onClick={handleDownloadExcel}
                    className="hover:cursor-pointer rounded-md border-2 bg-[#fff7ed] border-[#ff6900]/15 px-3 py-2 text-sm font-medium text-[#1B2A26]/60 "
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
                      <td className="px-4 py-3 font-[family-name:var(--font-mono)]">
                        {m.totalMeal}
                      </td>
                      <td className="px-4 py-3 font-[family-name:var(--font-mono)]">
                        ৳ {taka(m.deposit)}
                      </td>
                      <td className="px-4 py-3 font-[family-name:var(--font-mono)]">
                        ৳ {taka(m.bill)}
                      </td>
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
                <div
                  key={m.userId}
                  className="rounded-md border border-[#1B2A26]/10 bg-white p-4"
                >
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