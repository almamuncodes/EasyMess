"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Download, X, Share, Sparkles } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";

export default function PWAInstallPrompt() {
  const { lang } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / standalone mode
    const inStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    if (inStandaloneMode) {
      setIsStandalone(true);
      return;
    }

    // 2. Check iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Check last dismissal timestamp (2 hours cooldown)
    const lastDismissed = localStorage.getItem("pwa_prompt_dismissed");
    const twoHoursInMs = 2 * 60 * 60 * 1000; // 2 hours
    if (lastDismissed && Date.now() - parseInt(lastDismissed, 10) < twoHoursInMs) {
      return;
    }

    // 3. Listen for Chrome / Android / Desktop install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => {
        setShowPrompt(true);
      }, 1500);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    if (isIOSDevice && !inStandaloneMode) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa_prompt_dismissed", Date.now().toString());
  };

  if (isStandalone || !showPrompt) return null;

  const isBn = lang === "bn";

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-[9999] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-orange-200 dark:border-slate-800 p-4 sm:p-5 rounded-3xl shadow-2xl ring-1 ring-black/5 flex flex-col gap-3">
        {/* Header with Language Toggle & Close button */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 p-0.5 shadow-md flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex items-center justify-center overflow-hidden">
                <Image
                  src="/web-app-manifest-192x192.png"
                  alt="EasyMess Logo"
                  width={36}
                  height={36}
                  className="rounded-lg object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                {isBn ? "ইজিমেস অ্যাপ ইনস্টল করুন" : "Install EasyMess App"}
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              </h4>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 leading-tight">
                {isBn
                  ? "আপনার হোম স্ক্রিন থেকে দ্রুত মেস ও মিলের হিসাব পেতে ইনস্টল করুন"
                  : "Install to quickly access your meals & mess account"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Info Content for Android / Desktop */}
        {deferredPrompt && (
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleInstallClick}
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              {isBn ? "এখনই ইনস্টল করুন" : "Install App Now"}
            </button>
            <button
              onClick={handleDismiss}
              className="py-2.5 px-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition cursor-pointer"
            >
              {isBn ? "পরে করব" : "Maybe Later"}
            </button>
          </div>
        )}

        {/* Special Info Content for iOS Safari */}
        {isIOS && !deferredPrompt && (
          <div className="bg-orange-50 dark:bg-orange-950/40 p-3 rounded-2xl border border-orange-100 dark:border-orange-900/50 text-xs text-orange-900 dark:text-orange-200 space-y-1.5">
            <p className="font-semibold flex items-center gap-1.5">
              <Share className="w-3.5 h-3.5 text-orange-600" />
              {isBn ? "iPhone / iPad-এ ইনস্টল করতে:" : "To Install on iPhone / iPad:"}
            </p>
            <ol className="list-decimal list-inside space-y-1 text-[11px] opacity-90">
              {isBn ? (
                <>
                  <li>নিচের <span className="font-bold">Share ⎋</span> বাটনে চাপ দিন।</li>
                  <li>নিচে স্ক্রোল করে <span className="font-bold">&apos;Add to Home Screen&apos;</span> নির্বাচন করুন।</li>
                </>
              ) : (
                <>
                  <li>Tap the <span className="font-bold">Share ⎋</span> button at the bottom bar.</li>
                  <li>Scroll down & tap <span className="font-bold">&apos;Add to Home Screen&apos;</span>.</li>
                </>
              )}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
