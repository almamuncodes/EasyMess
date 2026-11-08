"use client";

import React from "react";

export default function HomeOverviewSkeleton() {
  const memberRowWidths = [
    { nameWidth: "w-28", isManager: true, dots: [true, true, true] },
    { nameWidth: "w-36", isManager: false, dots: [true, true, true] },
    { nameWidth: "w-32", isManager: false, dots: [false, false, false] },
    { nameWidth: "w-28", isManager: false, dots: [true, true, true] },
    { nameWidth: "w-24", isManager: false, dots: [true, true, true] },
    { nameWidth: "w-30", isManager: false, dots: [true, true, true] },
    { nameWidth: "w-36", isManager: false, dots: [false, true, true] },
    { nameWidth: "w-40", isManager: true, dots: [true, true, true] },
  ];

  return (
    <div className="min-h-screen bg-[#F3F1EC] dark:bg-slate-950 font-body transition-colors duration-200">
      <section className="mx-auto max-w-2xl px-4 pt-3 pb-8 sm:pt-6 sm:pb-12">
        {/* App Meta Subtitle */}
        <p className="font-meta text-[11px] uppercase tracking-[0.3em] text-[#FF6900] font-bold">
          EASYMESS
        </p>

        {/* Mess Name & Members Subtitle */}
        <div className="mt-1 space-y-2">
          <div className="h-8 sm:h-9 w-44 rounded-xl bg-gray-200/90 dark:bg-slate-800 animate-pulse" />
          <div className="h-3.5 w-56 rounded-md bg-gray-200/70 dark:bg-slate-800/80 animate-pulse" />
        </div>

        {/* Top 3 Month Summary Stats Cards */}
        <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
          {/* 1. Meal Rate */}
          <div className="relative overflow-hidden rounded-2xl bg-amber-50/80 dark:bg-amber-950/25 p-2.5 sm:p-4 text-center border border-amber-200/80 dark:border-amber-900/40 shadow-xs">
            <p className="font-meta text-[9px] sm:text-[10px] uppercase tracking-wide text-amber-700/80 dark:text-amber-400 font-semibold truncate">
              MEAL RATE
            </p>
            <div className="h-5 sm:h-6 w-16 sm:w-20 mx-auto rounded-lg bg-amber-300/60 dark:bg-amber-700/50 animate-pulse mt-1.5" />
          </div>

          {/* 2. Your Bill */}
          <div className="relative overflow-hidden rounded-2xl bg-orange-50/80 dark:bg-orange-950/25 p-2.5 sm:p-4 text-center border border-orange-200/80 dark:border-orange-900/40 shadow-xs">
            <p className="font-meta text-[9px] sm:text-[10px] uppercase tracking-wide text-orange-700/80 dark:text-orange-400 font-semibold truncate">
              YOUR BILL
            </p>
            <div className="h-5 sm:h-6 w-16 sm:w-20 mx-auto rounded-lg bg-orange-300/60 dark:bg-orange-700/50 animate-pulse mt-1.5" />
          </div>

          {/* 3. You Owe / Advance */}
          <div className="relative overflow-hidden rounded-2xl bg-red-50/80 dark:bg-red-950/25 p-2.5 sm:p-4 text-center border border-red-200/80 dark:border-red-900/40 shadow-xs">
            <p className="font-meta text-[9px] sm:text-[10px] uppercase tracking-wide text-red-700/80 dark:text-red-400 font-semibold truncate">
              YOU OWE
            </p>
            <div className="h-5 sm:h-6 w-16 sm:w-20 mx-auto rounded-lg bg-red-300/60 dark:bg-red-700/50 animate-pulse mt-1.5" />
          </div>
        </div>

        {/* Today's Meals Section Header */}
        <div className="mt-4 sm:mt-5 space-y-1.5">
          <div className="h-6 w-32 rounded-lg bg-gray-200/90 dark:bg-slate-800 animate-pulse" />
          <div className="h-3.5 w-40 rounded-md bg-gray-200/70 dark:bg-slate-800/80 animate-pulse" />
        </div>

        {/* 3 Meals Cards (Breakfast, Lunch, Dinner) */}
        <div className="mt-2.5 grid grid-cols-3 gap-2 sm:gap-3">
          {["BREAKFAST", "LUNCH", "DINNER"].map((type) => (
            <div
              key={type}
              className="rounded-2xl bg-white dark:bg-slate-900 p-2 sm:p-3 text-center shadow-[0_1px_3px_rgba(22,24,29,0.05)] ring-1 ring-[#EAE7E0] dark:ring-slate-800"
            >
              <p className="font-meta text-[10px] uppercase tracking-wide text-[#9a9691] dark:text-slate-400 font-semibold">
                {type}
              </p>
              <div className="mt-1.5 flex items-center justify-around">
                {/* Left (Meal) */}
                <div className="flex-1 min-w-0">
                  <div className="h-5 sm:h-6 w-6 sm:w-7 mx-auto rounded-md bg-gray-200/90 dark:bg-slate-800 animate-pulse" />
                  <p className="font-meta text-[9px] text-[#9a9691] dark:text-slate-500 truncate mt-1">
                    Meal
                  </p>
                </div>

                {/* Divider Line */}
                <div className="h-7 w-[1px] bg-gray-200 dark:bg-slate-800 shrink-0 mx-1" />

                {/* Right (Rice) */}
                <div className="flex-1 min-w-0">
                  <div className="h-5 sm:h-6 w-6 sm:w-7 mx-auto rounded-md bg-amber-300/70 dark:bg-amber-700/50 animate-pulse" />
                  <p className="font-meta text-[9px] text-amber-700/80 dark:text-amber-400 truncate mt-1 font-medium">
                    Rice
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Members Meal Status List Container */}
        <div className="mt-3.5 rounded-2xl bg-white dark:bg-slate-900 shadow-[0_1px_3px_rgba(22,24,29,0.05)] ring-1 ring-[#EAE7E0] dark:ring-slate-800 overflow-hidden">
          {/* Table Header */}
          <div className="flex items-center justify-between border-b border-[#E7E5E1] dark:border-slate-800 px-5 py-3 bg-gray-50/50 dark:bg-slate-800/40">
            <p className="font-meta text-[10px] uppercase tracking-wide text-[#9a9691] dark:text-slate-400 font-semibold">
              MEMBER
            </p>
            <div className="flex gap-4 sm:gap-6 shrink-0">
              {["B", "L", "D"].map((col) => (
                <p
                  key={col}
                  className="w-8 text-center font-meta text-[10px] uppercase tracking-wide text-[#9a9691] dark:text-slate-400 font-semibold"
                >
                  {col}
                </p>
              ))}
            </div>
          </div>

          {/* Member Rows */}
          {memberRowWidths.map((row, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between px-5 py-3 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-[#F3F1EC] dark:[&:not(:last-child)]:border-slate-800/60"
            >
              {/* Avatar + Name */}
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="h-8 w-8 rounded-full bg-gray-200/90 dark:bg-slate-800 shrink-0 animate-pulse" />
                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                  <div className={`h-4 ${row.nameWidth} rounded-md bg-gray-200/80 dark:bg-slate-800 animate-pulse`} />
                
                </div>
              </div>

              {/* Status Dots (B, L, D) */}
              <div className="flex gap-4 sm:gap-6 shrink-0">
                {row.dots.map((isOn, dotIdx) => (
                  <div key={dotIdx} className="w-8 flex items-center justify-center">
                    <span
                      className={`block h-3 w-3 rounded-full ${
                        isOn
                          ? "bg-[#FF6900] shadow-xs shadow-orange-500/40 opacity-70 animate-pulse"
                          : "bg-[#E7E5E1] dark:bg-slate-800"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

