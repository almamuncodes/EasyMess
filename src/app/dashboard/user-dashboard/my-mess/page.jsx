"use client";

import { GetUser } from "@/components/action/action";
import Image from "next/image";
import { useEffect, useState } from "react";
import MessQRCodeModal from "@/components/mess/MessQRCodeModal";
import { QrCode, Copy, Check } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function MyMessPage() {
  const [messInfo, setMessInfo] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showMembers, setShowMembers] = useState(false); // dropdown closed by default
  const [showQrModal, setShowQrModal] = useState(false);

  const user = GetUser();
  const CURRENT_USER_ID = user?.user?.id;

  // Load both APIs together when the page opens
  useEffect(() => {
    if (!CURRENT_USER_ID) return;

    async function loadData() {
      try {
        setLoading(true);

        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const [messRes, summaryRes] = await Promise.all([
          fetch(`${API_BASE}/api/user/my-mess/${CURRENT_USER_ID}`),
          fetch(
            `${API_BASE}/api/user/month-summary/${CURRENT_USER_ID}?month=${month}&year=${year}`,
          ),
        ]);

        const messData = await messRes.json();
        const summaryData = await summaryRes.json();

        if (!messData.success) throw new Error(messData.message);
        if (!summaryData.success) throw new Error(summaryData.message);

        setMessInfo(messData);
        setSummary(summaryData);
      } catch (err) {
        console.error(err);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [CURRENT_USER_ID]);

  // Copy invite code to clipboard
  function handleCopyInviteCode() {
    navigator.clipboard.writeText(messInfo.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen max-w-2xl  mx-auto   bg-[#F2F4F1] flex items-center justify-center">
        <div className="max-w-2xl w-full flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-400 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  return (

    <div className="max-w-2xl mx-auto p-4 space-y-6 bg-[#F2F4F1] dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-2xl shadow">
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-slate-100">My Mess</h1>

      {/* ================= Section 1: Mess Information ================= */}
      <div className="bg-[#fbf8ef] dark:bg-slate-900 rounded-2xl shadow p-5 space-y-3">
        <div className="flex items-center gap-4">
          <Image
            src={messInfo.messImage}
            alt={messInfo.messName}
            width={64}
            height={64}
            className="w-16 h-16 rounded-xl object-cover"
          />
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100">
              {messInfo.messName}
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">{messInfo.messLocation}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 dark:text-slate-300 pt-2">
          <p>
            Manager:{" "}
            <span className="font-medium text-gray-800 dark:text-slate-200">{messInfo.managerName}</span>
          </p>
          <p>
            Total Members:{" "}
            <span className="font-medium text-gray-800 dark:text-slate-200">{messInfo.totalMembers}</span>
          </p>
        </div>

        {/* Invite code & QR code section */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-2">
          <button
            onClick={handleCopyInviteCode}
            className="flex-1 flex items-center justify-between bg-[#F0F0F0] dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800/80 rounded-xl px-4 py-3 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 dark:text-slate-400 font-medium uppercase">Code:</span>
              <span className="font-mono font-bold text-gray-800 dark:text-slate-100 tracking-wider">
                {messInfo.inviteCode}
              </span>
            </div>
            <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-1">
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </span>
          </button>

          <button
            onClick={() => setShowQrModal(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold text-xs sm:text-sm px-4 py-3 rounded-xl shadow transition cursor-pointer shrink-0"
          >
            <QrCode size={18} />
            View Mess QR
          </button>
        </div>
      </div>

      {/* ================= Section 2: My Information ================= */}
      <div className="bg-[#FBF8EF] dark:bg-slate-900 rounded-2xl shadow p-5 space-y-2">
        <h2 className="font-semibold text-gray-800 dark:text-slate-100">My Information</h2>
        <p className="text-sm text-gray-600 dark:text-slate-300">
          Role:{" "}
          <span className="font-medium capitalize text-gray-800 dark:text-slate-200">{messInfo.myRole}</span>
        </p>
        <p className="text-sm text-gray-600 dark:text-slate-300">
          Joining Date:{" "}
          <span className="font-medium text-gray-800 dark:text-slate-200">
            {new Date(messInfo.myJoinDate).toLocaleDateString("en-US")}
          </span>
        </p>
      </div>

      {/* ================= Section 3: Current Month Summary ================= */}
      <div className="bg-[#FBF8EF] dark:bg-slate-900 rounded-2xl shadow p-5 space-y-3">
        <h2 className="font-semibold text-gray-800 dark:text-slate-100">Current Month Summary</h2>

        <div className="grid grid-cols-2 gap-4 text-sm ">
          <SummaryItem label="Total Meal" value={summary.totalMeal} />
          <SummaryItem
            label="Total Deposit"
            value={`৳${summary.totalDeposit}`}
          />
          <SummaryItem label="Meal Rate" value={`৳${summary.mealRate}`} />
          <SummaryItem label="Bill" value={`৳${summary.bill}`} />
        </div>

        <div
          className={`rounded-xl px-4 py-3 text-center font-semibold ${summary.status === "advance"
              ? "bg-[#F0F0F0] dark:bg-slate-800 text-green-700 dark:text-green-400"
              : "bg-[#F0F0F0] dark:bg-slate-800 text-red-700 dark:text-red-400"
            }`}
        >
          {summary.status === "advance"
            ? `You are ৳${Math.abs(summary.balance)} in advance`
            : `You have ৳${Math.abs(summary.balance)} due`}
        </div>
      </div>

      {/* ================= Section 4: Mess Members (dropdown) ================= */}
      <div className="bg-[#FBF8EF] dark:bg-slate-900 rounded-2xl shadow overflow-hidden">
        <button
          onClick={() => setShowMembers((prev) => !prev)}
          className="w-full flex items-center justify-between p-5"
        >
          <h2 className="font-semibold text-gray-800 dark:text-slate-100">
            Mess Members{" "}
            <span className="text-gray-400 dark:text-slate-500 font-normal">
              ({messInfo.members.length})
            </span>
          </h2>
          <ChevronIcon open={showMembers} />
        </button>

        {showMembers && (
          <div className="px-5 pb-5 space-y-2">
            {messInfo.members.map((m) => (
              <div
                key={m.userId}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 ${m.role === "manager" ? "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300" : "bg-[#F0F0F0] dark:bg-slate-800 text-neutral-800 dark:text-slate-200"
                  }`}
              >
                <Image
                  src={m.image}
                  alt={m.name}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-white"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                  {m.name}
                </span>
                {m.role === "manager" && (
                  <span className="ml-auto text-xs font-medium bg-amber-200 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-1 rounded-full">
                    Manager
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= Section 5: Leave Mess ================= */}
      <button
        onClick={() => setShowLeaveModal(true)}
        className="w-full py-3 rounded-xl border border-red-300 dark:border-red-900/50 text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-950/20"
      >
        Leave Mess
      </button>

      {/* Leave Mess Modal - informational only, no delete action */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full space-y-4 border border-neutral-200 dark:border-slate-800">
            <h3 className="font-semibold text-gray-800 dark:text-slate-100">
              Want to leave the mess?
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-350">
              To leave the mess, please contact your manager. Only the manager
              can remove you from the mess.
            </p>
            <button
              onClick={() => setShowLeaveModal(false)}
              className="w-full py-2 rounded-xl bg-[#FF6900] text-white font-medium"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Mess QR Code Modal */}
      <MessQRCodeModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        messInfo={messInfo}
      />
    </div>

  );
}

// Small reusable component for each summary box
function SummaryItem({ label, value }) {
  return (
    <div className="bg-[#F0F0F0] dark:bg-slate-800 rounded-xl px-4 py-3 text-neutral-900 dark:text-slate-100">
      <p className="text-gray-500 dark:text-slate-400 text-xs">{label}</p>
      <p className="font-semibold text-gray-800 dark:text-slate-100">{value}</p>
    </div>
  );
}

// Chevron icon that rotates when the dropdown is open
function ChevronIcon({ open }) {
  return (
    <svg
      className={`w-5 h-5 text-gray-400 transition-transform ${open ? "rotate-180" : ""
        }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}
