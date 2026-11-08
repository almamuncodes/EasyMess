"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { compressImage } from "@/lib/image-utils";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Paperclip,
  X,
  Eye,
  UploadCloud,
  Loader2,
  Plus,
  Trash2,
  Calendar,
  ShoppingCart,
  Sparkles,
  Check,
  Camera,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";
import { getBDNow, getBDDateStr, getBDMonthYear } from "@/lib/date-utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

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

function emptyItem() {
  return { title: "", amount: "" };
}

function todayISO() {
  return getBDDateStr();
}

function getYesterdayISO() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getBDDateStr(d);
}

// শুধুমাত্র চলতি মাসের এন্ট্রি এডিট/ডিলিট করা যাবে
function isEditable(bazaar) {
  const bdNow = getBDMonthYear();
  const bazaarMonthYear = getBDMonthYear(bazaar.date);
  return (
    bazaarMonthYear.month === bdNow.month &&
    bazaarMonthYear.year === bdNow.year
  );
}

const COMMON_ITEMS = [
  "মুরগি",
  "মাছ",
  "আলু",
  "পেঁয়াজ",
  "কাঁচাবাজার",
  "তেল",
  "মসলা",
  "ডিম",
  "চাল",
  "ডাল",
  "সবজি",
  "রসুন",
  "আদা",
  "কাঁচা মরিচ",
  "টমেটো",
  "হলুদ গুঁড়া",
  "মরিচ গুঁড়া",
  "লবণ",
  "জিরা",
  "ধনেপাতা",
  "লেবু",
  "সাবান/ডিটারজেন্ট",
 
];

