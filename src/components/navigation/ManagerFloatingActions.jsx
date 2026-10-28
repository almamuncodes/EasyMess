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
  Sparkles,
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

  // Pointer drag events (supports both touch and mouse seamlessly)
  const handlePointerDown = (e) => {
    // Only primary button
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
      // It was a tap / click
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

  // Quick Action Items
  const items = [
    {
      id: "meals",
      name: isBn ? "মিল কন্ট্রোল" : "Meal Management",
      desc: isBn ? "দৈনিক মিল চালু/বন্ধ" : "Daily meal toggles",
      href: "/dashboard/manager-dashboard/meal-management",
      icon: UtensilsCrossed,
      gradient: "from-amber-500 to-orange-500",
      shadow: "shadow-orange-500/25",
    },
    ...(riceConfig?.enableRiceManagement === true
      ? [
          {
            id: "rice",
            name: isBn ? "রাইস কন্ট্রোল" : "Rice Management",
            desc: isBn ? "দৈনিক চাল ও গেস্ট চাল" : "Daily rice & guests",
            href: "/dashboard/manager-dashboard/rice-management",
            icon: Boxes,
            gradient: "from-emerald-500 to-teal-600",
            shadow: "shadow-emerald-500/25",
          },
        ]
      : []),
    {
      id: "bazaar",
      name: isBn ? "বাজার হিসাব" : "Bazaar",
      desc: isBn ? "দৈনিক বাজার ও খরচ" : "Daily mess expenses",
      href: "/dashboard/manager-dashboard/bazaar",
      icon: Store,
      gradient: "from-blue-500 to-indigo-600",
      shadow: "shadow-blue-500/25",
    },
    {
      id: "payments",
      name: isBn ? "পেমেন্ট কালেকশন" : "Payments",
      desc: isBn ? "সদস্যদের জমা ও হিসাব" : "Member deposits",
      href: "/dashboard/manager-dashboard/payments",
      icon: Wallet,
      gradient: "from-purple-500 to-violet-600",
      shadow: "shadow-purple-500/25",
    },
  ];

  const isLeft = pos.side === "left";
  const openUpwards = pos.y > 320;

  return (
    <>
      {/* Backdrop to close when tapping outside */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/25 dark:bg-black/50 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
        />
      )}

      {/* Floating Widget Container */}
      <div
        style={{
          transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
          touchAction: "none",
        }}
        className={`fixed top-0 left-0 z-50 select-none ${
          isDragging ? "transition-none pointer-events-auto" : "transition-transform duration-300 ease-out"
        }`}
      >
        {/* Menu Items (Speed Dial / Radial list) */}
        {isOpen && (
          <div
            className={`absolute flex flex-col gap-2.5 z-50 ${
              openUpwards ? "bottom-16" : "top-16"
            } ${isLeft ? "left-0 items-start" : "right-0 items-end"} animate-in fade-in zoom-in-95 duration-200`}
          >
            {items.map((item, idx) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <button
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                    router.push(item.href);
                  }}
                  style={{
                    animationDelay: `${idx * 40}ms`,
                  }}
                  className={`group flex items-center gap-2.5 p-1 rounded-2xl cursor-pointer transition-all active:scale-95 ${
                    isLeft ? "flex-row" : "flex-row-reverse"
                  }`}
                >
                  {/* Icon Circle */}
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${item.gradient} text-white flex items-center justify-center shadow-lg ${item.shadow} group-hover:scale-110 transition-transform duration-200 ${
                      isActive ? "ring-2 ring-white ring-offset-2 ring-offset-orange-500" : ""
                    }`}
                  >
                    <Icon size={20} />
                  </div>

                  {/* Label Pill */}
                  <div className="px-3.5 py-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl border border-gray-200/80 dark:border-slate-800 shadow-lg shadow-black/5 flex flex-col text-left whitespace-nowrap min-w-[125px]">
                    <span className="text-xs font-bold text-gray-900 dark:text-white leading-tight flex items-center justify-between gap-1">
                      <span>{item.name}</span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      )}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium leading-none mt-0.5">
                      {item.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Main Floating Trigger Button */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          className={`relative group cursor-grab active:cursor-grabbing w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
            isOpen
              ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 rotate-90 scale-95 shadow-xl shadow-black/20"
              : "bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white shadow-xl shadow-orange-500/35 hover:scale-105 active:scale-95"
          }`}
          title={isBn ? "ম্যানেজার কুইক অ্যাকশন (টেনে সরানো যায়)" : "Manager Quick Actions (Draggable)"}
          aria-label="Manager Quick Actions"
        >
          {/* Subtle Ambient Glow Ring */}
          {!isOpen && (
            <span className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 opacity-30 blur-sm group-hover:opacity-50 transition-opacity -z-10 animate-pulse"></span>
          )}

          {/* Icon: changes to X when open */}
          {isOpen ? (
            <X size={22} className="transition-transform duration-200" />
          ) : (
            <div className="flex flex-col items-center justify-center">
              <Sparkles size={18} className="animate-spin-slow" />
              <span className="text-[9px] font-black tracking-tighter uppercase mt-0.5 leading-none">
                MGR
              </span>
            </div>
          )}

          {/* Left/Right Dock Arrow Indicator */}
          {!isOpen && !isDragging && (
            <span
              className={`absolute top-1/2 -translate-y-1/2 text-[10px] opacity-40 group-hover:opacity-80 transition-opacity ${
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
