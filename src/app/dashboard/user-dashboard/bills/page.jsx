"use client";

import { useEffect, useState, useCallback } from "react";
import { Inter, Hind_Siliguri } from "next/font/google";
import { GetUser } from "@/components/action/action";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});
const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali"],
  weight: ["400", "500", "600"],
  variable: "--font-body-bn",
});

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

export default function MyDepositsPage() {
  const user = GetUser();
  const userId = user?.user?.id;

  const [history, setHistory] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedNote, setSelectedNote] = useState(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`${API_BASE}/api/deposits/user/${userId}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "cannot load");
      setHistory(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      setErrorMsg(err.message || "something went wrong");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div
      className={`${inter.variable} ${hindSiliguri.variable} border rounded-2xl`}
      style={{
        minHeight: "100vh",
        background: "#F2F4F1",
        color: "#171717",
        fontFamily: "var(--font-body), var(--font-body-bn), sans-serif",
      }}
    >
      <div className="max-w-2xl mx-auto px-6 py-10 md:py-14">
        <h1 className="text-2xl font-semibold mb-8">My Deposits</h1>

        <TotalCard total={total} count={history.length} />

        {errorMsg && <ErrorBanner message={errorMsg} />}

        <p style={{ color: "#18181B" }} className="text-xs mb-3">
          History
        </p>

        {loading ? (
          <LoadingSkeleton />
        ) : history.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-3">
            {history.map((deposit) => (
              <DepositRow 
                key={deposit._id} 
                deposit={deposit} 
                onClick={() => setSelectedNote(deposit)} 
              />
            ))}
          </div>
        )}
      </div>

      {/* Note Detail Modal */}
      {selectedNote && (
        <div 
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6"
          onClick={() => setSelectedNote(null)}
        >
          <div 
            className="bg-white p-6 rounded-xl w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-lg mb-1">Details</h3>
            <p className="text-xs text-gray-500 mb-4">{formatDate(selectedNote.date)}</p>
            <p className="text-sm text-gray-800 leading-relaxed">
              {selectedNote.note || "No additional note provided."}
            </p>
            <button 
              className="mt-6 w-full py-2.5 rounded-lg text-sm font-medium text-white"
              style={{ background: "#F58331" }}
              onClick={() => setSelectedNote(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TotalCard({ total, count }) {
  return (
    <div
      className="rounded-xl px-6 py-5 mb-8"
      style={{ border: "1px solid #E5E5E5", background: "#F58331" }}
    >
      <p style={{ color: "#FFFFFF" }} className="text-xs mb-1">
        Total Deposit
      </p>
      <p className="text-3xl font-semibold tabular-nums text-white">
        {taka(total)}
      </p>
      <p style={{ color: "#FFFFFF" }} className="text-xs mt-1">
        {count} entries
      </p>
    </div>
  );
}

function DepositRow({ deposit, onClick }) {
  const noteText = deposit.note
    ? `${formatDate(deposit.date)} · ${deposit.note}`
    : formatDate(deposit.date);

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between px-4 py-4 rounded-lg cursor-pointer"
      style={{ border: "3px solid #EDEDED", background: "#f3f3f3" }}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium tabular-nums">{taka(deposit.amount)}</p>
        <p className="text-xs truncate" style={{ color: "#8A8A78" }}>
          {noteText}
        </p>
      </div>
      <PaymentBadge method={deposit.paymentMethod} />
    </div>
  );
}

function PaymentBadge({ method }) {
  return (
    <span
      className="text-xs shrink-0 ml-3 px-2.5 py-1 rounded-full"
      style={{ border: "1px solid #E5E5E5", color: "#525252" }}
    >
      {method}
    </span>
  );
}

function ErrorBanner({ message }) {
  return (
    
    <div
      className="rounded-lg px-4 py-3 text-sm mb-6"
      style={{ border: "1px solid #E5E5E5", color: "#525252" }}
    >
      {message}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16" style={{ color: "#A3A3A3" }}>
      <p className="text-sm">No deposits yet</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: "#F5F5F5" }} />
      ))}
    </div>
  );
}