export default function ManagerBazaarPage() {
  const { data: session } = authClient.useSession();
  const managerId = session?.user?.id;
  const { lang } = useTranslation();
  const isBn = lang === "bn";

  const bdNow = getBDNow();
  const currentMonth = String(bdNow.month);
  const currentYear = String(bdNow.year);

  // ডিফল্ট ফিল্টার = চলতি মাস, চলতি বছর
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  const [bazaars, setBazaars] = useState(() => {
    if (typeof window !== "undefined" && managerId) {
      const cached = sessionStorage.getItem(`manager_bazaar_${managerId}_${currentMonth}_${currentYear}`);
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
    if (typeof window !== "undefined" && managerId) {
      const cached = sessionStorage.getItem(`manager_bazaar_${managerId}_${currentMonth}_${currentYear}`);
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
  const [errorMsg, setErrorMsg] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const formRef = useRef(null);

  const fetchBazaars = useCallback(() => {
    if (!managerId) return;

    const params = new URLSearchParams({ managerId });
    if (month) params.set("month", month);
    if (year) params.set("year", year);

    fetch(`${API_BASE}/api/bazaars?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) throw new Error(data.message || "Failed to load");

        const newBazaars = data.data || [];
        const newGrandTotal = data.grandTotal || 0;

        setBazaars(newBazaars);
        setGrandTotal(newGrandTotal);
        setErrorMsg("");

        if (typeof window !== "undefined") {
          sessionStorage.setItem(
            `manager_bazaar_${managerId}_${month}_${year}`,
            JSON.stringify({ bazaars: newBazaars, grandTotal: newGrandTotal })
          );
        }
      })
      .catch((err) => {
        setErrorMsg(err.message || "Something went wrong");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [managerId, month, year]);

  useEffect(() => {
    fetchBazaars();
  }, [fetchBazaars]);

  const handleSave = async (formValues) => {
    const isEdit = Boolean(editingId);
    const url = isEdit ? `${API_BASE}/api/bazaars/${editingId}` : `${API_BASE}/api/bazaars`;
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ managerId, ...formValues }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "Failed to save");

    setEditingId(null);
    toast.success(
      isEdit
        ? isBn ? "বাজারের তথ্য সফলভাবে আপডেট হয়েছে!" : "Bazaar entry updated successfully!"
        : isBn ? "নতুন বাজার সফলভাবে যুক্ত হয়েছে!" : "Bazaar entry saved successfully!"
    );
    fetchBazaars();
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/bazaars/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setDeletingId(null);
      toast.success(isBn ? "বাজার তালিকা থেকে মুছে ফেলা হয়েছে" : "Bazaar entry deleted");
      fetchBazaars();
    } catch (err) {
      setErrorMsg(err.message);
      setDeletingId(null);
    }
  };

  const handleStartEdit = (bazaarId) => {
    setEditingId(bazaarId);
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const [previewImages, setPreviewImages] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(0);

  const editingBazaar = bazaars.find((b) => b._id === editingId) || null;
  const isFilterChanged = month !== currentMonth || year !== currentYear;

  return (
    <div className="min-h-screen bg-[#f2f4f1] dark:bg-slate-950 border-none rounded-2xl text-neutral-900 dark:text-slate-100 pb-28 sm:pb-16 transition-colors">
      <div className="max-w-3xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
                <ShoppingCart size={18} />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                {isBn ? "বাজার ব্যবস্থাপনা" : "Bazaar Management"}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-slate-400 mt-1 pl-11">
              {isBn ? "দৈনিক মেসের বাজার খরচ দ্রুত এন্ট্রি ও হিসাব রাখুন" : "Add and track daily mess bazaar seamlessly"}
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2 self-start sm:self-auto bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-xl px-3.5 py-2 shadow-xs">
            <span className="text-xs text-neutral-500 dark:text-slate-400 font-medium">
              {isBn ? "চলতি মাসের মোট:" : "This Month:"}
            </span>
            <span className="text-sm font-bold text-orange-600 dark:text-orange-400 tabular-nums">
              {taka(grandTotal)}
            </span>
          </div>
        </div>

        {errorMsg && <ErrorBanner message={errorMsg} />}

        {/* ===== Add / Edit Form ===== */}
        <div ref={formRef}>
          <BazaarForm
            key={editingId || "new"}
            initial={editingBazaar}
            isEditing={Boolean(editingId)}
            onSave={handleSave}
            onCancelEdit={() => setEditingId(null)}
            isBn={isBn}
          />
        </div>

        {/* ===== History Header & Filter ===== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-10 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-neutral-800 dark:text-slate-200">
              {isBn ? "বাজারের ইতিহাস ও খরচ" : "Bazaar History"}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-neutral-200/80 dark:bg-slate-800 text-neutral-600 dark:text-slate-400">
              {bazaars.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="text-xs sm:text-sm bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-700 rounded-xl px-3 py-1.5 outline-none font-medium text-neutral-800 dark:text-slate-200 shadow-xs"
            >
              <option value="">{isBn ? "সকল মাস" : "All months"}</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1).toLocaleString(isBn ? "bn-BD" : "en", { month: "long" })}
                </option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="text-xs sm:text-sm bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-700 rounded-xl px-3 py-1.5 outline-none font-medium text-neutral-800 dark:text-slate-200 shadow-xs"
            >
              <option value="">{isBn ? "সকল বছর" : "All years"}</option>
              {Array.from({ length: 5 }, (_, i) => Number(currentYear) - i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            {isFilterChanged && (
              <button
                onClick={() => {
                  setMonth(currentMonth);
                  setYear(currentYear);
                }}
                className="text-xs font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-1 hover:underline px-2 py-1"
              >
                <RotateCcw size={12} />
                <span>{isBn ? "রিসেট" : "Reset"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Total Banner */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl px-4 py-3.5 mb-4 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-xs sm:text-sm font-medium text-neutral-600 dark:text-slate-300">
              {isBn ? "নির্বাচিত সময়ের মোট বাজার" : "Filtered Total Bazaar"}
              {month && ` (${new Date(2000, Number(month) - 1).toLocaleString(isBn ? "bn-BD" : "en", { month: "long" })})`}
              {year && ` ${year}`}
            </span>
          </div>
          <span className="text-lg sm:text-xl font-black text-orange-600 dark:text-orange-400 tabular-nums">
            {taka(grandTotal)}
          </span>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : bazaars.length === 0 ? (
          <EmptyState isBn={isBn} />
        ) : (
          <div className="flex flex-col gap-3">
            {bazaars.map((bazaar) => (
              <BazaarHistoryCard
                key={bazaar._id}
                bazaar={bazaar}
                onEdit={() => handleStartEdit(bazaar._id)}
                onDelete={() => setDeletingId(bazaar._id)}
                onPreviewDocument={(docs) => {
                  setPreviewImages(Array.isArray(docs) ? docs : [docs]);
                  setPreviewIndex(0);
                }}
                isBn={isBn}
              />
            ))}
          </div>
        )}
      </div>

      {deletingId && (
        <ConfirmDialog
          onCancel={() => setDeletingId(null)}
          onConfirm={() => handleDelete(deletingId)}
          isBn={isBn}
        />
      )}

      {/* Lightbox / Document On-Demand Viewer Modal */}
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
  );
}

/* ============================================================
   BazaarForm — Optimized for touchscreens, mobile speed & keyboard flow
   ============================================================ */
function BazaarForm({ initial, isEditing, onSave, onCancelEdit, isBn }) {
  const [date, setDate] = useState(() => getBDDateStr(initial?.date));
  const [note, setNote] = useState(initial?.note ?? "");
  const [items, setItems] = useState(
    initial?.items?.length
      ? initial.items.map((i) => ({ title: i.title, amount: String(i.amount) }))
      : [emptyItem()]
  );
  const [documents, setDocuments] = useState(initial?.documents || []);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const titleRefs = useRef([]);
  const amountRefs = useRef([]);
  const chipsScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isChipsExpanded, setIsChipsExpanded] = useState(false);

  const checkChipsScroll = useCallback(() => {
    const el = chipsScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
  }, []);

  useEffect(() => {
    checkChipsScroll();
    const timer = setTimeout(checkChipsScroll, 300);
    window.addEventListener("resize", checkChipsScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkChipsScroll);
    };
  }, [checkChipsScroll, isChipsExpanded]);

  const scrollChips = (dir) => {
    const el = chipsScrollRef.current;
    if (!el) return;
    const distance = 280;
    el.scrollBy({ left: dir === "left" ? -distance : distance, behavior: "smooth" });
    setTimeout(checkChipsScroll, 220);
  };

  const total = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  const updateItem = (index, field, value) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addItemRow = (defaultTitle = "") => {
    setItems((prev) => [...prev, { title: defaultTitle, amount: "" }]);
    const newIdx = items.length;
    setTimeout(() => {
      if (defaultTitle) {
        amountRefs.current[newIdx]?.focus();
      } else {
        titleRefs.current[newIdx]?.focus();
      }
    }, 40);
  };

  const removeItemRow = (index) => {
    setItems((prev) => (prev.length === 1 ? [emptyItem()] : prev.filter((_, i) => i !== index)));
  };

  // Quick preset chip clicked
  const handleQuickPreset = (itemName) => {
    // If the last item has empty title, fill it; otherwise append new item
    const lastIdx = items.length - 1;
    if (lastIdx >= 0 && (!items[lastIdx].title || items[lastIdx].title.trim() === "")) {
      updateItem(lastIdx, "title", itemName);
      setTimeout(() => {
        amountRefs.current[lastIdx]?.focus();
      }, 30);
    } else {
      addItemRow(itemName);
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingDocs(true);
    setError("");

    try {
      const newDocUrls = [];
      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          toast.error(
            isBn
              ? "শুধুমাত্র ছবি (JPG, PNG, WebP) আপলোড করা যাবে"
              : "Only image files (JPG, PNG, WebP) are supported for receipt memos"
          );
          continue;
        }

        // 1. Client-Side Image Compression: Automatically resizes photos to max 1000px and 0.70 quality (~50KB-150KB)
        const compressedFile = await compressImage(file, { maxWidth: 1000, maxHeight: 1000, quality: 0.70 });

        // 2. Upload compressed image to Cloudinary (or fallback to Data URL)
        try {
          const formData = new FormData();
          formData.append("file", compressedFile);
          formData.append(
            "upload_preset",
            process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "easymess_preset"
          );
          const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "kkvshrff";

          const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: "POST",
            body: formData,
          });
          const cloudData = await cloudRes.json();
          if (cloudRes.ok && cloudData.secure_url) {
            newDocUrls.push(cloudData.secure_url);
          } else {
            const reader = new FileReader();
            const dataUrl = await new Promise((res) => {
              reader.onload = () => res(reader.result);
              reader.readAsDataURL(compressedFile);
            });
            newDocUrls.push(dataUrl);
          }
        } catch (cloudErr) {
          const reader = new FileReader();
          const dataUrl = await new Promise((res) => {
            reader.onload = () => res(reader.result);
            reader.readAsDataURL(compressedFile);
          });
          newDocUrls.push(dataUrl);
        }
      }

      setDocuments((prev) => [...prev, ...newDocUrls]);
      toast.success(
        isBn
          ? `${newDocUrls.length}টি মেমো/রসিদের ছবি যুক্ত হয়েছে`
          : `${newDocUrls.length} memo/receipt image(s) attached successfully`
      );
    } catch (err) {
      console.error("Doc upload error:", err);
      setError(isBn ? "মেমো আপলোড করতে সমস্যা হয়েছে" : "Failed to process document uploads");
    } finally {
      setUploadingDocs(false);
    }
  };

  const submit = async (e) => {
    if (e) e.preventDefault();
    const validItems = items.filter((item) => item.title.trim() !== "");

    if (validItems.length === 0) {
      setError(isBn ? "কমপক্ষে একটি পণ্যের নাম ও দাম লিখুন" : "Add at least one item");
      return;
    }
    if (validItems.some((item) => !item.amount || Number(item.amount) <= 0)) {
      setError(isBn ? "প্রতিটি পণ্যের জন্য সঠিক টাকার পরিমাণ লিখুন" : "Every item needs an amount greater than 0");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onSave({ date, note, items: validItems, documents });
      if (!isEditing) {
        setDate(todayISO());
        setNote("");
        setItems([emptyItem()]);
        setDocuments([]);
      }
    } catch (err) {
      setError(err.message || (isBn ? "সংরক্ষণ করতে ব্যর্থ হয়েছে" : "Failed to save"));
    } finally {
      setSaving(false);
    }
  };

  const isToday = date === todayISO();
  const isYesterday = date === getYesterdayISO();
  const commonList = COMMON_ITEMS;

  return (
    <form
      onSubmit={submit}
      className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-6 shadow-sm transition-all"
    >
      {/* Form Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
          <h2 className="text-sm sm:text-base font-bold text-neutral-800 dark:text-white">
            {isEditing
              ? isBn ? "বাজার এডিট করুন" : "Edit Bazaar Entry"
              : isBn ? "আজকের নতুন বাজার তুলুন" : "Add New Bazaar"}
          </h2>
        </div>
        {isEditing && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-xs font-semibold text-rose-500 hover:underline px-2 py-1"
          >
            {isBn ? "এডিট বাতিল" : "Cancel edit"}
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs sm:text-sm mb-4 px-3.5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 font-medium">
          {error}
        </p>
      )}

      {/* Date & Note Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {/* Date with quick pills */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-neutral-600 dark:text-slate-300 flex items-center gap-1">
              <Calendar size={13} className="text-orange-500" />
              <span>{isBn ? "বাজারের তারিখ" : "Date"}</span>
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setDate(todayISO())}
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-md transition ${
                  isToday
                    ? "bg-orange-500 text-white"
                    : "bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-400 hover:bg-neutral-200"
                }`}
              >
                {isBn ? "আজ" : "Today"}
              </button>
              <button
                type="button"
                onClick={() => setDate(getYesterdayISO())}
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-md transition ${
                  isYesterday
                    ? "bg-orange-500 text-white"
                    : "bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-400 hover:bg-neutral-200"
                }`}
              >
                {isBn ? "গতকাল" : "Yesterday"}
              </button>
            </div>
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-slate-700 bg-neutral-50/70 dark:bg-slate-800/70 text-neutral-800 dark:text-slate-100 outline-none text-xs sm:text-sm font-medium focus:border-orange-500"
          />
        </div>

        {/* Note / Market Name */}
        <div>
          <label className="block text-xs font-bold text-neutral-600 dark:text-slate-300 mb-1.5">
            {isBn ? "নোট / বাজারের নাম (ঐচ্ছিক)" : "Note (optional)"}
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                titleRefs.current[0]?.focus();
                titleRefs.current[0]?.select?.();
              }
            }}
            enterKeyHint="next"
            placeholder={isBn ? "যেমন: সকালের বাজার, সুপারশপ ইত্যাদি" : "e.g. Weekly bazaar, Supermarket"}
            className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-slate-700 bg-neutral-50/70 dark:bg-slate-800/70 text-neutral-800 dark:text-slate-100 outline-none text-xs sm:text-sm font-medium focus:border-orange-500"
          />
        </div>
      </div>

      {/* Quick Common Items Presets */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-slate-400">
              {isBn ? "দ্রুত আইটেম নির্বাচন (১-ট্যাপে যোগ করুন):" : "Quick Items (1-Tap Add):"}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Scroll navigation arrows for PC & tablets */}
            {!isChipsExpanded && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => scrollChips("left")}
                  disabled={!canScrollLeft}
                  className="w-6 h-6 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-neutral-600 dark:text-slate-300 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition shadow-2xs cursor-pointer"
                  title="Scroll Left"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollChips("right")}
                  disabled={!canScrollRight}
                  className="w-6 h-6 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-neutral-600 dark:text-slate-300 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition shadow-2xs cursor-pointer"
                  title="Scroll Right"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}

            {/* Expand / Collapse toggle so PC users can view all at once */}
            <button
              type="button"
              onClick={() => setIsChipsExpanded((prev) => !prev)}
              className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline px-2 py-0.5 rounded-md hover:bg-orange-50 dark:hover:bg-orange-950/30 transition cursor-pointer"
            >
              {isChipsExpanded
                ? isBn ? "সংক্ষিপ্ত করুন" : "Collapse"
                : isBn ? "সবগুলো দেখুন" : "Show All"}
            </button>
          </div>
        </div>

        {/* Chips container with mouse wheel & drag support */}
        <div className="relative">
          <div
            ref={chipsScrollRef}
            onScroll={checkChipsScroll}
            onWheel={(e) => {
              if (!isChipsExpanded && chipsScrollRef.current) {
                if (e.deltaY !== 0) {
                  chipsScrollRef.current.scrollLeft += e.deltaY;
                  checkChipsScroll();
                }
              }
            }}
            style={{ scrollbarWidth: "thin", scrollbarColor: "#fb923c transparent" }}
            className={
              isChipsExpanded
                ? "flex flex-wrap gap-1.5 py-1"
                : "grid grid-rows-2 grid-flow-col auto-cols-max gap-1.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent touch-pan-x"
            }
          >
            {commonList.map((cItem) => (
              <button
                key={cItem}
                type="button"
                onClick={() => handleQuickPreset(cItem)}
                className="shrink-0 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200/80 dark:border-orange-900/50 transition active:scale-95 cursor-pointer shadow-2xs whitespace-nowrap"
              >
                + {cItem}
              </button>
            ))}
          </div>

          {/* Floating Right Scroll Hint on PC */}
          {!isChipsExpanded && canScrollRight && (
            <div className="hidden sm:flex absolute right-0 top-0 bottom-2 w-10 bg-gradient-to-l from-white dark:from-slate-900 to-transparent pointer-events-none items-center justify-end pr-0.5">
              <button
                type="button"
                onClick={() => scrollChips("right")}
                className="pointer-events-auto w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 shadow-md text-neutral-600 dark:text-slate-300 hover:text-orange-600 flex items-center justify-center transition cursor-pointer"
                title="Scroll Right"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          )}

          {/* Floating Left Scroll Hint on PC */}
          {!isChipsExpanded && canScrollLeft && (
            <div className="hidden sm:flex absolute left-0 top-0 bottom-2 w-10 bg-gradient-to-r from-white dark:from-slate-900 to-transparent pointer-events-none items-center justify-start pl-0.5">
              <button
                type="button"
                onClick={() => scrollChips("left")}
                className="pointer-events-auto w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 shadow-md text-neutral-600 dark:text-slate-300 hover:text-orange-600 flex items-center justify-center transition cursor-pointer"
                title="Scroll Left"
              >
                <ChevronLeft size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Items Section Header */}
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold text-neutral-700 dark:text-slate-200">
          {isBn ? "বাজারের পণ্যের তালিকা" : "Items & Expenses"}
        </label>
        <span className="text-[11px] text-neutral-400 dark:text-slate-500">
          {isBn ? "Enter চাপলে পরের ঘরে যাবে" : "Press Enter to advance"}
        </span>
      </div>

      {/* Items List - Single row per item on ALL screen sizes */}
      <div className="flex flex-col gap-2 mb-3">
        {items.map((item, index) => (
          <ItemRow
            key={index}
            index={index}
            item={item}
            canRemove={items.length > 1}
            itemsLength={items.length}
            onChangeTitle={(value) => updateItem(index, "title", value)}
            onChangeAmount={(value) => updateItem(index, "amount", value)}
            onRemove={() => removeItemRow(index)}
            onAddNext={() => addItemRow()}
            onFocusNextTitle={(nextIdx) => {
              if (titleRefs.current[nextIdx]) {
                titleRefs.current[nextIdx]?.focus();
                titleRefs.current[nextIdx]?.select?.();
              }
            }}
            titleRef={(el) => (titleRefs.current[index] = el)}
            amountRef={(el) => (amountRefs.current[index] = el)}
            isBn={isBn}
          />
        ))}
      </div>

      {/* Add Item Button */}
      <button
        type="button"
        onClick={() => addItemRow()}
        className="w-full py-2.5 sm:py-3 border-2 border-dashed border-orange-200 dark:border-orange-900/50 hover:border-orange-400 dark:hover:border-orange-500 rounded-xl text-orange-600 dark:text-orange-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 bg-orange-50/40 dark:bg-orange-950/20 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition active:scale-[0.99] cursor-pointer mb-5"
      >
        <Plus size={16} />
        <span>{isBn ? "+ আরো আইটেম যোগ করুন" : "+ Add Another Item"}</span>
      </button>

      {/* Attach Receipts & Memos */}
      <div className="mb-5 pt-3.5 border-t border-neutral-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-bold text-neutral-700 dark:text-slate-300 flex items-center gap-1.5">
            <Paperclip size={14} className="text-orange-500" />
            <span>{isBn ? "রসিদ / মেমোর ছবি সংযুক্ত করুন (ঐচ্ছিক)" : "Receipt Memos / Vouchers (Optional)"}</span>
          </label>
          <span className="text-[10px] text-neutral-400 dark:text-slate-500 font-medium">
            {isBn ? "অটো কম্প্রেশন (<১৫০KB)" : "Auto compressed"}
          </span>
        </div>

        <div className="flex flex-wrap gap-2.5 items-center">
          {documents.map((docUrl, idx) => (
            <div
              key={idx}
              className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-neutral-300 dark:border-slate-700 shadow-xs group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={docUrl} alt={`Receipt ${idx + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setDocuments(documents.filter((_, i) => i !== idx))}
                className="absolute top-1 right-1 bg-black/75 hover:bg-rose-600 text-white rounded-full p-1 transition cursor-pointer"
                title="Remove image"
              >
                <X size={12} />
              </button>
            </div>
          ))}

          <label className="h-16 sm:h-20 px-3.5 rounded-xl border-2 border-dashed border-neutral-300 dark:border-slate-700 hover:border-orange-500 dark:hover:border-orange-500 flex items-center justify-center gap-2 text-neutral-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition cursor-pointer bg-neutral-50 dark:bg-slate-800/50">
            {uploadingDocs ? (
              <>
                <Loader2 size={18} className="animate-spin text-orange-500" />
                <span className="text-xs font-semibold">{isBn ? "প্রসেস হচ্ছে..." : "Processing..."}</span>
              </>
            ) : (
              <>
                <Camera size={18} className="text-orange-500" />
                <span className="text-xs font-bold">
                  {isBn ? "+ ছবি তুলুন / আপলোড" : "+ Take/Upload Photo"}
                </span>
              </>
            )}
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploadingDocs}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Bottom Summary & Submit Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-neutral-200 dark:border-slate-800">
        <div className="flex items-center justify-between sm:justify-start gap-4 bg-orange-50/60 dark:bg-slate-800/80 px-4 py-2.5 rounded-xl border border-orange-200/60 dark:border-slate-700">
          <div>
            <p className="text-[11px] font-semibold text-neutral-500 dark:text-slate-400">
              {isBn
                ? `মোট খরচ (${items.filter((i) => i.title.trim()).length} টি আইটেম)`
                : `Total (${items.filter((i) => i.title.trim()).length} items)`}
            </p>
            <p className="text-xl sm:text-2xl font-black text-orange-600 dark:text-orange-400 tabular-nums tracking-tight">
              {taka(total)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditing && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="flex-1 sm:flex-initial px-4 py-3 rounded-xl text-xs sm:text-sm font-bold text-neutral-600 dark:text-slate-300 bg-neutral-100 dark:bg-slate-800 hover:bg-neutral-200 dark:hover:bg-slate-700 transition"
            >
              {isBn ? "বাতিল" : "Cancel"}
            </button>
          )}

          <button
            type="submit"
            disabled={saving || uploadingDocs}
            className="flex-1 sm:flex-initial px-6 py-3 rounded-xl text-sm sm:text-base font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer min-h-[46px]"
          >
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>{isBn ? "সংরক্ষণ হচ্ছে..." : "Saving..."}</span>
              </>
            ) : (
              <>
                <Check size={18} />
                <span>
                  {isEditing
                    ? isBn ? "বাজার আপডেট করুন" : "Update Bazaar"
                    : isBn ? "বাজার সেভ করুন" : "Save Bazaar"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

/* ============================================================
   ItemRow — Single Row on Mobile & Desktop with Quick Navigation
   ============================================================ */
function ItemRow({
  item,
  index,
  canRemove,
  itemsLength,
  onChangeTitle,
  onChangeAmount,
  onRemove,
  onAddNext,
  onFocusNextTitle,
  titleRef,
  amountRef,
  isBn,
}) {
  const localAmountInputRef = useRef(null);

  const focusAmountInput = () => {
    if (localAmountInputRef.current) {
      localAmountInputRef.current.focus();
      localAmountInputRef.current.select?.();
    }
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2.5 bg-neutral-50 dark:bg-slate-850 border border-neutral-200 dark:border-slate-800 rounded-xl p-1.5 sm:p-2 transition-all focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/10">
      {/* Index Badge */}
      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-orange-100/70 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 font-bold text-[10px] sm:text-xs flex items-center justify-center shrink-0">
        {index + 1}
      </div>

      {/* Item Title Input */}
      <input
        ref={(el) => {
          if (typeof titleRef === "function") titleRef(el);
        }}
        value={item.title}
        onChange={(e) => onChangeTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            focusAmountInput();
          }
        }}
        enterKeyHint="next"
        placeholder={isBn ? "পণ্যের নাম (যেমন: মুরগি, আলু)" : "Item name (যেমন: মুরগি, আলু)"}
        className="flex-1 min-w-0 bg-transparent px-1.5 sm:px-2 py-1 text-xs sm:text-sm text-neutral-800 dark:text-slate-100 placeholder:text-neutral-400 dark:placeholder:text-slate-500 outline-none font-medium"
      />

      {/* Amount Input with ৳ sign and numeric keypad */}
      <div className="relative w-20 sm:w-32 shrink-0">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400 dark:text-slate-500 pointer-events-none">
          ৳
        </span>
        <input
          ref={(el) => {
            localAmountInputRef.current = el;
            if (typeof amountRef === "function") amountRef(el);
          }}
          type="number"
          inputMode="decimal"
          value={item.amount}
          onChange={(e) => onChangeAmount(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (index < itemsLength - 1) {
                onFocusNextTitle?.(index + 1);
              } else {
                onAddNext?.();
              }
            }
          }}
          enterKeyHint="next"
          placeholder="0"
          className="w-full bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded-lg pl-5 sm:pl-6 pr-2 py-1 text-xs sm:text-sm font-bold text-neutral-900 dark:text-white tabular-nums outline-none focus:border-orange-500"
        />
      </div>

      {/* Remove Button */}
      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 flex items-center justify-center rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition disabled:opacity-20 cursor-pointer"
        title={isBn ? "আইটেম মুছুন" : "Remove item"}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

/* ============================================================
   BazaarHistoryCard — Touch-Friendly & Expandable
   ============================================================ */
function BazaarHistoryCard({ bazaar, onEdit, onDelete, onPreviewDocument, isBn }) {
  const [isOpen, setIsOpen] = useState(false);
  const editable = isEditable(bazaar);
  const hasDocs = Array.isArray(bazaar.documents) && bazaar.documents.length > 0;

  return (
    <div className="border border-neutral-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 bg-white dark:bg-slate-900 shadow-xs transition-all">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
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
              <span className="text-[16px] text-black text-900">{bazaar.note ? ` · ${bazaar.note}` : ""}</span>
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

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-neutral-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          {editable ? (
            <>
              <button
                onClick={onEdit}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-neutral-700 dark:text-slate-200 bg-neutral-100 hover:bg-neutral-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                {isBn ? "এডিট" : "Edit"}
              </button>
              <button
                onClick={onDelete}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 transition cursor-pointer"
              >
                {isBn ? "মুছুন" : "Delete"}
              </button>
            </>
          ) : (
            <span className="text-[11px] text-neutral-400 dark:text-slate-500 font-medium">
              🔒 {isBn ? "লক (পূর্ববর্তী মাস)" : "Locked (past month)"}
            </span>
          )}
        </div>

        {hasDocs && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreviewDocument && onPreviewDocument(bazaar.documents);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 transition cursor-pointer shadow-xs active:scale-95"
          >
            <Paperclip size={13} className="text-amber-500" />
            <span>{isBn ? `মেমো (${bazaar.documents.length})` : `Voucher (${bazaar.documents.length})`}</span>
          </button>
        )}
      </div>

      {/* Expandable item list */}
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
}

function ConfirmDialog({ onCancel, onConfirm, isBn }) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xs rounded-2xl p-6 text-center bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 shadow-xl"
      >
        <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-500 mx-auto flex items-center justify-center mb-3">
          <Trash2 size={24} />
        </div>
        <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-1">
          {isBn ? "মুছে ফেলতে চান?" : "Delete Entry?"}
        </h3>
        <p className="text-xs text-neutral-500 dark:text-slate-400 mb-5">
          {isBn
            ? "এই বাজার এন্ট্রিটি স্থায়ীভাবে মুছে যাবে। এটি আর ফিরিয়ে আনা যাবে না।"
            : "This bazaar entry will be deleted permanently. It cannot be recovered."}
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-neutral-100 dark:bg-slate-800 text-neutral-700 dark:text-slate-300 hover:bg-neutral-200 cursor-pointer"
          >
            {isBn ? "বাতিল" : "Cancel"}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20 cursor-pointer"
          >
            {isBn ? "মুছে ফেলুন" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ErrorBanner({ message }) {
  return (
    <div className="rounded-xl px-4 py-3 text-xs sm:text-sm mb-4 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 font-medium">
      {message}
    </div>
  );
}

function EmptyState({ isBn }) {
  return (
    <div className="text-center py-16 text-neutral-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-800">
      <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
      <p className="text-sm font-medium">
        {isBn ? "কোনো বাজার এন্ট্রি পাওয়া যায়নি" : "No bazaar entries yet"}
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-20 rounded-2xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 animate-pulse"
        />
      ))}
    </div>
  );
}
