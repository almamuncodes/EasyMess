"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Megaphone, X, Check, Sparkles, ExternalLink } from "lucide-react";
import io from "socket.io-client";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function BroadcastModalListener() {
  const [broadcast, setBroadcast] = useState(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  const getBroadcastId = (b) => {
    if (!b) return null;
    return (b._id || b.id || "").toString();
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

  useEffect(() => {
    if (open && broadcast && userId) {
      const bId = getBroadcastId(broadcast);
      Promise.resolve().then(() => {
        markAsSeen(bId, userId);
      });
    }
  }, [open, broadcast, userId, markAsSeen]);

  const checkDismissed = useCallback((b) => {
    const id = getBroadcastId(b);
    if (!id) return true;
    if (typeof window === "undefined") return true;
    const dismissed = localStorage.getItem(`dismissed_broadcast_${id}`);
    return dismissed === "true";
  }, []);

  const fetchActiveBroadcast = useCallback(async () => {
    const now = Date.now();
    const lastCheck = typeof window !== "undefined" ? sessionStorage.getItem("last_broadcast_check") : null;
    const cachedBStr = typeof window !== "undefined" ? sessionStorage.getItem("cached_active_broadcast") : null;

    if (lastCheck && (now - Number(lastCheck) < 60000)) {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/system/active-broadcast`);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("last_broadcast_check", String(now));
      }

      if (res.status === 404) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("cached_active_broadcast", "");
        }
        return;
      }

      const data = await res.json();
      if (res.ok && data.success && data.data) {
        const b = data.data;
        if (typeof window !== "undefined") {
          sessionStorage.setItem("cached_active_broadcast", JSON.stringify(b));
        }
        if (!checkDismissed(b)) {
          setBroadcast(b);
          setOpen(true);
        }
      } else {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("cached_active_broadcast", "");
        }
      }
    } catch (err) {
      console.error("Fetch active broadcast error:", err);
    }
  }, [checkDismissed]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchActiveBroadcast();
    });

    const socketUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
    });

    socket.on("system-broadcast", (newBroadcast) => {
      if (newBroadcast) {
        setBroadcast(newBroadcast);
        setOpen(true);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchActiveBroadcast]);

  // Refetch when pathname changes
  useEffect(() => {
    Promise.resolve().then(() => {
      fetchActiveBroadcast();
    });
  }, [pathname, fetchActiveBroadcast]);

  const handleDismiss = () => {
    const id = getBroadcastId(broadcast);
    if (id) {
      localStorage.setItem(`dismissed_broadcast_${id}`, "true");
    }
    setOpen(false);
  };

  // Helper to format text URLs into clickable hyperlinks
  const renderFormattedMessage = (text) => {
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
            className="text-orange-600 dark:text-orange-400 font-bold underline hover:text-orange-700 break-all transition"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  if (!open || !broadcast) return null;

  const isCritical = broadcast.urgency === "critical";
  const isUrgent = broadcast.urgency === "urgent";

  return (
    <div className="fixed inset-0 z-[99999] bg-black/65 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-800 animate-in zoom-in-95 duration-300 relative space-y-0">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition cursor-pointer backdrop-blur-sm"
          aria-label="Close Announcement"
        >
          <X size={18} />
        </button>

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
          <div className={`p-6 pb-2 ${isCritical ? "bg-rose-500/10" : isUrgent ? "bg-amber-500/10" : "bg-orange-500/10"}`}>
            <div className="w-14 h-14 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30 mb-2">
              <Megaphone size={28} />
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
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 animate-pulse"
                  : isUrgent
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                  : "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
              }`}
            >
              <Sparkles size={12} />
              {isCritical ? "Critical Alert" : isUrgent ? "Urgent Announcement" : "System Announcement"}
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
            {renderFormattedMessage(broadcast.message)}
          </div>

          {/* Optional Prominent Action Button / Hyperlink */}
          {broadcast.actionUrl && (
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
          )}

          {/* Sender metadata & Dismiss Action */}
          <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-gray-400 font-medium">
              From: <strong className="text-gray-700 dark:text-slate-200">{broadcast.senderName || "Admin"}</strong>
            </span>

            <button
              onClick={handleDismiss}
              className="w-full sm:w-auto px-6 py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check size={16} />
              <span>বুঝেছি (Got it, Close)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
