"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Fraunces,
  Inter,
  Noto_Serif_Bengali,
  Hind_Siliguri,
} from "next/font/google";
import { GetUser } from "@/components/action/action";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});
const notoBengali = Noto_Serif_Bengali({
  subsets: ["bengali"],
  weight: ["600", "700"],
  variable: "--font-display-bn",
});
const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali"],
  weight: ["400", "500", "600"],
  variable: "--font-body-bn",
});

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const NOTE_MAX_LENGTH = 60;

const PAYMENT_STYLES = {
  Cash: { label: "Cash", bg: "#E8F0EA", text: "#2F5741", ring: "#B7D3C1" },
  bKash: { label: "bKash", bg: "#FCE7EF", text: "#C23E73", ring: "#F3B8CE" },
  Nagad: { label: "Nagad", bg: "#FBEBDD", text: "#B85E1E", ring: "#F0C79A" },
  Bank: { label: "Bank", bg: "#E6EDF1", text: "#2F4858", ring: "#B9CBD4" },
};

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

export default function ManagerDepositsPage() {
  const user = GetUser();
  const id = user?.user?.id;

  const managerId = id;

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [month, setMonth] = useState("");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [modalState, setModalState] = useState(null); // { mode: "add" | "edit", memberId, deposit? }
  const [deletingId, setDeletingId] = useState(null);
  const [grandTotal, setGrandTotal] = useState(0);

  const loadDeposits = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const params = new URLSearchParams({ managerId });
      if (month) params.set("month", month);
      if (search) params.set("search", search);

      const res = await fetch(
        `${API_BASE}/api/manager/deposits?${params.toString()}`,
      );
      const data = await res.json();

      if (!data.success) throw new Error(data.message || "cannot load");

      setMembers(data.data || []);
      setGrandTotal(data.grandTotal || 0);
    } catch (err) {
      setErrorMsg(err.message || "something went wrong");
    } finally {
      setLoading(false);
    }
  }, [managerId, month, search]);

  useEffect(() => {
    loadDeposits();
  }, [loadDeposits]);

  const handleSave = async (formValues) => {
    const isEdit = modalState.mode === "edit";
    const url = isEdit
      ? `${API_BASE}/api/deposits/${modalState.deposit._id}`
      : `${API_BASE}/api/deposits`;
    const method = isEdit ? "PATCH" : "POST";

    const body = isEdit
      ? { managerId, ...formValues }
      : { managerId, userId: modalState.memberId, ...formValues };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "cannot save");

    setModalState(null);
    loadDeposits();
  };

  const handleDelete = async (depositId) => {
    try {
      const res = await fetch(`${API_BASE}/api/deposits/${depositId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setDeletingId(null);
      loadDeposits();
    } catch (err) {
      setErrorMsg(err.message);
      setDeletingId(null);
    }
  };

  return (
    <div
      className={`${fraunces.variable} ${inter.variable} ${notoBengali.variable} ${hindSiliguri.variable}`}
      style={{
        minHeight: "100vh",
        background: "#f2f4f1",
       
        color: "#1B2B22",
      }}
    >

      <header
        style={{ background: "#F5A24E", color: "#FFFFFF" }}
        className="px-6 py-6 md:px-12 md:py-7"
      >
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
          <div>
            <p className="text-xs font-medium tracking-wide uppercase opacity-80 mb-1">
              Manager Dashboard
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold leading-tight">
              Deposit Ledger
            </h1>
          </div>
          <div className="md:text-right">
            <p className="text-xs opacity-80 mb-0.5">Total Deposit</p>
            <p className="text-3xl md:text-4xl font-bold tabular-nums leading-none">
              {taka(grandTotal)}
            </p>
          </div>
        </div>
      </header>

      {/* ===== ফিল্টার বার ===== */}
      <div className="max-w-5xl mx-auto px-6 md:px-12 -mt-5">
        <div
          className="rounded-xl shadow-sm p-3 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center"
          style={{ background: "#F7F6EE", border: "1px solid #DCDCC9" }}
        >
          <div
            className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg"
            style={{ background: "#FFFFFF" }}
          >
            <SearchIcon />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search member..."
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-[#8A8A78]"
            />
          </div>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: "#FFFFFF", border: "1px solid #DCDCC9" }}
          />
          {(search || month) && (
            <button
              onClick={() => {
                setSearch("");
                setMonth("");
              }}
              className="text-sm px-3 py-2 rounded-lg"
              style={{ color: "#5B6A5F" }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ===== এরর ===== */}
      {errorMsg && (
        <div className="max-w-5xl mx-auto px-6 md:px-12 mt-4">
          <div
            className="rounded-lg px-4 py-3 text-sm"
            style={{ background: "#FCE7EF", color: "#C23E73" }}
          >
            {errorMsg}
          </div>
        </div>
      )}

      {/* ===== মেম্বার লিস্ট ===== */}
      <main className="max-w-5xl mx-auto px-6 md:px-12 py-8">
        {loading ? (
          <LoadingRows />
        ) : members.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-3">
            {members.map((member) => (
              <MemberLedgerRow
                key={member.userId}
                member={member}
                expanded={expandedId === member.userId}
                onToggle={() =>
                  setExpandedId(
                    expandedId === member.userId ? null : member.userId,
                  )
                }
                onAdd={() =>
                  setModalState({ mode: "add", memberId: member.userId })
                }
                onEdit={(deposit) =>
                  setModalState({
                    mode: "edit",
                    memberId: member.userId,
                    deposit,
                  })
                }
                onDelete={(depositId) => setDeletingId(depositId)}
              />
            ))}
          </div>
        )}
      </main>

      {modalState && (
        <DepositModal
          mode={modalState.mode}
          initial={modalState.deposit}
          onClose={() => setModalState(null)}
          onSave={handleSave}
        />
      )}

      {deletingId && (
        <ConfirmDialog
          onCancel={() => setDeletingId(null)}
          onConfirm={() => handleDelete(deletingId)}
        />
      )}
    </div>
  );
}

/* ============================================================
   একটা মেম্বারের লেজার রো
   ============================================================ */
function MemberLedgerRow({
  member,
  expanded,
  onToggle,
  onAdd,
  onEdit,
  onDelete,
}) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "#F7F6EE", border: "1px solid #DCDCC9" }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          {member.image ? (
            <img
              src={member.image}
              alt={member.name}
              className="w-10 h-10 rounded-full object-cover shrink-0"
              style={{ border: "1px solid #DCDCC9" }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.nextSibling.style.display = "flex";
              }}
            />
          ) : null}
          <div
            className="w-10 h-10 rounded-full items-center justify-center text-sm font-semibold shrink-0"
            style={{
              background: "#1B3A2F",
              color: "#D9B45C",
            
              display: member.image ? "none" : "flex",
            }}
          >
            {member.name?.charAt(0)?.toUpperCase() || "?"}
          </div>

          <div>
            <p className="font-medium text-[#1B2B22]">{member.name}</p>
            <p className="text-xs" style={{ color: "#8A8A78" }}>
              {member.history?.length || 0} entries
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <p
           
            className="text-lg font-semibold tabular-nums"
          >
            {taka(member.total)}
          </p>
          <ChevronIcon open={expanded} />
        </div>
      </button>

      {expanded && (
        <div
          className="px-5 pb-5 pt-1"
          style={{ borderTop: "1px dashed #C9C9B0" }}
        >
          <div className="flex justify-end mb-3 mt-3">
            <button
              onClick={onAdd}
              className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg"
              style={{ background: "#1B3A2F", color: "#F1EFE2" }}
            >
              <PlusIcon /> New Deposit
            </button>
          </div>

          {!member.history || member.history.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: "#8A8A78" }}>
              No deposits yet
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {member.history.map((d) => {
                const style =
                  PAYMENT_STYLES[d.paymentMethod] || PAYMENT_STYLES.Cash;
                const noteText = d.note ? `${formatDate(d.date)} · ${d.note}` : formatDate(d.date);
                return (
                  <div
                    key={d._id}
                    className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg group"
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #EDEDDF",
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="text-xs font-semibold px-2 py-1 rounded-full shrink-0"
                        style={{ background: style.bg, color: style.text }}
                      >
                        {style.label}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold tabular-nums">
                          {taka(d.amount)}
                        </p>
                        {/* hover korle full note dekhabe (title attribute = native browser tooltip) */}
                        <p
                          className="text-xs truncate"
                          style={{ color: "#8A8A78" }}
                          title={noteText}
                        >
                          {noteText}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity shrink-0">
                      <IconButton onClick={() => onEdit(d)} title="Edit">
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => onDelete(d._id)}
                        title="Delete"
                      >
                        <TrashIcon />
                      </IconButton>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   এড / এডিট মোডাল
   ============================================================ */
function DepositModal({ mode, initial, onClose, onSave }) {
  const [amount, setAmount] = useState(initial?.amount ?? "");
  const [paymentMethod, setPaymentMethod] = useState(
    initial?.paymentMethod ?? "Cash",
  );
  const [note, setNote] = useState(initial?.note ?? "");
  const [date, setDate] = useState(
    initial?.date
      ? new Date(initial.date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({ amount: Number(amount), paymentMethod, note, date });
    } catch (err) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(27, 43, 34, 0.5)" }}
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: "#F7F6EE" }}
      >
        <div
          style={{
            height: 14,
            backgroundImage:
              "radial-gradient(circle at 10px 0, transparent 6px, #F7F6EE 7px)",
            backgroundSize: "20px 14px",
            backgroundColor: "#1B3A2F",
          }}
        />
        <div className="px-6 py-5">
          <h2
           
            className="text-xl font-semibold mb-4"
          >
            {mode === "edit" ? "Edit Deposit" : "Add New Deposit"}
          </h2>

          {error && (
            <p
              className="text-sm mb-3 px-3 py-2 rounded-lg"
              style={{ background: "#FCE7EF", color: "#C23E73" }}
            >
              {error}
            </p>
          )}

          <label className="block text-xs font-medium mb-1" style={{ color: "#5B6A5F" }}>
            Amount (৳)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full mb-3 px-3 py-2 rounded-lg outline-none text-sm tabular-nums"
            style={{ background: "#FFFFFF", border: "1px solid #DCDCC9" }}
            placeholder="2000"
            autoFocus
          />

          <label className="block text-xs font-medium mb-1" style={{ color: "#5B6A5F" }}>
            Payment Method
          </label>
          <div className="flex gap-2 mb-3">
            {Object.keys(PAYMENT_STYLES).map((key) => {
              const style = PAYMENT_STYLES[key];
              const active = paymentMethod === key;
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => setPaymentMethod(key)}
                  className="flex-1 text-xs font-semibold py-2 rounded-lg transition-all"
                  style={{
                    background: active ? style.bg : "#FFFFFF",
                    color: active ? style.text : "#8A8A78",
                    border: `1px solid ${active ? style.ring : "#DCDCC9"}`,
                  }}
                >
                  {style.label}
                </button>
              );
            })}
          </div>

          <label className="block text-xs font-medium mb-1" style={{ color: "#5B6A5F" }}>
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full mb-3 px-3 py-2 rounded-lg outline-none text-sm"
            style={{ background: "#FFFFFF", border: "1px solid #DCDCC9" }}
          />

          {/* Note field — এখন character limit + live counter সহ */}
          <label className="flex items-center justify-between text-xs font-medium mb-1" style={{ color: "#5B6A5F" }}>
            <span>Note (Optional)</span>
            <span style={{ color: note.length >= NOTE_MAX_LENGTH ? "#C23E73" : "#A3A3A3" }}>
              {note.length}/{NOTE_MAX_LENGTH}
            </span>
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={NOTE_MAX_LENGTH}
            className="w-full mb-5 px-3 py-2 rounded-lg outline-none text-sm"
            style={{ background: "#FFFFFF", border: "1px solid #DCDCC9" }}
            placeholder="July month's installment"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg text-sm font-medium"
              style={{ background: "#EDEDDF", color: "#5B6A5F" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
              style={{ background: "#1B3A2F", color: "#F1EFE2" }}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function ConfirmDialog({ onCancel, onConfirm }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(27, 43, 34, 0.5)" }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xs rounded-2xl p-6 text-center"
        style={{ background: "#F7F6EE" }}
      >
        <p className="text-sm mb-5">
          This entry will be deleted. It cannot be recovered.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg text-sm font-medium"
            style={{ background: "#EDEDDF", color: "#5B6A5F" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-lg text-sm font-medium"
            style={{ background: "#C23E73", color: "#FFFFFF" }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <p style={{ color: "#8A8A78" }} className="text-2xl mb-2">
        Account is Empty
      </p>
      <p className="text-sm" style={{ color: "#8A8A78" }}>
        No members found, or no deposits made for this month.
      </p>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "#E3E3D5" }} />
      ))}
    </div>
  );
}

function IconButton({ children, onClick, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#EDEDDF]"
      style={{ color: "#5B6A5F" }}
    >
      {children}
    </button>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A8A78" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
function ChevronIcon({ open }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#5B6A5F"
      strokeWidth="2"
      style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}