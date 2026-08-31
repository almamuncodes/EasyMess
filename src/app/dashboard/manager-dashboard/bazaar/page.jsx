"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { GetUser } from "@/components/action/action";
import { toast } from "sonner";
import { compressImage } from "@/lib/image-utils";
import { ChevronDown, Paperclip, X, Eye, UploadCloud, Loader2 } from "lucide-react";

import { getBDNow, getBDDateStr, getBDMonthYear } from "@/lib/date-utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

function taka(n) {
  return "৳" + Number(n || 0).toLocaleString("en-BD");
}

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-GB", {
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

// শুধুমাত্র চলতি মাসের এন্ট্রি এডিট/ডিলিট করা যাবে
function isEditable(bazaar) {
  const bdNow = getBDMonthYear();
  const bazaarMonthYear = getBDMonthYear(bazaar.date);
  return (
    bazaarMonthYear.month === bdNow.month &&
    bazaarMonthYear.year === bdNow.year
  );
}

export default function ManagerBazaarPage() {
  const user = GetUser();
  const managerId = user?.user?.id;

  const bdNow = getBDNow();
  const currentMonth = String(bdNow.month);
  const currentYear = String(bdNow.year);

  // ডিফল্ট ফিল্টার = চলতি মাস, চলতি বছর
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  const cacheKey = `manager_bazaar_${managerId}_${month}_${year}`;

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

  const load = useCallback(async () => {
    if (!managerId) return;

    const key = `manager_bazaar_${managerId}_${month}_${year}`;
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem(key);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setBazaars(parsed.bazaars || []);
          setGrandTotal(parsed.grandTotal || 0);
        } catch (e) {}
      } else {
        if (bazaars.length === 0) setLoading(true);
      }
    }

    setErrorMsg("");
    try {
      const params = new URLSearchParams({ managerId });
      if (month) params.set("month", month);
      if (year) params.set("year", year);

      const res = await fetch(`${API_BASE}/api/bazaars?${params.toString()}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to load");

      const newBazaars = data.data || [];
      const newGrandTotal = data.grandTotal || 0;

      setBazaars(newBazaars);
      setGrandTotal(newGrandTotal);

      if (typeof window !== "undefined") {
        sessionStorage.setItem(key, JSON.stringify({ bazaars: newBazaars, grandTotal: newGrandTotal }));
      }
    } catch (err) {
      if (bazaars.length === 0) setErrorMsg(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [managerId, month, year]);

  useEffect(() => {
    load();
  }, [load]);

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
    load();
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
      load();
    } catch (err) {
      setErrorMsg(err.message);
      setDeletingId(null);
    }
  };

  const [previewImages, setPreviewImages] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(0);

  const editingBazaar = bazaars.find((b) => b._id === editingId) || null;
  const isFilterChanged = month !== currentMonth || year !== currentYear;

  return (
    <div className="min-h-screen bg-[#f2f4f1] border-none rounded-2xl text-neutral-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <h1 className="text-2xl font-semibold mb-1">Bazaar Management</h1>
        <p className="text-sm text-neutral-500 mb-8">Add and track daily mess bazaar</p>

        {errorMsg && <ErrorBanner message={errorMsg} />}

        {/* ===== Add / Edit Form ===== */}
        <BazaarForm
          key={editingId || "new"}
          initial={editingBazaar}
          isEditing={Boolean(editingId)}
          onSave={handleSave}
          onCancelEdit={() => setEditingId(null)}
        />

        {/* ===== History ===== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-12 mb-4">
          <h2 className="text-sm font-medium text-neutral-500">History</h2>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="text-sm border border-neutral-300 rounded-lg px-2 py-1.5 outline-none"
            >
              <option value="">All months</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1).toLocaleString("en", { month: "long" })}
                </option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="text-sm border border-neutral-300 rounded-lg px-2 py-1.5 outline-none"
            >
              <option value="">All years</option>
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
                className="text-sm text-neutral-500"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border border-neutral-300 rounded-lg px-4 py-3 mb-4">
          <span className="text-sm text-neutral-500">
            Total
            {month && ` ${new Date(2000, Number(month) - 1).toLocaleString("en", { month: "long" })}`}
            {year && ` ${year}`}
            {!month && !year && " (all time)"}
          </span>
          <span className="text-lg font-semibold tabular-nums">{taka(grandTotal)}</span>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : bazaars.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-3">
            {bazaars.map((bazaar) => (
              <BazaarHistoryCard
                key={bazaar._id}
                bazaar={bazaar}
                onEdit={() => setEditingId(bazaar._id)}
                onDelete={() => setDeletingId(bazaar._id)}
                onPreviewDocument={(docs) => {
                  setPreviewImages(Array.isArray(docs) ? docs : [docs]);
                  setPreviewIndex(0);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {deletingId && (
        <ConfirmDialog onCancel={() => setDeletingId(null)} onConfirm={() => handleDelete(deletingId)} />
      )}

      {/* Lightbox / Document On-Demand Viewer Modal */}
      {previewImages && previewImages.length > 0 && (
        <div
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => { setPreviewImages(null); setPreviewIndex(0); }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center p-2"
          >
            <button
              onClick={() => { setPreviewImages(null); setPreviewIndex(0); }}
              className="absolute -top-10 right-0 text-white hover:text-amber-400 p-2 transition cursor-pointer"
              title="Close Preview"
            >
              <X size={28} />
            </button>

            <div className="relative w-full flex items-center justify-center">
              {previewImages.length > 1 && (
                <button
                  onClick={() => setPreviewIndex((prev) => (prev === 0 ? previewImages.length - 1 : prev - 1))}
                  className="absolute left-2 z-10 p-2.5 bg-black/60 hover:bg-black text-white rounded-full transition cursor-pointer text-base font-bold shadow-lg"
                  title="Previous photo"
                >
                  ←
                </button>
              )}

              <img
                src={previewImages[previewIndex]}
                alt={`Receipt Memo ${previewIndex + 1}`}
                className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/20"
              />

              {previewImages.length > 1 && (
                <button
                  onClick={() => setPreviewIndex((prev) => (prev === previewImages.length - 1 ? 0 : prev + 1))}
                  className="absolute right-2 z-10 p-2.5 bg-black/60 hover:bg-black text-white rounded-full transition cursor-pointer text-base font-bold shadow-lg"
                  title="Next photo"
                >
                  →
                </button>
              )}
            </div>

            {previewImages.length > 1 && (
              <div className="flex items-center gap-2 mt-3 bg-black/60 px-4 py-1.5 rounded-full text-white text-xs font-semibold backdrop-blur-sm">
                <span>{previewIndex + 1} / {previewImages.length}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   BazaarForm — used for both Add and Edit (same UI, different mode)
   Props: initial (bazaar object or null), isEditing (boolean),
          onSave (function), onCancelEdit (function)
   ============================================================ */
function BazaarForm({ initial, isEditing, onSave, onCancelEdit }) {
  const [date, setDate] = useState(() => getBDDateStr(initial?.date));
  const [note, setNote] = useState(initial?.note ?? "");
  const [items, setItems] = useState(
    initial?.items?.length ? initial.items.map((i) => ({ title: i.title, amount: String(i.amount) })) : [emptyItem()]
  );
  const [documents, setDocuments] = useState(initial?.documents || []);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const total = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  const updateItem = (index, field, value) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addItemRow = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItemRow = (index) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
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
          toast.error("Only image files (JPG, PNG, WebP) are supported for receipt memos");
          continue;
        }

        // 1. Client-Side Image Compression: Automatically resizes 5MB-50MB photos down to max 1000px and 0.70 quality (~50KB-150KB)
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
            // Fallback: Convert compressed file to Data URL
            const reader = new FileReader();
            const dataUrl = await new Promise((res) => {
              reader.onload = () => res(reader.result);
              reader.readAsDataURL(compressedFile);
            });
            newDocUrls.push(dataUrl);
          }
        } catch (cloudErr) {
          // Fallback: Convert compressed file to Data URL
          const reader = new FileReader();
          const dataUrl = await new Promise((res) => {
            reader.onload = () => res(reader.result);
            reader.readAsDataURL(compressedFile);
          });
          newDocUrls.push(dataUrl);
        }
      }

      setDocuments((prev) => [...prev, ...newDocUrls]);
      toast.success(`${newDocUrls.length} memo/receipt image(s) processed & compressed successfully!`);
    } catch (err) {
      console.error("Doc upload error:", err);
      setError("Failed to process document uploads");
    } finally {
      setUploadingDocs(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const validItems = items.filter((item) => item.title.trim() !== "");

    if (validItems.length === 0) {
      setError("Add at least one item");
      return;
    }
    if (validItems.some((item) => !item.amount || Number(item.amount) <= 0)) {
      setError("Every item needs an amount greater than 0");
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
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="border border-neutral-300 rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium">{isEditing ? "Edit Bazaar" : "Add New Bazaar"}</h2>
        {isEditing && (
          <button type="button" onClick={onCancelEdit} className="text-xs text-neutral-500 underline">
            Cancel edit
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm mb-4 px-3 py-2 rounded-lg bg-rose-50 text-rose-600">{error}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-neutral-300 outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">Note (optional)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Weekly bazaar"
            className="w-full px-3 py-2 rounded-lg border border-neutral-300 outline-none text-sm"
          />
        </div>
      </div>

      <label className="block text-xs font-medium text-neutral-500 mb-2">Items</label>
      <div className="flex flex-col gap-2 mb-3">
        {items.map((item, index) => (
          <ItemRow
            key={index}
            item={item}
            canRemove={items.length > 1}
            onChangeTitle={(value) => updateItem(index, "title", value)}
            onChangeAmount={(value) => updateItem(index, "amount", value)}
            onRemove={() => removeItemRow(index)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addItemRow}
        className="text-sm font-medium text-neutral-700 border border-dashed border-neutral-300 rounded-lg w-full py-2 mb-5 hover:bg-neutral-50"
      >
        + Add Item
      </button>

      {/* Attach Receipts & Memos */}
      <div className="mb-5 pt-4 border-t border-neutral-200">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
            <Paperclip size={14} className="text-amber-500" />
            <span>Attach Receipt Memos / Vouchers (Optional)</span>
          </label>
          <span className="text-[11px] text-neutral-400">Compressed automatically (&lt;150KB)</span>
        </div>

        <div className="flex flex-wrap gap-2.5 items-center">
          {documents.map((docUrl, idx) => (
            <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-neutral-300 shadow-sm group">
              <img src={docUrl} alt={`Receipt ${idx + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setDocuments(documents.filter((_, i) => i !== idx))}
                className="absolute top-1 right-1 bg-black/70 hover:bg-rose-600 text-white rounded-full p-1 transition cursor-pointer"
                title="Remove image"
              >
                <X size={11} />
              </button>
            </div>
          ))}

          <label className="w-16 h-16 rounded-xl border-2 border-dashed border-neutral-300 hover:border-amber-500 flex flex-col items-center justify-center text-neutral-400 hover:text-amber-600 transition cursor-pointer bg-white">
            {uploadingDocs ? (
              <Loader2 size={18} className="animate-spin text-amber-500" />
            ) : (
              <>
                <UploadCloud size={18} />
                <span className="text-[9px] font-bold mt-1">+ Photo</span>
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

      <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
        <div>
          <p className="text-xs text-neutral-500">Total</p>
          <p className="text-xl font-semibold tabular-nums">{taka(total)}</p>
        </div>
        <button
          type="submit"
          disabled={saving || uploadingDocs}
          className="px-5 py-2.5 rounded-lg text-sm font-medium bg-[#ff6900] text-white disabled:opacity-60 cursor-pointer shadow-sm"
        >
          {saving ? "Saving..." : isEditing ? "Update Bazaar" : "Save Bazaar"}
        </button>
      </div>
    </form>
  );
}


