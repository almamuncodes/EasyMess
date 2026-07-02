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

/* ============================================================
   ছোট Helper ফাংশন — এগুলো শুধু ডেটাকে সুন্দর ফরম্যাটে দেখায়,
   কোনো UI render করে না
   ============================================================ */
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

/* ============================================================
   মূল পেজ — এখানে শুধু ডেটা fetch করা আর বাকি ছোট
   component গুলোকে সাজানো হচ্ছে (কোনো ভারী JSX নেই)
   ============================================================ */
export default function MyDepositsPage() {
  const user = GetUser();
  const userId = user?.user?.id;

  const [history, setHistory] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

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
      className={`${inter.variable} ${hindSiliguri.variable}`}
      style={{
        minHeight: "100vh",
        background: "#F5F5F5",
        color: "#171717",
        fontFamily: "var(--font-body), var(--font-body-bn), sans-serif",
      }}
    >
      <div className="max-w-2xl mx-auto px-6 py-10 md:py-14">
        <h1 className="text-2xl font-semibold mb-8">My Deposits</h1>

        {/* সবগুলো নিচের component-ই "reusable" — মানে চাইলে অন্য
            যেকোনো পেজে import করে আবার ব্যবহার করা যাবে */}
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
              <DepositRow key={deposit._id} deposit={deposit} />
            ))}
          </div>
        )}
      </div>
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


function DepositRow({ deposit }) {
  const noteText = deposit.note
    ? `${formatDate(deposit.date)} · ${deposit.note}`
    : formatDate(deposit.date);

  return (
    <div
      className="flex items-center justify-between px-4 py-4 rounded-lg"
      style={{ border: "3px solid #EDEDED", background: "#f3f3f3" }}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium tabular-nums">{taka(deposit.amount)}</p>
        {/* title attribute = hover করলে ব্রাউজার নিজে থেকেই পুরো টেক্সট দেখায় */}
        <p className="text-xs truncate" style={{ color: "#8A8A78" }} title={noteText}>
          {noteText}
        </p>
      </div>
      <PaymentBadge method={deposit.paymentMethod} />
    </div>
  );
}


//    PaymentBadge — Cash / bKash / Nagad / Bank ছোট বৃত্তাকার ট্যাগ
//    Props: method (string)

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

//    ErrorBanner — কোনো সমস্যা হলে লাল/গ্রে বক্সে মেসেজ দেখায়
//    Props: message (string)
//    ============================================================ */
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

//    EmptyState — কোনো deposit না থাকলে এই মেসেজ দেখায়
//    Props নেই — সবসময় একই দেখায়
//    ============================================================ */
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