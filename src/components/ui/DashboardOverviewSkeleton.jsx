"use client";

import React from "react";

export default function DashboardOverviewSkeleton() {
  return (
    <div className="min-h-screen bg-[#F2F4F1] dark:bg-slate-950 font-body text-[#1B2A26] dark:text-slate-200 border dark:border-slate-800 rounded-2xl select-none pointer-events-none transition-colors duration-200">
      <div className="mx-auto max-w-5xl px-3 sm:px-6 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] sm:text-xs uppercase tracking-[0.18em] text-[#C99A3E] font-semibold">
              MANAGER · MONTHLY OVERVIEW
            </p>
            <div className="h-7 sm:h-9 w-40 sm:w-48 rounded-xl bg-gray-200/90 dark:bg-slate-800 animate-pulse mt-0.5 sm:mt-1" />
          </div>

          <div className="flex items-center gap-2">
            <div className="h-8 sm:h-9 w-28 rounded-lg sm:rounded-md bg-white dark:bg-slate-900 border border-[#1B2A26]/15 dark:border-slate-800 animate-pulse flex items-center justify-between px-2.5">
              <span className="h-3 w-16 rounded bg-gray-200 dark:bg-slate-700" />
              <span className="text-gray-400 text-xs">▼</span>
            </div>
            <div className="h-8 sm:h-9 w-20 rounded-lg sm:rounded-md bg-white dark:bg-slate-900 border border-[#1B2A26]/15 dark:border-slate-800 animate-pulse flex items-center justify-between px-2.5">
              <span className="h-3 w-10 rounded bg-gray-200 dark:bg-slate-700" />
              <span className="text-gray-400 text-xs">▼</span>
            </div>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 sm:grid-cols-4">
          {/* Card 1: Deposit */}
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-amber-50/80 dark:bg-amber-950/25 border border-amber-200/70 dark:border-amber-900/40 p-2.5 sm:p-4 md:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-0.5 sm:mb-1">
              <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-[#EA580C] dark:text-orange-400">
                TOTAL DEPOSIT
              </span>
              <span className="text-xs sm:text-sm">💰</span>
            </div>
            <div className="h-5 sm:h-6 w-20 sm:w-24 rounded-md bg-amber-300/60 dark:bg-amber-700/50 animate-pulse mt-1" />
          </div>

          {/* Card 2: Bazaar */}
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-amber-50/80 dark:bg-amber-950/25 border border-amber-200/70 dark:border-amber-900/40 p-2.5 sm:p-4 md:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-0.5 sm:mb-1">
              <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-[#EA580C] dark:text-orange-400">
                TOTAL BAZAAR
              </span>
              <span className="text-xs sm:text-sm">🛒</span>
            </div>
            <div className="h-5 sm:h-6 w-20 sm:w-24 rounded-md bg-amber-300/60 dark:bg-amber-700/50 animate-pulse mt-1" />
          </div>

          {/* Card 3: Meals */}
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-amber-50/80 dark:bg-amber-950/25 border border-amber-200/70 dark:border-amber-900/40 p-2.5 sm:p-4 md:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-0.5 sm:mb-1">
              <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-[#EA580C] dark:text-orange-400">
                TOTAL MEALS
              </span>
              <span className="text-xs sm:text-sm">🍽️</span>
            </div>
            <div className="h-5 sm:h-6 w-14 sm:w-16 rounded-md bg-amber-300/60 dark:bg-amber-700/50 animate-pulse mt-1" />
          </div>

          {/* Card 4: Rate */}
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-amber-50/80 dark:bg-amber-950/25 border border-amber-200/70 dark:border-amber-900/40 p-2.5 sm:p-4 md:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-0.5 sm:mb-1">
              <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-[#EA580C] dark:text-orange-400">
                MEAL RATE
              </span>
              <span className="text-xs sm:text-sm">💵</span>
            </div>
            <div className="h-5 sm:h-6 w-20 sm:w-24 rounded-md bg-amber-300/60 dark:bg-amber-700/50 animate-pulse mt-1" />
          </div>
        </div>

        {/* Action Bar Header */}
        <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#1B2A26]/10 dark:border-slate-800 pb-3 sm:pb-4">
          <p className="font-[family-name:var(--font-display)] text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            Member Summary
          </p>
          <div className="rounded-md bg-[#ff6900] px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-xs flex items-center gap-1.5 opacity-90">
            <span>📄</span> Download PDF
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-3.5 sm:mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <div className="flex flex-1 items-center gap-2 sm:gap-3 w-full">
            <div className="relative flex-1 h-9 sm:h-10 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 animate-pulse flex items-center px-3.5 gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-gray-300 dark:bg-slate-600" />
              <span className="h-3 w-28 rounded bg-gray-200 dark:bg-slate-700" />
            </div>
            <div className="h-9 sm:h-10 px-3.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 animate-pulse flex items-center gap-2 shrink-0">
              <span className="w-3.5 h-3.5 rounded-xs bg-gray-300 dark:bg-slate-600" />
              <span className="h-3 w-10 rounded bg-gray-200 dark:bg-slate-700" />
            </div>
          </div>
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 self-end sm:self-center shrink-0">
            ... Members
          </span>
        </div>

        {/* Desktop Table View */}
        <div className="mt-4 hidden sm:block overflow-hidden rounded-2xl border border-gray-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
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
              {[
                { w: "w-28", p: false },
                { w: "w-36", p: true },
                { w: "w-32", p: true },
                { w: "w-24", p: false },
                { w: "w-30", p: true },
                { w: "w-34", p: false },
                { w: "w-36", p: true },
              ].map((row, idx) => (
                <tr
                  key={idx}
                  className={`border-b border-gray-100 dark:border-slate-800/50 last:border-0 ${
                    row.p ? "bg-emerald-50/20 dark:bg-emerald-950/10" : "bg-rose-50/20 dark:bg-rose-950/10"
                  }`}
                >
                  <td className="px-4 py-3 font-medium">
                    <div className={`h-4 ${row.w} rounded bg-gray-200/90 dark:bg-slate-700 animate-pulse`} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-8 rounded bg-gray-200/90 dark:bg-slate-700 animate-pulse font-mono" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-16 rounded bg-gray-200/90 dark:bg-slate-700 animate-pulse font-mono" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-16 rounded bg-gray-200/90 dark:bg-slate-700 animate-pulse font-mono" />
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className={`h-4 w-16 rounded ${
                        row.p ? "bg-emerald-300/70 dark:bg-emerald-800" : "bg-rose-300/70 dark:bg-rose-800"
                      } animate-pulse font-mono`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        row.p
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                          : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                      }`}
                    >
                      {row.p ? "• Advance" : "• Due"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Member Cards (Exact copy of image 1) */}
        <div className="mt-4 space-y-3 sm:hidden">
          {/* Card 1: Due */}
          <div className="rounded-2xl border border-rose-200/50 bg-rose-50/25 dark:border-rose-900/30 dark:bg-rose-950/15 p-4 shadow-xs space-y-2 animate-pulse">
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 w-28 rounded bg-gray-300/80 dark:bg-slate-700" />
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                • Due
              </span>
            </div>
            <div className="space-y-1 text-sm text-[#1B2A26]/80 dark:text-slate-300 font-mono">
              <div className="flex justify-between border-b border-dotted border-gray-300/70 dark:border-slate-700 pb-0.5">
                <span>Meal</span>
                <span className="h-3 w-8 rounded bg-gray-200 dark:bg-slate-700" />
              </div>
              <div className="flex justify-between border-b border-dotted border-gray-300/70 dark:border-slate-700 pb-0.5">
                <span>Deposit</span>
                <span className="h-3 w-12 rounded bg-gray-200 dark:bg-slate-700" />
              </div>
              <div className="flex justify-between border-b border-dotted border-gray-300/70 dark:border-slate-700 pb-0.5">
                <span>Bill</span>
                <span className="h-3 w-16 rounded bg-gray-200 dark:bg-slate-700" />
              </div>
              <div className="flex justify-between">
                <span>Balance</span>
                <span className="h-3 w-16 rounded bg-rose-300/70 dark:bg-rose-900/60" />
              </div>
            </div>
          </div>

          {/* Card 2: Advance */}
          <div className="rounded-2xl border border-emerald-200/50 bg-emerald-50/25 dark:border-emerald-900/30 dark:bg-emerald-950/15 p-4 shadow-xs space-y-2 animate-pulse">
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 w-36 rounded bg-gray-300/80 dark:bg-slate-700" />
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                • Advance
              </span>
            </div>
            <div className="space-y-1 text-sm text-[#1B2A26]/80 dark:text-slate-300 font-mono">
              <div className="flex justify-between border-b border-dotted border-gray-300/70 dark:border-slate-700 pb-0.5">
                <span>Meal</span>
                <span className="h-3 w-8 rounded bg-gray-200 dark:bg-slate-700" />
              </div>
              <div className="flex justify-between border-b border-dotted border-gray-300/70 dark:border-slate-700 pb-0.5">
                <span>Deposit</span>
                <span className="h-3 w-14 rounded bg-gray-200 dark:bg-slate-700" />
              </div>
              <div className="flex justify-between border-b border-dotted border-gray-300/70 dark:border-slate-700 pb-0.5">
                <span>Bill</span>
                <span className="h-3 w-16 rounded bg-gray-200 dark:bg-slate-700" />
              </div>
              <div className="flex justify-between">
                <span>Balance</span>
                <span className="h-3 w-16 rounded bg-emerald-300/70 dark:bg-emerald-900/60" />
              </div>
            </div>
          </div>

          {/* Card 3: Due */}
          <div className="rounded-2xl border border-rose-200/50 bg-rose-50/25 dark:border-rose-900/30 dark:bg-rose-950/15 p-4 shadow-xs space-y-2 animate-pulse">
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 w-32 rounded bg-gray-300/80 dark:bg-slate-700" />
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                • Due
              </span>
            </div>
            <div className="space-y-1 text-sm text-[#1B2A26]/80 dark:text-slate-300 font-mono">
              <div className="flex justify-between border-b border-dotted border-gray-300/70 dark:border-slate-700 pb-0.5">
                <span>Meal</span>
                <span className="h-3 w-8 rounded bg-gray-200 dark:bg-slate-700" />
              </div>
              <div className="flex justify-between border-b border-dotted border-gray-300/70 dark:border-slate-700 pb-0.5">
                <span>Deposit</span>
                <span className="h-3 w-12 rounded bg-gray-200 dark:bg-slate-700" />
              </div>
              <div className="flex justify-between border-b border-dotted border-gray-300/70 dark:border-slate-700 pb-0.5">
                <span>Bill</span>
                <span className="h-3 w-16 rounded bg-gray-200 dark:bg-slate-700" />
              </div>
              <div className="flex justify-between">
                <span>Balance</span>
                <span className="h-3 w-16 rounded bg-rose-300/70 dark:bg-rose-900/60" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