function ItemRow({ item, canRemove, onChangeTitle, onChangeAmount, onRemove }) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <input
        value={item.title}
        onChange={(e) => onChangeTitle(e.target.value)}
        placeholder="Item name"
        className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-neutral-300 outline-none text-sm"
      />
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={item.amount}
          onChange={(e) => onChangeAmount(e.target.value)}
          placeholder="Amount"
          className="flex-1 sm:w-28 min-w-0 px-3 py-2 rounded-lg border border-neutral-300 outline-none text-sm tabular-nums"
        />
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 disabled:opacity-30"
          title="Remove item"
        >
          ✕
        </button>
      </div>
    </div>
  );
}


function BazaarHistoryCard({ bazaar, onEdit, onDelete, onPreviewDocument }) {
  const [isOpen, setIsOpen] = useState(false);
  const editable = isEditable(bazaar);
  const hasDocs = Array.isArray(bazaar.documents) && bazaar.documents.length > 0;

  return (
    <div className="border border-neutral-300 rounded-xl px-4 py-4 bg-white">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex-1 min-w-0 flex items-start justify-between gap-3 text-left"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium">{formatDate(bazaar.date)}</p>
            <p className="text-xs text-neutral-500 mt-0.5 truncate" title={bazaar.note || ""}>
              {bazaar.items.length} item{bazaar.items.length > 1 ? "s" : ""}{bazaar.note ? ` · ${bazaar.note}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <p className="text-lg font-semibold tabular-nums">{taka(bazaar.totalAmount)}</p>
            <ChevronDown
              className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-neutral-100">
        <div className="flex items-center gap-3">
          {editable ? (
            <>
              <button onClick={onEdit} className="text-xs font-medium text-neutral-600 hover:underline cursor-pointer">
                Edit
              </button>
              <button onClick={onDelete} className="text-xs font-medium text-[#ff6900] hover:underline cursor-pointer">
                Delete
              </button>
            </>
          ) : (
            <span className="text-xs text-neutral-400">🔒 Locked (previous month)</span>
          )}
        </div>

        {hasDocs && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreviewDocument && onPreviewDocument(bazaar.documents);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition cursor-pointer shadow-sm active:scale-95"
          >
            <Paperclip size={13} className="text-amber-500" />
            <span>View Voucher ({bazaar.documents.length})</span>
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
          <div className="border-t border-neutral-100 pt-3 space-y-1">
            {bazaar.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-baseline gap-2 text-sm text-neutral-600"
              >
                <span className="whitespace-nowrap">{item.title}</span>
                <span className="flex-1 border-b border-dotted border-neutral-300 mb-1"></span>
                <span className="whitespace-nowrap">{taka(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({ onCancel, onConfirm }) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 pb-20 md:pb-4 bg-black/40"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xs rounded-2xl p-6 text-center bg-white"
      >
        <p className="text-sm mb-5">This bazaar entry will be deleted. It cannot be recovered.</p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg text-sm font-medium bg-neutral-100 text-neutral-600"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-lg text-sm font-medium bg-[#ff6900] text-white"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function ErrorBanner({ message }) {
  return <div className="rounded-lg px-4 py-3 text-sm mb-6 bg-rose-50 text-rose-600">{message}</div>;
}

function EmptyState() {
  return (
    <div className="text-center py-16 text-neutral-400">
      <p className="text-sm">No bazaar entries yet</p>
    </div>
  );
}

function LoadingSkeleton() {
  return ( 
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 rounded-xl bg-neutral-100 animate-pulse" />
      ))}
    </div>
  );
}

