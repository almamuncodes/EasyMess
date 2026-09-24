"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { MessageSquare, ShieldCheck, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/useTranslation";

export default function WhatsAppRequiredModal() {
  const pathname = usePathname();
  const router = useRouter();
  const { lang } = useTranslation();
  const isBn = lang === "bn";

  const { data: session, isPending: isSessionLoading } = authClient.useSession();
  const [savedNumber, setSavedNumber] = useState(null);
  const [dbHasNumber, setDbHasNumber] = useState(null); // null = pending check, true = exists, false = missing
  const [phoneNumber, setPhoneNumber] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if current route should bypass modal (e.g. auth pages)
  const isAuthPage = pathname === "/signin" || pathname === "/signup";
  const userHasWhatsApp = Boolean(session?.user?.whatsappNumber || savedNumber);

  useEffect(() => {
    let isCancelled = false;

    // Skip DB check if session already has number, no user, or on auth pages
    if (isSessionLoading || !session?.user?.id || isAuthPage || session?.user?.whatsappNumber) {
      return;
    }

    async function checkDb() {
      try {
        const res = await fetch("/api/user/whatsapp");
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled) {
            setDbHasNumber(Boolean(data.whatsappNumber));
          }
        } else if (!isCancelled) {
          setDbHasNumber(false);
        }
      } catch (err) {
        if (!isCancelled) {
          setDbHasNumber(false);
        }
      }
    }

    checkDb();

    return () => {
      isCancelled = true;
    };
  }, [isSessionLoading, session?.user?.id, session?.user?.whatsappNumber, isAuthPage]);

  // Determine if modal should be shown
  const isOpen = !isAuthPage && !isSessionLoading && !!session?.user && !userHasWhatsApp && dbHasNumber === false;

  if (!isOpen) {
    return null;
  }

  const handlePhoneChange = (e) => {
    let val = e.target.value;
    // Allow only digits
    val = val.replace(/\D/g, "");

    // If starts with 880, strip it
    if (val.startsWith("880")) {
      val = val.substring(3);
    }
    // If starts with leading 0, strip it (since +880 already has 0)
    if (val.startsWith("0")) {
      val = val.substring(1);
    }

    // Limit to max 10 digits
    val = val.slice(0, 10);

    setPhoneNumber(val);
    setErrorMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    let cleaned = phoneNumber.trim().replace(/\D/g, "");
    if (cleaned.startsWith("880")) cleaned = cleaned.substring(3);
    if (cleaned.startsWith("0")) cleaned = cleaned.substring(1);

    // Must be 10 digits starting with 1 (e.g. 1994810914)
    const bdRegex = /^1[3-9]\d{8}$/;
    if (!bdRegex.test(cleaned)) {
      setErrorMsg(
        isBn
          ? "সঠিক ১০ ডিজিটের মোবাইল নাম্বার দিন (যেমন: 1994810914)"
          : "Please enter a valid 10-digit number (e.g. 1994810914)"
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/user/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsappNumber: `+880${cleaned}`,
          userId: session.user.id,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(
          isBn
            ? "হোয়াটসঅ্যাপ নাম্বার সফলভাবে যুক্ত হয়েছে!"
            : "WhatsApp number saved successfully!"
        );
        setSavedNumber(data.whatsappNumber || cleaned);
        setDbHasNumber(true);
        // Soft refresh to update session across the app
        router.refresh();
      } else {
        setErrorMsg(data.message || (isBn ? "সংরক্ষণ করা যায়নি" : "Failed to save number"));
      }
    } catch (err) {
      setErrorMsg(isBn ? "সার্ভারে সমস্যা হয়েছে, আবার চেষ্টা করুন" : "Server error, please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 transition-all"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-orange-500/20 bg-white p-6 shadow-2xl dark:border-orange-500/15 dark:bg-slate-900 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Glow accent */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-orange-500/15 blur-2xl dark:bg-orange-500/20" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-36 w-36 rounded-full bg-amber-500/10 blur-2xl" />

        {/* Header Icon */}
        <div className="relative mb-5 flex items-center gap-3">
          <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30 ring-4 ring-[#25D366]/10">
            {/* WhatsApp / Chat SVG */}
            <svg
              className="h-7 w-7 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm.01 1.67c4.54 0 8.24 3.7 8.24 8.24 0 2.2-.86 4.27-2.42 5.82a8.19 8.19 0 01-5.82 2.41c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 01-1.25-4.37c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.64c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.24-.75-.67-1.25-1.49-1.4-1.74-.14-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.11-.23-.17-.48-.3z" />
            </svg>
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 border border-orange-200/80 px-2.5 py-0.5 text-xs font-semibold text-orange-600 dark:bg-orange-950/50 dark:border-orange-800/50 dark:text-orange-400">
              <ShieldCheck className="h-3.5 w-3.5 text-orange-500" />
              {isBn ? "প্রোফাইল সম্পূর্ণ করুন" : "Action Required"}
            </span>
            <h2 className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
              {isBn ? "WhatsApp নাম্বার প্রয়োজন" : "WhatsApp Number Required"}
            </h2>
          </div>
        </div>

        {/* Description */}
        <p className="mb-6 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {isBn
            ? "মেসের মিল অন/অফ নোটিফিকেশন, বাজার অ্যালার্ট এবং ম্যানেজারের সাথে দ্রুত যোগাযোগের জন্য আপনার হোয়াটসঅ্যাপ নাম্বারটি দেওয়া বাধ্যতামূলক।"
            : "To receive daily meal status alerts, bazaar updates, and essential manager notices, providing your WhatsApp number is mandatory."}
        </p>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {isBn ? "হোয়াটসঅ্যাপ মোবাইল নাম্বার" : "WhatsApp Phone Number"}
            </label>
            <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50 shadow-sm focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 dark:border-slate-700 dark:bg-slate-800/80">
              {/* Country Badge */}
              <div className="flex select-none items-center gap-1.5 border-r border-slate-200 py-3 pl-3 pr-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
                <span className="text-base" role="img" aria-label="Bangladesh">🇧🇩</span>
                <span>+880</span>
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="1994810914"
                autoFocus
                maxLength={10}
                className="w-full bg-transparent px-3 py-3 text-base font-medium text-slate-900 placeholder-slate-400 focus:outline-none dark:text-white dark:placeholder-slate-500"
              />
            </div>
            {errorMsg && (
              <p className="mt-1.5 text-xs font-medium text-red-500 dark:text-red-400">
                {errorMsg}
              </p>
            )}
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              {isBn
                ? "উদাহরণ: 1994810914 (১০ ডিজিট)"
                : "Example: 1994810914 (10 digits)"}
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || phoneNumber.trim().length === 0}
            className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:shadow-orange-500/35 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{isBn ? "সংরক্ষণ করা হচ্ছে..." : "Saving..."}</span>
              </>
            ) : (
              <>
                <span>{isBn ? "সেভ করুন এবং এগিয়ে যান" : "Save and Continue"}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-6 flex items-center justify-center border-t border-slate-100 pt-4 dark:border-slate-800">
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {isBn ? "🔒 তথ্য মেস নিরাপত্তার জন্য সংরক্ষিত" : "🔒 Encrypted & Secure"}
          </span>
        </div>

      </div>
    </div>
  );
}
