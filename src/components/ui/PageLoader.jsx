"use client";
import React from "react";

export default function PageLoader({ text = "Loading EasyMess...", fullScreen = true }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing ring */}
        <div className="w-16 h-16 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin dark:border-slate-800 dark:border-t-orange-400" />
        
        {/* Center logo badge */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
          </div>
        </div>
      </div>

      <p className="font-mono text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-slate-400 font-medium">
        {text}
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50/80 dark:bg-slate-950/80 backdrop-blur-sm transition-all duration-300">
        {content}
      </div>
    );
  }

  return <div className="py-12 w-full flex items-center justify-center">{content}</div>;
}
