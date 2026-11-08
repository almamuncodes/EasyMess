"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  Megaphone,
  X,
  Check,
  Sparkles,
  ExternalLink,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ShieldAlert,
  RotateCcw,
} from "lucide-react";
import io from "socket.io-client";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function BroadcastModalListener() {
  const [broadcast, setBroadcast] = useState(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  // Critical Alert 10-Second Verification States
  const [criticalClicked, setCriticalClicked] = useState(false);
  const [criticalRemaining, setCriticalRemaining] = useState(10);
  const [criticalCompleted, setCriticalCompleted] = useState(false);
  const [hasReturnedEarly, setHasReturnedEarly] = useState(false);
  const [returnedEarlySeconds, setReturnedEarlySeconds] = useState(0);

  const [hasMess, setHasMess] = useState(() => {
    if (typeof window !== "undefined" && userId) {
      const cachedRole = sessionStorage.getItem(`user_role_${userId}`) || sessionStorage.getItem("user_role");
      const cachedMess = sessionStorage.getItem(`user_mess_id_${userId}`) || sessionStorage.getItem("user_mess_id");
      if (cachedRole && cachedRole !== "none") return true;
      if (cachedMess && cachedMess !== "none") return true;
    }
    return false;
  });

  // Query server if user belongs to a mess (only when not already known from cache)
  useEffect(() => {
    if (!userId) return;

    const cachedRole = sessionStorage.getItem(`user_role_${userId}`) || sessionStorage.getItem("user_role");
    const cachedMess = sessionStorage.getItem(`user_mess_id_${userId}`) || sessionStorage.getItem("user_mess_id");

    if (cachedRole === "none" || cachedMess === "none") {
      return;
    }
    if ((cachedRole && cachedRole !== "none") || (cachedMess && cachedMess !== "none")) {
      return;
    }

    let isSubscribed = true;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/member/messid/${userId}`)
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (!isSubscribed) return;
        if (data && data.messId) {
          setHasMess(true);
          sessionStorage.setItem(`user_mess_id_${userId}`, data.messId);
        } else {
          sessionStorage.setItem(`user_mess_id_${userId}`, "none");
        }
      })
      .catch(() => {});

    return () => {
      isSubscribed = false;
    };
  }, [userId]);

  const getBroadcastId = (b) => {
    if (!b) return null;
    return (b._id || b.id || "").toString();
  };

  const getTargetLink = (b) => {
    if (!b) return null;
    if (b.actionUrl && b.actionUrl.trim()) return b.actionUrl.trim();
    const urlRegex = /(https?:\/\/[^\s]+)/;
    const match = b.message?.match(urlRegex);
    return match ? match[0] : null;
  };

  const markAsSeen = useCallback(async (bId, uId) => {
    if (!bId || !uId) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/system/broadcast/${bId}/seen`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uId }),
      });
    } catch (err) {
      console.error("Failed to mark broadcast as seen:", err);
    }
  }, []);

  const checkDismissed = useCallback((b) => {
    const id = getBroadcastId(b);
    if (!id) return true;
    if (typeof window === "undefined") return true;

    // Check standard dismissed flag
    const dismissed = localStorage.getItem(`dismissed_broadcast_${id}`);
    if (dismissed === "true") return true;

    // For critical alerts, verify if the required stay rule was satisfied previously
    if (b.urgency === "critical") {
      const requiredDuration = Math.max(5, Number(b.criticalDuration) || 10);
      const clickKey = `critical_bcast_click_${id}`;
      const storedClick = localStorage.getItem(clickKey);
      if (storedClick) {
        const elapsed = Math.floor((Date.now() - Number(storedClick)) / 1000);
        if (elapsed >= requiredDuration) {
          localStorage.setItem(`dismissed_broadcast_${id}`, "true");
          localStorage.removeItem(clickKey);
          return true;
        }
      }
      // If critical and hasn't spent required duration on link, must show modal again
      return false;
    }

    return false;
  }, []);

  const fetchActiveBroadcast = useCallback(async () => {
    // Only logged-in users who belong to a mess should receive announcements
    if (!userId || !hasMess) {
      return;
    }

    const now = Date.now();
    const lastCheck = typeof window !== "undefined" ? sessionStorage.getItem(`last_broadcast_check_${userId}`) : null;
    const cachedBStr = typeof window !== "undefined" ? sessionStorage.getItem(`cached_active_broadcast_${userId}`) : null;

    if (lastCheck && now - Number(lastCheck) < 60000) {
      if (cachedBStr) {
        try {
          const b = JSON.parse(cachedBStr);
          if (!checkDismissed(b)) {
            setBroadcast(b);
            setOpen(true);
          }
        } catch (e) {}
      }
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/system/active-broadcast?userId=${userId}`);
      if (typeof window !== "undefined") {
        sessionStorage.setItem(`last_broadcast_check_${userId}`, String(now));
      }

      if (res.status === 404) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem(`cached_active_broadcast_${userId}`, "");
        }
        return;
      }

      const data = await res.json();
      if (res.ok && data.success && data.data) {
        const b = data.data;
        if (typeof window !== "undefined") {
          sessionStorage.setItem(`cached_active_broadcast_${userId}`, JSON.stringify(b));
        }
        if (!checkDismissed(b)) {
          setBroadcast(b);
          setOpen(true);
        }
      } else {
        if (typeof window !== "undefined") {
          sessionStorage.setItem(`cached_active_broadcast_${userId}`, "");
        }
      }
    } catch (err) {
      console.error("Fetch active broadcast error:", err);
    }
  }, [userId, hasMess, checkDismissed]);

  useEffect(() => {
    if (!userId || !hasMess) return;

    Promise.resolve().then(() => {
      fetchActiveBroadcast();
    });

    const socketUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
    });

    socket.on("system-broadcast", (newBroadcast) => {
      // Strictly only display if logged-in AND in a mess
      if (newBroadcast && !checkDismissed(newBroadcast)) {
        setBroadcast(newBroadcast);
        setOpen(true);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [userId, hasMess, fetchActiveBroadcast, checkDismissed]);

  // Refetch when pathname changes for logged-in mess members
  useEffect(() => {
    if (userId && hasMess) {
      Promise.resolve().then(() => {
        fetchActiveBroadcast();
      });
    }
  }, [pathname, userId, hasMess, fetchActiveBroadcast]);

  // Handle normal notice mark-as-seen
  useEffect(() => {
    if (open && broadcast && userId && broadcast.urgency !== "critical") {
      const bId = getBroadcastId(broadcast);
      Promise.resolve().then(() => {
        markAsSeen(bId, userId);
      });
    }
  }, [open, broadcast, userId, markAsSeen]);

  // Critical Alert 10-Second Monitor Engine
  useEffect(() => {
    if (!open || !broadcast || broadcast.urgency !== "critical") return;

    const bId = getBroadcastId(broadcast);
    if (!bId) return;

    const requiredDuration = Math.max(5, Number(broadcast.criticalDuration) || 10);
    const clickKey = `critical_bcast_click_${bId}`;

    // Check if user had already clicked in this or previous session
    const storedClick = typeof window !== "undefined" ? localStorage.getItem(clickKey) : null;
    if (storedClick) {
      const elapsed = Math.floor((Date.now() - Number(storedClick)) / 1000);
      if (elapsed >= requiredDuration) {
        localStorage.setItem(`dismissed_broadcast_${bId}`, "true");
        localStorage.removeItem(clickKey);
        markAsSeen(bId, userId);
        const timer = setTimeout(() => {
          setCriticalCompleted(true);
          setOpen(false);
        }, 0);
        return () => clearTimeout(timer);
      }
    }

    // Active Interval to track required stay duration
    const interval = setInterval(() => {
      const clickTimeStr = localStorage.getItem(clickKey);
      if (!clickTimeStr) return;

      const elapsed = Math.floor((Date.now() - Number(clickTimeStr)) / 1000);
      const remaining = Math.max(0, requiredDuration - elapsed);
      setCriticalRemaining(remaining);

      if (elapsed >= requiredDuration) {
        clearInterval(interval);
        setCriticalCompleted(true);
        localStorage.setItem(`dismissed_broadcast_${bId}`, "true");
        localStorage.removeItem(clickKey);
        markAsSeen(bId, userId);
        setTimeout(() => {
          setOpen(false);
        }, 1200);
      }
    }, 500);

    // Detect when user switches back to this tab
    const handleVisibilityOrFocus = () => {
      const clickTimeStr = localStorage.getItem(clickKey);
      if (!clickTimeStr) return;

      const elapsed = Math.floor((Date.now() - Number(clickTimeStr)) / 1000);
      if (elapsed >= requiredDuration) {
        setCriticalCompleted(true);
        localStorage.setItem(`dismissed_broadcast_${bId}`, "true");
        localStorage.removeItem(clickKey);
        markAsSeen(bId, userId);
        setTimeout(() => {
          setOpen(false);
        }, 1200);
      } else {
        setReturnedEarlySeconds(elapsed);
        setHasReturnedEarly(true);
      }
    };

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, [open, broadcast, userId, markAsSeen]);

  // Action link click for Critical Alerts
  const handleCriticalLinkClick = useCallback((targetUrl) => {
    if (!targetUrl || !broadcast) return;
    const bId = getBroadcastId(broadcast);
    if (!bId) return;

    const duration = Math.max(5, Number(broadcast.criticalDuration) || 10);
    const clickKey = `critical_bcast_click_${bId}`;
    localStorage.setItem(clickKey, String(Date.now()));

    setCriticalClicked(true);
    setCriticalRemaining(duration);
    setHasReturnedEarly(false);
    setReturnedEarlySeconds(0);

    window.open(targetUrl, "_blank", "noopener,noreferrer");
  }, [broadcast]);

  // Normal Notice dismiss handler
  const handleDismiss = () => {
    const id = getBroadcastId(broadcast);
    if (id) {
      localStorage.setItem(`dismissed_broadcast_${id}`, "true");
    }
    setOpen(false);
  };

  // Helper to format text URLs into clickable hyperlinks
  const renderFormattedMessage = (text, isCriticalMode) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-600 dark:text-orange-400 font-bold underline hover:text-orange-700 break-all transition cursor-pointer"
            onClick={(e) => {
              if (isCriticalMode) {
                e.preventDefault();
                handleCriticalLinkClick(part);
              } else {
                e.stopPropagation();
              }
            }}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  if (!open || !broadcast || !userId || !hasMess) return null;

  const isCritical = broadcast.urgency === "critical";
  const isUrgent = broadcast.urgency === "urgent";
  const targetLink = getTargetLink(broadcast);
  const requiredDuration = Math.max(5, Number(broadcast.criticalDuration) || 10);

  return (
    <div
      onClick={() => {
        // Critical alerts CANNOT be dismissed by backdrop click
        if (!isCritical) handleDismiss();
      }}
      className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white dark:bg-slate-900 rounded-[28px] max-w-lg w-full overflow-hidden shadow-2xl border ${
          isCritical
            ? "border-rose-500/50 shadow-rose-500/20 ring-4 ring-rose-500/20"
            : "border-gray-100 dark:border-slate-800"
        } animate-in zoom-in-95 duration-300 relative space-y-0`}
      >
        {/* Close Button: Hidden completely for Critical Alerts */}
        {!isCritical && (
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition cursor-pointer backdrop-blur-sm"
            aria-label="Close Announcement"
          >
            <X size={18} />
          </button>
        )}

        {/* Optional Announcement Banner Image */}
        {broadcast.imageUrl ? (
          <div className="relative w-full h-48 sm:h-56 bg-slate-950 overflow-hidden">
            <Image
              src={broadcast.imageUrl}
              alt={broadcast.title || "Announcement"}
              fill
              unoptimized
              className="object-cover hover:scale-105 transition duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/20" />
          </div>
        ) : (
          <div
            className={`p-6 pb-2 ${
              isCritical ? "bg-rose-500/15" : isUrgent ? "bg-amber-500/10" : "bg-orange-500/10"
            }`}
          >
            <div
              className={`w-14 h-14 rounded-2xl ${
                isCritical ? "bg-rose-600 shadow-rose-600/30" : "bg-orange-500 shadow-orange-500/30"
              } text-white flex items-center justify-center shadow-lg mb-2`}
            >
              {isCritical ? <ShieldAlert size={28} /> : <Megaphone size={28} />}
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Urgency Badge */}
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide flex items-center gap-1.5 ${
                isCritical
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 animate-pulse ring-1 ring-rose-400"
                  : isUrgent
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                  : "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
              }`}
            >
              {isCritical ? <ShieldAlert size={12} /> : <Sparkles size={12} />}
              {isCritical ? "Critical System Alert" : isUrgent ? "Urgent Announcement" : "System Announcement"}
            </span>
            {broadcast.createdAt && (
              <span className="text-[11px] font-semibold text-gray-400">
                {new Date(broadcast.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
            {broadcast.title}
          </h2>

          {/* Message Content (Auto-linkified text) */}
          <div className="max-h-48 overflow-y-auto pr-1 text-sm sm:text-base text-gray-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
            {renderFormattedMessage(broadcast.message, isCritical)}
          </div>

          {/* CRITICAL ALERT MANDATORY SECTION */}
          {isCritical ? (
            <div className="space-y-3 pt-2">
              {/* Mandatory Notice Box */}
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-200 space-y-1">
                <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300">
                  <AlertTriangle size={16} className="text-rose-600 shrink-0 animate-bounce" />
                  <span>বাধ্যতামূলক নির্দেশিকা (Mandatory Action):</span>
                </div>
                <p className="leading-relaxed text-[11.5px] text-gray-700 dark:text-slate-300">
                  নিচের বাটনে ক্লিক করে লিঙ্কে প্রবেশ করুন এবং সেখানে কমপক্ষে <strong>{requiredDuration} সেকেন্ড</strong> অপেক্ষা করুন।
                  {requiredDuration} সেকেন্ড অতিবাহিত হলে এই নোটিশটি স্বয়ংক্রিয়ভাবে বন্ধ হয়ে যাবে।
                </p>
              </div>

              {/* Status Indicator: Completed */}
              {criticalCompleted ? (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-center gap-2 animate-in zoom-in-95">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  <span>{requiredDuration} সেকেন্ড সম্পন্ন হয়েছে! নোটিশটি স্বয়ংক্রিয়ভাবে বন্ধ হচ্ছে...</span>
                </div>
              ) : hasReturnedEarly && criticalRemaining > 0 ? (
                /* Status Indicator: Returned too early */
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-semibold space-y-1.5">
                  <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-bold">
                    <Clock size={15} className="text-amber-600 shrink-0 animate-spin" />
                    <span>সময় বাকি আছে!</span>
                  </div>
                  <p className="text-[11.5px] leading-relaxed">
                    আপনি মাত্র <strong>{returnedEarlySeconds} সেকেন্ড</strong> পর ফিরে এসেছেন। লিঙ্কে আরও{" "}
                    <strong className="text-rose-600 dark:text-rose-400 font-mono text-sm">
                      {criticalRemaining} সেকেন্ড
                    </strong>{" "}
                    থাকা আবশ্যক। দয়া করে লিঙ্কে পুনরায় প্রবেশ করুন।
                  </p>
                </div>
              ) : criticalClicked && criticalRemaining > 0 ? (
                /* Status Indicator: Counting down */
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200 text-xs font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} className="animate-spin text-blue-600" />
                    <span>লিঙ্কে সময় যাচাই হচ্ছে...</span>
                  </span>
                  <span className="font-mono text-xs font-bold bg-blue-200/70 dark:bg-blue-900/60 px-2.5 py-0.5 rounded-lg text-blue-900 dark:text-blue-100">
                    বাকি {criticalRemaining} / {requiredDuration} সেকেন্ড
                  </span>
                </div>
              ) : null}

              {/* Mandatory Action Link Button */}
              {targetLink ? (
                <button
                  type="button"
                  onClick={() => handleCriticalLinkClick(targetLink)}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-600 via-orange-600 to-rose-600 hover:from-rose-700 hover:to-orange-700 text-white font-black rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 cursor-pointer active:scale-98 animate-pulse hover:animate-none"
                >
                  {hasReturnedEarly ? <RotateCcw size={16} /> : <ExternalLink size={16} />}
                  <span>
                    {hasReturnedEarly
                      ? "🔄 লিঙ্কে পুনরায় প্রবেশ করুন (আরও সময় বাকি)"
                      : broadcast.actionText || `👉 লিঙ্কে প্রবেশ করুন (কমপক্ষে ${requiredDuration} সেকেন্ড অপেক্ষা করুন)`}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleCriticalLinkClick(window.location.href)}
                  className="w-full py-3.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Clock size={16} />
                  <span>{requiredDuration} সেকেন্ড অপেক্ষা করুন (নোটিশ পর্যবেক্ষণ)</span>
                </button>
              )}
            </div>
          ) : (
            /* NORMAL / URGENT ACTION BUTTON */
            broadcast.actionUrl && (
              <div className="pt-2">
                <a
                  href={broadcast.actionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25"
                >
                  <span>{broadcast.actionText || "👉 Open Link / Join Now"}</span>
                  <ExternalLink size={16} />
                </a>
              </div>
            )
          )}

          {/* Sender metadata & Dismiss Action (Dismiss button completely hidden in Critical mode) */}
          <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-gray-400 font-medium">
              From: <strong className="text-gray-700 dark:text-slate-200">{broadcast.senderName || "Admin"}</strong>
            </span>

            {!isCritical && (
              <button
                onClick={handleDismiss}
                className="w-full sm:w-auto px-6 py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check size={16} />
                <span>বুঝেছি (Got it, Close)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
