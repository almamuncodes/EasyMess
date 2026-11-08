"use client";

import { authClient } from "@/lib/auth-client";
import { useState, useEffect, useCallback } from "react";
import { ChevronDown, Paperclip, X, ShoppingCart, Calendar } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";

export const dynamic = "force-dynamic";

function taka(n) {
  return "৳" + Number(n || 0).toLocaleString("en-BD");
}

function formatDate(d, isBn = false) {
  const dateObj = new Date(d);
  if (isBn) {
    return dateObj.toLocaleDateString("bn-BD", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  return dateObj.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function BazaarHistory() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const { lang } = useTranslation();
  const isBn = lang === "bn";

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  const [bazaars, setBazaars] = useState(() => {
    if (typeof window !== "undefined" && userId) {
      const cached = sessionStorage.getItem(`user_bazaar_${userId}_${currentMonth}_${currentYear}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          return parsed.bazaars || [];
        } catch (e) {}
      }
    }
    return [];
  });

  const [grandTotal, setGrandTotal] = useState(() => {
    if (typeof window !== "undefined" && userId) {
      const cached = sessionStorage.getItem(`user_bazaar_${userId}_${currentMonth}_${currentYear}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          return parsed.grandTotal || 0;
        } catch (e) {}
      }
    }
    return 0;
  });

  const [loading, setLoading] = useState(() => bazaars.length === 0);
  const [error, setError] = useState("");
  const [expandedIds, setExpandedIds] = useState(new Set());

  const [previewImages, setPreviewImages] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(0);

  const fetchBazaars = useCallback(() => {
    if (!userId) return;

    const key = `user_bazaar_${userId}_${month}_${year}`;

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/bazaars/user/${userId}?month=${month}&year=${year}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          if (bazaars.length === 0) setError(data.message || (isBn ? "বাজার হিস্ট্রি লোড করা যায়নি" : "Failed to load bazaar history"));
          return;
        }

        const newBazaars = data.data || [];
        const newGrandTotal = data.grandTotal || 0;

        setBazaars(newBazaars);
        setGrandTotal(newGrandTotal);
        setError("");

        if (typeof window !== "undefined") {
          sessionStorage.setItem(key, JSON.stringify({ bazaars: newBazaars, grandTotal: newGrandTotal }));
        }
      })
      .catch(() => {
        if (bazaars.length === 0) setError(isBn ? "সার্ভারে সংযোগে সমস্যা হয়েছে" : "Something went wrong. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId, month, year, bazaars.length, isBn]);

  useEffect(() => {
    fetchBazaars();
  }, [fetchBazaars]);

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#f2f4f1] dark:bg-slate-950 border-none rounded-2xl text-neutral-900 dark:text-slate-100 p-3 sm:p-6 pb-28 sm:pb-16 transition-colors">
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
              <ShoppingCart size={18} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                {isBn ? "মেস বাজার হিস্ট্রি" : "Mess Bazaar History"}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-slate-400 mt-0.5">
                {isBn ? "চলতি মাসের মেসের বাজারের তালিকা ও খরচ" : "View daily grocery expenses and items breakdown"}
              </p>
            </div>
          </div>

          {/* Month/Year Filter */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="text-xs sm:text-sm bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-700 text-neutral-800 dark:text-slate-200 rounded-xl px-3 py-1.5 outline-none font-medium shadow-xs"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1).toLocaleString(isBn ? "bn-BD" : "en", { month: "long" })}
                </option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="text-xs sm:text-sm bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-700 text-neutral-800 dark:text-slate-200 rounded-xl px-3 py-1.5 outline-none font-medium shadow-xs"
            >
              {[year - 1, year, year + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Grand Total Banner */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl px-4 py-3.5 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-xs sm:text-sm font-medium text-neutral-600 dark:text-slate-300">
              {isBn ? "মোট বাজার খরচ" : "Total Bazaar"}
              {` (${new Date(2000, month - 1).toLocaleString(isBn ? "bn-BD" : "en", { month: "long" })} ${year})`}
            </span>
          </div>
          <span className="text-lg sm:text-xl font-black text-orange-600 dark:text-orange-400 tabular-nums">
            {taka(grandTotal)}
          </span>
        </div>

        {/* States: Skeleton or Error or Empty */}
        {loading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-2xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 animate-pulse"
              />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-xl px-4 py-3 text-xs sm:text-sm bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 font-medium">
            {error}
          </div>
        )}

        {!loading && !error && bazaars.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-800 text-neutral-400 dark:text-slate-500">
            <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">
              {isBn ? "এই মাসে কোনো বাজার রেকর্ড নেই" : "No bazaar entries found for this month."}
            </p>
          </div>
        )}

        {/* Bazaar List */}
        <div className="flex flex-col gap-3">
          {bazaars.map((bazaar) => {
            const isOpen = expandedIds.has(bazaar._id);
            const hasDocs = Array.isArray(bazaar.documents) && bazaar.documents.length > 0;
            return (
              <div
                key={bazaar._id}
                className="border border-neutral-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 bg-white dark:bg-slate-900 shadow-xs transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => toggleExpand(bazaar._id)}
                    className="flex-1 min-w-0 flex items-start justify-between gap-3 text-left cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        <p className="text-sm font-bold text-neutral-900 dark:text-white">
                          {formatDate(bazaar.date, isBn)}
                        </p>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-slate-400 mt-1 truncate pl-4" title={bazaar.note || ""}>
                        {bazaar.items.length} {isBn ? "টি আইটেম" : "items"}
                        {bazaar.note ? ` · ${bazaar.note}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <p className="text-base sm:text-lg font-black text-neutral-900 dark:text-white tabular-nums">
                        {taka(bazaar.totalAmount)}
                      </p>
                      <ChevronDown
                        className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </button>
                </div>

                {/* View Voucher button if vouchers/memos attached */}
                {hasDocs && (
                  <div className="flex items-center justify-end mt-3 pt-3 border-t border-neutral-100 dark:border-slate-800">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewImages(bazaar.documents);
                        setPreviewIndex(0);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 transition cursor-pointer shadow-xs active:scale-95"
                    >
                      <Paperclip size={13} className="text-amber-500" />
                      <span>{isBn ? `মেমো দেখুন (${bazaar.documents.length})` : `View Voucher (${bazaar.documents.length})`}</span>
                    </button>
                  </div>
                )}

                {/* Expandable item details */}
                <div
                  className={`grid transition-all duration-200 ease-in-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="border-t border-neutral-100 dark:border-slate-800 pt-3 space-y-1.5">
                      {bazaar.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-baseline gap-2 text-xs sm:text-sm text-neutral-600 dark:text-slate-300"
                        >
                          <span className="font-medium whitespace-nowrap">{item.title}</span>
                          <span className="flex-1 border-b border-dotted border-neutral-300 dark:border-slate-700 mb-1" />
                          <span className="font-semibold whitespace-nowrap text-neutral-800 dark:text-slate-100">
                            {taka(item.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Lightbox / Document Viewer Modal */}
        {previewImages && previewImages.length > 0 && (
          <div
            className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => {
              setPreviewImages(null);
              setPreviewIndex(0);
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center p-2"
            >
              <button
                onClick={() => {
                  setPreviewImages(null);
                  setPreviewIndex(0);
                }}
                className="absolute -top-10 right-0 text-white hover:text-amber-400 p-2 transition cursor-pointer"
                title="Close Preview"
              >
                <X size={28} />
              </button>

              <div className="relative w-full flex items-center justify-center">
                {previewImages.length > 1 && (
                  <button
                    onClick={() =>
                      setPreviewIndex((prev) => (prev === 0 ? previewImages.length - 1 : prev - 1))
                    }
                    className="absolute left-2 z-10 p-2.5 bg-black/60 hover:bg-black text-white rounded-full transition cursor-pointer text-base font-bold shadow-lg"
                    title="Previous photo"
                  >
                    ←
                  </button>
                )}

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewImages[previewIndex]}
                  alt={`Receipt Memo ${previewIndex + 1}`}
                  className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/20"
                />

                {previewImages.length > 1 && (
                  <button
                    onClick={() =>
                      setPreviewIndex((prev) => (prev === previewImages.length - 1 ? 0 : prev + 1))
                    }
                    className="absolute right-2 z-10 p-2.5 bg-black/60 hover:bg-black text-white rounded-full transition cursor-pointer text-base font-bold shadow-lg"
                    title="Next photo"
                  >
                    →
                  </button>
                )}
              </div>

              {previewImages.length > 1 && (
                <div className="flex items-center gap-2 mt-3 bg-black/60 px-4 py-1.5 rounded-full text-white text-xs font-semibold backdrop-blur-sm">
                  <span>
                    {previewIndex + 1} / {previewImages.length}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
