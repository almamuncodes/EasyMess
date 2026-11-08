"use client";

import React from "react";

export default function ChatMessageSkeleton() {
  return (
    <div className="w-full space-y-4 py-2 select-none pointer-events-none">
      {/* Date Divider Skeleton */}
      <div className="flex justify-center my-3">
        <div className="h-5 w-24 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-[#EAE0D2] dark:border-white/10 shadow-xs animate-pulse" />
      </div>

      {/* 1. Left Message (Other Member) */}
      <div className="flex items-end gap-2 sm:gap-2.5 justify-start">
        <div className="w-8 h-8 rounded-full bg-gray-200/90 dark:bg-slate-800 shrink-0 border border-white/60 dark:border-white/10 shadow-xs animate-pulse" />
        <div className="relative max-w-[85%] sm:max-w-[70%] w-64 rounded-[20px] rounded-bl-[4px] bg-white/85 dark:bg-slate-800/85 p-3 sm:p-3.5 border border-white dark:border-white/10 shadow-xs space-y-2 animate-pulse">
          <div className="h-3 w-20 rounded bg-orange-300/60 dark:bg-orange-950/70" />
          <div className="space-y-1.5">
            <div className="h-3 w-full rounded bg-gray-200/90 dark:bg-slate-700/80" />
            <div className="h-3 w-3/4 rounded bg-gray-200/90 dark:bg-slate-700/80" />
          </div>
          <div className="h-2 w-8 ml-auto rounded bg-gray-300/60 dark:bg-slate-600/50 mt-1" />
        </div>
      </div>

      {/* 2. Right Message (Me - Orange Theme) */}
      <div className="flex items-end gap-2 sm:gap-2.5 justify-end">
        <div className="relative max-w-[80%] sm:max-w-[60%] w-56 rounded-[20px] rounded-br-[4px] bg-gradient-to-br from-orange-500/85 via-orange-500/80 to-amber-500/85 p-3 sm:p-3.5 border border-white/35 shadow-xs space-y-2 animate-pulse">
          <div className="space-y-1.5">
            <div className="h-3 w-full rounded bg-white/70" />
            <div className="h-3 w-2/3 rounded bg-white/60" />
          </div>
          <div className="h-2 w-8 ml-auto rounded bg-white/50 mt-1" />
        </div>
      </div>

      {/* 3. Left Message (Manager) */}
      <div className="flex items-end gap-2 sm:gap-2.5 justify-start">
        <div className="w-8 h-8 rounded-full bg-gray-200/90 dark:bg-slate-800 shrink-0 border border-white/60 dark:border-white/10 shadow-xs animate-pulse" />
        <div className="relative max-w-[85%] sm:max-w-[72%] w-72 rounded-[20px] rounded-bl-[4px] bg-white/85 dark:bg-slate-800/85 p-3 sm:p-3.5 border border-white dark:border-white/10 shadow-xs space-y-2 animate-pulse">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="h-3 w-24 rounded bg-orange-300/60 dark:bg-orange-950/70" />
            <div className="h-3 w-14 rounded bg-amber-200/70 dark:bg-amber-950/70" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-full rounded bg-gray-200/90 dark:bg-slate-700/80" />
            <div className="h-3 w-4/5 rounded bg-gray-200/90 dark:bg-slate-700/80" />
            <div className="h-3 w-1/2 rounded bg-gray-200/90 dark:bg-slate-700/80" />
          </div>
          <div className="h-2 w-8 ml-auto rounded bg-gray-300/60 dark:bg-slate-600/50 mt-1" />
        </div>
      </div>

      {/* 4. Right Message (Me - Short response) */}
      <div className="flex items-end gap-2 sm:gap-2.5 justify-end">
        <div className="relative max-w-[65%] sm:max-w-[45%] w-36 rounded-[20px] rounded-br-[4px] bg-gradient-to-br from-orange-500/85 via-orange-500/80 to-amber-500/85 p-3 sm:p-3.5 border border-white/35 shadow-xs space-y-1.5 animate-pulse">
          <div className="h-3 w-full rounded bg-white/70" />
          <div className="h-2 w-8 ml-auto rounded bg-white/50 mt-1" />
        </div>
      </div>

      {/* 5. Left Message (Other Member) */}
      <div className="flex items-end gap-2 sm:gap-2.5 justify-start">
        <div className="w-8 h-8 rounded-full bg-gray-200/90 dark:bg-slate-800 shrink-0 border border-white/60 dark:border-white/10 shadow-xs animate-pulse" />
        <div className="relative max-w-[80%] sm:max-w-[65%] w-56 rounded-[20px] rounded-bl-[4px] bg-white/85 dark:bg-slate-800/85 p-3 sm:p-3.5 border border-white dark:border-white/10 shadow-xs space-y-2 animate-pulse">
          <div className="h-3 w-16 rounded bg-orange-300/60 dark:bg-orange-950/70" />
          <div className="space-y-1.5">
            <div className="h-3 w-full rounded bg-gray-200/90 dark:bg-slate-700/80" />
            <div className="h-3 w-3/5 rounded bg-gray-200/90 dark:bg-slate-700/80" />
          </div>
          <div className="h-2 w-8 ml-auto rounded bg-gray-300/60 dark:bg-slate-600/50 mt-1" />
        </div>
      </div>
    </div>
  );
}

