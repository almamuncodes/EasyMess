"use client";

import { GetUser } from "@/components/action/action";
import React, { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import QRScannerComponent from "@/components/mess/QRScannerComponent";
import { QrCode, KeyRound, Sparkles, CheckCircle2, Info } from "lucide-react";

function JoinMessContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("code") || "";

  const [inviteCode, setInviteCode] = useState(initialCode);
  const [activeTab, setActiveTab] = useState("qr"); // "qr" | "manual"
  const [loading, setLoading] = useState(false);

  const user = GetUser();
  const userId = user?.user?.id;
  const userName = user?.user?.name;
  const userEmail = user?.user?.email;
  const userImage = user?.user?.image;

  // modal state
  const [modal, setModal] = useState({
    show: false,
    title: "",
    message: "",
    type: "success",
  });

  const handleJoinRequest = useCallback(
    async (codeToUse) => {
      const targetCode = (codeToUse || inviteCode || "").trim();
      if (!targetCode) return toast.warning("Please enter or scan an invite code");

      setLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/join-mess-request`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              inviteCode: targetCode,
              userName,
              userEmail,
              userImage,
            }),
          }
        );

        const data = await res.json();

        if (res.ok) {
          trackEvent("join_mess", { inviteCode: targetCode });
          setModal({
            show: true,
            title: "Request Sent!",
            message: `Your request has been sent to ${
              data.messName || "the mess"
            }. Please wait for manager approval.`,
            type: "success",
          });
        } else if (res.status === 409) {
          setModal({
            show: true,
            title:
              data.message ===
              "Request already pending please wait for approval"
                ? "Already Requested"
                : "Already Member",
            message: ` ${data.message || "Something went wrong"}`,
            type: "info",
          });
        } else {
          toast.error(data.message || "Something went wrong");
        }
        setInviteCode("");
      } catch (error) {
        toast.error("Server error, please try again.");
      } finally {
        setLoading(false);
      }
    },
    [inviteCode, userId, userEmail, userImage, userName]
  );

  // Auto trigger if URL contains code
  useEffect(() => {
    if (initialCode) {
      setInviteCode(initialCode);
    }
  }, [initialCode]);

  // Handle scanned QR code auto submission
  const handleQRScan = (scannedCode) => {
    if (!scannedCode || loading) return;
    setInviteCode(scannedCode);
    toast.success(`Scanned code: ${scannedCode}`);
    handleJoinRequest(scannedCode);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-50 to-orange-50/30 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 transition-all">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Join a Mess
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
            Scan mess QR code or enter invite code to join.
          </p>
        </div>

        {/* Switch Mode Tabs */}
        <div className="flex bg-gray-100 dark:bg-slate-800 p-1.5 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("qr")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
              activeTab === "qr"
                ? "bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-md"
                : "text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200"
            }`}
          >
            <QrCode size={16} />
            Scan QR Code
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
              activeTab === "manual"
                ? "bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-md"
                : "text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200"
            }`}
          >
            <KeyRound size={16} />
            Invite Code
          </button>
        </div>

        {/* Tab 1: QR Code Scanner */}
        {activeTab === "qr" && (
          <div className="space-y-4">
            <QRScannerComponent onScan={handleQRScan} isProcessing={loading} />
            <p className="text-center text-xs text-gray-400 dark:text-slate-500">
              Point your camera at the QR code. It will auto-send your join request upon detection.
            </p>
          </div>
        )}

        {/* Tab 2: Manual Code Input */}
        {activeTab === "manual" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                Mess Invite Code
              </label>
              <input
                type="text"
                placeholder="e.g. MS1234"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 dark:text-white font-mono font-bold tracking-widest text-center uppercase"
              />
            </div>

            <button
              onClick={() => handleJoinRequest(inviteCode)}
              disabled={loading || !inviteCode.trim()}
              className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Sparkles className="animate-spin" size={18} />
                  Sending Request...
                </>
              ) : (
                "Submit Join Request"
              )}
            </button>
          </div>
        )}
      </div>

      {/* Dynamic Modal */}
      {modal.show && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/50 backdrop-blur-sm z-[70] p-4 pb-20 md:pb-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl max-w-xs w-full text-center border border-gray-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex justify-center mb-4">
              {modal.type === "success" ? (
                <CheckCircle2 size={48} className="text-emerald-500" />
              ) : (
                <Info size={48} className="text-blue-500" />
              )}
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">
              {modal.title}
            </h3>
            <p className="text-xs text-gray-600 dark:text-slate-300 mt-2 leading-relaxed">
              {modal.message}
            </p>
            <button
              onClick={() => setModal({ ...modal, show: false })}
              className="mt-6 w-full py-3 bg-gray-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-700 text-white font-semibold rounded-xl transition cursor-pointer text-xs uppercase tracking-wider"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function JoinMessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <JoinMessContent />
    </Suspense>
  );
}