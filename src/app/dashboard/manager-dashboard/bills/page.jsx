"use client";

import { useEffect, useState, useCallback, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

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
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const [selectedNote, setSelectedNote] = useState(null);

  const { data: depositsData, isLoading: queryLoading, isError, error: queryError } = useQuery({
    queryKey: ["user-deposits", userId],
    queryFn: async () => {
      if (!userId) return { data: [], total: 0 };
      const res = await fetch(`${API_BASE}/api/deposits/user/${userId}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "cannot load");
      return data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const history = depositsData?.data || [];
  const total = depositsData?.total || 0;
  const loading = queryLoading && history.length === 0;
  const errorMsg = isError ? (queryError?.message || "Something went wrong") : "";

  return (
    <div
      className="rounded-2xl border-none min-h-screen bg-[#f2f4f1] dark:bg-slate-950 text-neutral-900 dark:text-slate-100 font-sans"
    >
      <div className="max-w-2xl mx-auto px-6 py-10 md:py-14">
        <h1 className="text-2xl font-semibold mb-8">My Deposits</h1>

        <TotalCard total={total} count={history.length} />

        {errorMsg && <ErrorBanner message={errorMsg} />}

        <p className="text-xs mb-3 text-neutral-800 dark:text-slate-300">
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

      {selectedNote && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedNote(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl w-full max-w-sm shadow-2xl text-neutral-900 dark:text-slate-100 border border-gray-100 dark:border-slate-800 animate-in zoom-in-95 duration-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Deposit Detail</h3>
                <p className="text-[11px] text-gray-400 dark:text-slate-400 font-medium mt-0.5">{formatDate(selectedNote.date)}</p>
              </div>
              <span className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer transition text-lg" onClick={() => setSelectedNote(null)}>
                ×
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-slate-800/50">
                <span className="text-xs font-semibold text-gray-400 uppercase">Amount</span>
                <span className="text-sm font-black text-orange-600 dark:text-orange-400">{taka(selectedNote.amount)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-slate-800/50">
                <span className="text-xs font-semibold text-gray-400 uppercase">Method</span>
                <PaymentBadge method={selectedNote.paymentMethod} />
              </div>
              <div className="py-1">
                <span className="text-xs font-semibold text-gray-400 uppercase block mb-1">Note</span>
                <p className="text-xs sm:text-sm text-gray-700 dark:text-slate-350 leading-relaxed bg-gray-50 dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-800">
                  {selectedNote.note || "No additional note provided."}
                </p>
              </div>
            </div>
            
            <button 
              className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 active:scale-95 transition shadow-md shadow-orange-500/20 cursor-pointer"
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
      className="rounded-3xl p-6 mb-6 bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/25 relative overflow-hidden"
    >
      <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/10 rounded-full translate-x-12 translate-y-12 blur-xl" />
      <div className="relative z-10 space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-orange-100">
          Total Deposit
        </p>
        <p className="text-3xl font-black tracking-tight tabular-nums text-white">
          {taka(total)}
        </p>
        <p className="text-xs font-semibold text-orange-100/90 flex items-center gap-1.5 pt-1">
          <span>📊</span> {count} entries submitted
        </p>
      </div>
    </div>
  );
}

const PAYMENT_STYLES = {
  Cash: { label: "Cash", bg: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/10" },
  bKash: { label: "bKash", bg: "bg-pink-50 dark:bg-pink-950/20 text-pink-700 dark:text-pink-400 border-pink-500/10" },
  Nagad: { label: "Nagad", bg: "bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 border-orange-500/10" },
  Bank: { label: "Bank", bg: "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-500/10" },
};

const DepositRow = memo(function DepositRow({ deposit, onClick }) {
  const dateStr = formatDate(deposit.date);
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-4 rounded-2xl cursor-pointer border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-orange-50/10 dark:hover:bg-slate-800/30 hover:border-orange-500/20 shadow-sm hover:shadow transition-all duration-200"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-lg shrink-0">
          ৳
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black tabular-nums text-gray-900 dark:text-white">
            {taka(deposit.amount)}
          </p>
          <p className="text-[11px] text-gray-400 dark:text-slate-400 font-medium truncate mt-0.5">
            {dateStr} {deposit.note && `· ${deposit.note}`}
          </p>
        </div>
      </div>
      <PaymentBadge method={deposit.paymentMethod} />
    </div>
  );
});

function PaymentBadge({ method }) {
  const style = PAYMENT_STYLES[method] || {
    label: method || "Unknown",
    bg: "bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-350 border-gray-200 dark:border-slate-700",
  };

  return (
    <span
      className={`text-[10px] sm:text-xs font-bold shrink-0 ml-3 px-2.5 py-1 rounded-full border ${style.bg}`}
    >
      {style.label}
    </span>
  );
}

function ErrorBanner({ message }) {
  return (
    <div
      className="rounded-xl px-4 py-3 text-sm mb-6 border border-rose-200 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 font-medium"
    >
      {message}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 text-neutral-450 dark:text-slate-500">
      <p className="text-sm">No deposits yet</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 rounded-2xl animate-pulse bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800" />
      ))}
    </div>
  );
}