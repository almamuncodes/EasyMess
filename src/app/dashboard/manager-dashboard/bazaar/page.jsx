"use client";

import { useEffect, useState, useCallback } from "react";
import { GetUser } from "@/components/action/action";
import { ChevronDown } from "lucide-react";

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
  return new Date().toISOString().slice(0, 10);
}

// শুধুমাত্র চলতি মাসের এন্ট্রি এডিট/ডিলিট করা যাবে
function isEditable(bazaar) {
  const now = new Date();
  const bazaarDate = new Date(bazaar.date);
  return (
    bazaarDate.getMonth() === now.getMonth() &&
    bazaarDate.getFullYear() === now.getFullYear()
  );
}

export default function ManagerBazaarPage() {
  const user = GetUser();
  const managerId = user?.user?.id;

  const now = new Date();
  const currentMonth = String(now.getMonth() + 1);
  const currentYear = String(now.getFullYear());

  const [bazaars, setBazaars] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // ডিফল্ট ফিল্টার = চলতি মাস, চলতি বছর
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    if (!managerId) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const params = new URLSearchParams({ managerId });
      if (month) params.set("month", month);
      if (year) params.set("year", year);

      const res = await fetch(`${API_BASE}/api/bazaars?${params.toString()}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to load");

      setBazaars(data.data || []);
      setGrandTotal(data.grandTotal || 0);
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong");
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
              />
            ))}
          </div>
        )}
      </div>

      {deletingId && (
        <ConfirmDialog onCancel={() => setDeletingId(null)} onConfirm={() => handleDelete(deletingId)} />
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
  const [date, setDate] = useState(
    initial?.date ? new Date(initial.date).toISOString().slice(0, 10) : todayISO()
  );
  const [note, setNote] = useState(initial?.note ?? "");
  const [items, setItems] = useState(
    initial?.items?.length ? initial.items.map((i) => ({ title: i.title, amount: String(i.amount) })) : [emptyItem()]
  );
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
      await onSave({ date, note, items: validItems });
      if (!isEditing) {
        setDate(todayISO());
        setNote("");
        setItems([emptyItem()]);
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

      <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
        <div>
          <p className="text-xs text-neutral-500">Total</p>
          <p className="text-xl font-semibold tabular-nums">{taka(total)}</p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 rounded-lg text-sm font-medium bg-[#ff6900] text-white disabled:opacity-60"
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


function BazaarHistoryCard({ bazaar, onEdit, onDelete }) {
  const [isOpen, setIsOpen] = useState(false);
  const itemNames = bazaar.items.map((i) => i.title).join(", ");
  const editable = isEditable(bazaar);

  return (
    <div className="border border-neutral-300 rounded-xl px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex-1 min-w-0 flex items-start justify-between gap-3 text-left"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium">{formatDate(bazaar.date)}</p>
            <p className="text-xs text-neutral-500 mt-0.5 truncate" title={itemNames}>
              {bazaar.items.length} item{bazaar.items.length > 1 ? "s" : ""} · {itemNames}
            </p>
            {bazaar.note && <p className="text-xs text-neutral-400 mt-0.5">{bazaar.note}</p>}
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

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-neutral-100">
        {editable ? (
          <>
            <button onClick={onEdit} className="text-xs font-medium text-neutral-600 hover:underline">
              Edit
            </button>
            <button onClick={onDelete} className="text-xs font-medium text-[#ff6900] hover:underline">
              Delete
            </button>
          </>
        ) : (
          <span className="text-xs text-neutral-400">🔒 Locked (previous month)</span>
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
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
