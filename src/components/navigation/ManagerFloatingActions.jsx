"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  UtensilsCrossed,
  Boxes,
  Store,
  Wallet,
  X,
  Zap,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useTranslation } from "@/lib/useTranslation";

export default function ManagerFloatingActions() {
  const router = useRouter();
  const pathname = usePathname();
  const { lang } = useTranslation();
  const isBn = lang === "bn";

  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  // Check role
  const { data: queryRole } = useQuery({
    queryKey: ["member-role", userId],
    queryFn: async () => {
      if (!userId) return "";
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${apiBase}/api/member/role/${userId}`);
      const data = await res.json();
      if (data.role && typeof window !== "undefined") {
        sessionStorage.setItem(`user_role_${userId}`, data.role);
        sessionStorage.setItem("user_role", data.role);
      }
      return data.role || "";
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
  });

  const role =
    queryRole ||
    (typeof window !== "undefined"
      ? sessionStorage.getItem(`user_role_${userId}`) || sessionStorage.getItem("user_role")
      : "") ||
    session?.user?.role ||
    "";

  // Check rice management setting for mess
  const { data: riceConfig } = useQuery({
    queryKey: ["rice-config", userId],
    queryFn: async () => {
      if (!userId) return null;
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${apiBase}/api/rice/config?userId=${userId}`);
      const data = await res.json();
      return data.config || null;
    },
    enabled: !!userId && role === "manager",
    staleTime: 1000 * 60 * 5,
  });

  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Position state (persisted)
  const [pos, setPos] = useState({ x: 0, y: 0, side: "right" });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({
    startX: 0,
    startY: 0,
    elemX: 0,
    elemY: 0,
    hasMoved: false,
    activePointerId: null,
  });

  // Track keyboard open to avoid overlaying on mobile inputs
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleFocusIn = (e) => {
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable) {
        setIsKeyboardOpen(true);
      }
    };

    const handleFocusOut = () => {
      setIsKeyboardOpen(false);
    };

    const handleViewportResize = () => {
      if (window.visualViewport) {
        const heightDiff = window.innerHeight - window.visualViewport.height;
        if (heightDiff > 120) {
          setIsKeyboardOpen(true);
        } else if (
          document.activeElement?.tagName !== "INPUT" &&
          document.activeElement?.tagName !== "TEXTAREA"
        ) {
          setIsKeyboardOpen(false);
        }
      }
    };

    window.addEventListener("focusin", handleFocusIn);
    window.addEventListener("focusout", handleFocusOut);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleViewportResize);
    }

    return () => {
      window.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("focusout", handleFocusOut);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleViewportResize);
      }
    };
  }, []);

  // Initialize position on client mount
  useEffect(() => {
    Promise.resolve().then(() => {
      setMounted(true);
      if (typeof window === "undefined") return;

      try {
        const saved = localStorage.getItem("easymess_manager_fab");
        if (saved) {
          const parsed = JSON.parse(saved);
          const winW = window.innerWidth;
          const winH = window.innerHeight;
          const safeY = Math.min(Math.max(parsed.y || 250, 75), winH - 120);
          const safeSide = parsed.side === "left" ? "left" : "right";
          const safeX = safeSide === "left" ? 14 : winW - 68;
          setPos({ x: safeX, y: safeY, side: safeSide });
          return;
        }
      } catch {
        // fallback
      }

      // Default: right side, above bottom nav
      const winW = window.innerWidth;
      const winH = window.innerHeight;
      setPos({
        x: winW - 68,
        y: Math.max(120, winH - 180),
        side: "right",
      });
    });
  }, []);

  // Handle window resize to keep bubble on screen
  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;

    const handleResize = () => {
      const winW = window.innerWidth;
      const winH = window.innerHeight;
      setPos((prev) => {
        const safeY = Math.min(Math.max(prev.y, 75), winH - 120);
        const safeX = prev.side === "left" ? 14 : winW - 68;
        return { x: safeX, y: safeY, side: prev.side };
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mounted]);

  // Pointer drag events
  const handlePointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      elemX: pos.x,
      elemY: pos.y,
      hasMoved: false,
      activePointerId: e.pointerId,
    };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (e) => {
    if (dragRef.current.activePointerId !== e.pointerId) return;

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    if (!dragRef.current.hasMoved && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
      dragRef.current.hasMoved = true;
      setIsDragging(true);
      if (isOpen) setIsOpen(false);
    }

    if (dragRef.current.hasMoved) {
      const winW = window.innerWidth;
      const winH = window.innerHeight;
      const newX = Math.min(Math.max(dragRef.current.elemX + dx, 10), winW - 64);
      const newY = Math.min(Math.max(dragRef.current.elemY + dy, 70), winH - 100);

      setPos((prev) => ({
        ...prev,
        x: newX,
        y: newY,
      }));
    }
  };

  const handlePointerUp = (e) => {
    if (dragRef.current.activePointerId !== e.pointerId) return;
    dragRef.current.activePointerId = null;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (dragRef.current.hasMoved) {
      setIsDragging(false);
      // Snap to nearest edge
      const winW = window.innerWidth;
      const snapSide = pos.x < winW / 2 ? "left" : "right";
      const snappedX = snapSide === "left" ? 14 : winW - 68;

      const finalPos = {
        x: snappedX,
        y: pos.y,
        side: snapSide,
      };
      setPos(finalPos);

      try {
        localStorage.setItem("easymess_manager_fab", JSON.stringify(finalPos));
      } catch {
        // ignore
      }
    } else {
      // Tap / click
      setIsDragging(false);
      setIsOpen((prev) => !prev);
    }
  };

  const handlePointerCancel = () => {
    dragRef.current.activePointerId = null;
    setIsDragging(false);
  };

  // Close menu when pathname changes
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setIsOpen(false);
  }

  // Don't render for non-managers or before mount or during keyboard open
  if (!mounted || role !== "manager" || isKeyboardOpen) {
    return null;
  }

  // Quick Action Items (Order: Bazaar -> Payments -> Meal -> Rice)
  const items = [
    {
      id: "bazaar",
      name: isBn ? "বাজার হিসাব" : "Bazaar",
      shortName: isBn ? "বাজার" : "Bazaar",
      href: "/dashboard/manager-dashboard/bazaar",
      icon: Store,
      gradient: "from-blue-500 to-indigo-600",
      shadow: "shadow-blue-500/30",
    },
    {
      id: "payments",
      name: isBn ? "পেমেন্ট কালেকশন" : "Payments",
      shortName: isBn ? "পেমেন্ট" : "Pay",
      href: "/dashboard/manager-dashboard/payments",
      icon: Wallet,
      gradient: "from-purple-500 to-violet-600",
      shadow: "shadow-purple-500/30",
    },
    {
      id: "meals",
      name: isBn ? "মিল কন্ট্রোল" : "Meal Management",
      shortName: isBn ? "মিল" : "Meal",
      href: "/dashboard/manager-dashboard/meal-management",
      icon: UtensilsCrossed,
      gradient: "from-amber-500 to-orange-500",
      shadow: "shadow-orange-500/30",
    },
    ...(riceConfig?.enableRiceManagement === true
      ? [
          {
            id: "rice",
            name: isBn ? "রাইস কন্ট্রোল" : "Rice Management",
            shortName: isBn ? "চাল" : "Rice",
            href: "/dashboard/manager-dashboard/rice-management",
            icon: Boxes,
            gradient: "from-emerald-500 to-teal-600",
            shadow: "shadow-emerald-500/30",
          },
        ]
      : []),
  ];

  const isLeft = pos.side === "left";
  const count = items.length;

  // Radial angles calculation for circular arc
  // When on right edge, items blossom out to the left (100° to 260°)
  // When on left edge, items blossom out to the right (-80° to +80°)
  const winH = typeof window !== "undefined" ? window.innerHeight : 800;
  const isNearTop = pos.y < 160;
  const isNearBottom = pos.y > winH - 160;

  let angles = [];
  if (!isLeft) {
    // Right side dock (pointing leftwards into the screen)
    if (count === 4) {
      if (isNearTop) angles = [200, 165, 130, 95];
      else if (isNearBottom) angles = [265, 230, 195, 160];
      else angles = [245, 195, 145, 95];
    } else {
      if (isNearTop) angles = [180, 145, 110];
      else if (isNearBottom) angles = [250, 215, 180];
      else angles = [225, 180, 135];
    }
  } else {
    // Left side dock (pointing rightwards into the screen)
    if (count === 4) {
      if (isNearTop) angles = [-20, 15, 50, 85];
      else if (isNearBottom) angles = [-85, -50, -15, 20];
      else angles = [-65, -15, 35, 85];
    } else {
      if (isNearTop) angles = [0, 35, 70];
      else if (isNearBottom) angles = [-70, -35, 0];
      else angles = [-45, 0, 45];
    }
  }

  const radius = 95; // radius in px around the center trigger button
  const triggerRadius = 28; // half of 56px trigger
  const itemRadius = 25; // half of 50px item

  return (
    <>
      {/* Backdrop to close when tapping outside */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/25 dark:bg-black/50 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
        />
      )}

      {/* Floating Widget Root */}
      <div
        style={{
          transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
          touchAction: "none",
        }}
        className={`fixed top-0 left-0 z-50 select-none ${
          isDragging ? "transition-none pointer-events-auto" : "transition-transform duration-300 ease-out"
        }`}
      >
        {/* Radial Circular Action Buttons */}
        <div className="relative w-14 h-14 pointer-events-none">
          {items.map((item, idx) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const angleDeg = angles[idx] || 0;
            const rad = (angleDeg * Math.PI) / 180;
            const offsetX = Math.round(triggerRadius + radius * Math.cos(rad) - itemRadius);
            const offsetY = Math.round(triggerRadius + radius * Math.sin(rad) - itemRadius);

            return (
              <button
                key={item.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  router.push(item.href);
                }}
                title={item.name}
                aria-label={item.name}
                style={{
                  transform: isOpen
                    ? `translate3d(${offsetX}px, ${offsetY}px, 0) scale(1)`
                    : `translate3d(3px, 3px, 0) scale(0)`,
                  opacity: isOpen ? 1 : 0,
                  transitionDelay: isOpen ? `${idx * 35}ms` : "0ms",
                  pointerEvents: isOpen ? "auto" : "none",
                }}
                className={`group absolute top-0 left-0 w-[50px] h-[50px] rounded-full bg-gradient-to-tr ${
                  item.gradient
                } text-white flex flex-col items-center justify-center shadow-xl ${
                  item.shadow
                } ring-2 ring-white/90 dark:ring-slate-800 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer active:scale-90 hover:scale-110`}
              >
                {/* Active Indicator Dot */}
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-white shadow-xs"></span>
                )}

                <Icon size={18} className="transition-transform group-hover:scale-110" />
                <span className="text-[9px] font-black tracking-tight leading-none mt-0.5">
                  {item.shortName}
                </span>

                {/* Floating Tooltip Label (hover on desktop or tap) */}
                <span
                  className={`pointer-events-none absolute whitespace-nowrap px-2 py-1 rounded-lg text-[10px] font-bold bg-gray-900/90 dark:bg-slate-900/90 text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20 ${
                    isLeft ? "left-full ml-2" : "right-full mr-2"
                  }`}
                >
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Main Floating Trigger Button (100% Round Circle) */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          className={`absolute top-0 left-0 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 cursor-grab active:cursor-grabbing ${
            isOpen
              ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 rotate-90 scale-95 shadow-2xl shadow-black/30 ring-4 ring-orange-500/30"
              : "bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white shadow-xl shadow-orange-500/40 hover:scale-105 active:scale-95 ring-2 ring-white/50 dark:ring-slate-800"
          }`}
          title={isBn ? "ম্যানেজার কুইক অ্যাকশন (টেনে সরানো যায়)" : "Manager Quick Actions (Draggable)"}
          aria-label="Manager Quick Actions"
        >
          {/* Subtle Ambient Pulse Ring */}
          {!isOpen && (
            <span className="absolute -inset-1 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 opacity-40 blur-xs group-hover:opacity-60 transition-opacity -z-10 animate-pulse"></span>
          )}

          {/* Icon: transforms to X when open */}
          {isOpen ? (
            <X size={22} className="transition-transform duration-200" />
          ) : (
            <Zap size={24} className="fill-white stroke-white transition-transform group-hover:scale-110 pointer-events-none select-none drop-shadow-sm" />
          )}

          {/* Left/Right Dock Guide Arrow */}
          {!isOpen && !isDragging && (
            <span
              className={`absolute top-1/2 -translate-y-1/2 text-[10px] opacity-40 transition-opacity pointer-events-none ${
                isLeft ? "-left-1" : "-right-1"
              }`}
            >
              {isLeft ? <ChevronLeft size={10} /> : <ChevronRight size={10} />}
            </span>
          )}
        </div>
      </div>
    </>
  );
}
