"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Home, LayoutDashboard, MessageCircle, ClipboardList, User } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useTranslation } from "@/lib/useTranslation";
import { useSocket } from "@/components/providers/SocketProvider";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const { chatUnreadCount } = useSocket();
  const { data: session, isPending } = authClient.useSession();
  const isLoggedIn = !!session;

  const [dashboardHref, setDashboardHref] = useState("/dashboard");

  useEffect(() => {
    if (session?.user?.id && typeof window !== "undefined") {
      const cachedRole = sessionStorage.getItem(`user_role_${session.user.id}`);
      if (cachedRole === "manager") {
        setDashboardHref("/dashboard/manager-dashboard/overview");
      } else if (cachedRole === "member") {
        setDashboardHref("/dashboard/user-dashboard/overview");
      } else if (cachedRole === "admin") {
        setDashboardHref("/dashboard/admin-dashboard/overview");
      }
    }
  }, [session]);

  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

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

  // Mobile Horizontal Swipe Navigation between BottomNav tabs (Facebook/Insta style)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth >= 768) return; // Only active on mobile devices
    if (isKeyboardOpen) return; // Disabled while user is typing

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isIgnoredTouch = false;

    const handleTouchStart = (e) => {
      if (e.touches.length !== 1) {
        isIgnoredTouch = true;
        return;
      }

      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartTime = Date.now();
      isIgnoredTouch = false;

      // Ignore if user is inside form elements, buttons, modals, sliders or dialogs
      const target = e.target;
      const tag = target?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "BUTTON" ||
        tag === "SELECT" ||
        target?.isContentEditable ||
        target?.closest?.("input, textarea, button, select, [role='dialog'], .modal, [data-no-swipe]")
      ) {
        isIgnoredTouch = true;
        return;
      }

      // Avoid edge conflict with iOS/Android native back/forward gestures (edges < 28px)
      if (touchStartX < 28 || touchStartX > window.innerWidth - 28) {
        isIgnoredTouch = true;
        return;
      }
    };

    const handleTouchEnd = (e) => {
      if (isIgnoredTouch) return;
      if (e.changedTouches.length !== 1) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      const deltaTime = Date.now() - touchStartTime;

      // Must be a deliberate, brisk gesture (< 650ms)
      if (deltaTime > 650) return;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Minimum swipe distance of 65px and predominantly horizontal movement
      if (absX >= 65 && absX > absY * 1.8) {
        const navList = [
          "/",
          dashboardHref,
          "/chat",
          "/notice",
          "/profile",
        ];

        let activeIdx = navList.findIndex((href) => {
          if (href === "/") return pathname === "/";
          return pathname === href || pathname.startsWith(href);
        });

        if (activeIdx === -1 && pathname.startsWith("/dashboard")) {
          activeIdx = 1;
        }

        if (activeIdx === -1) return;

        if (deltaX < 0) {
          // Swiped Left (finger moved right-to-left) -> Next Tab
          if (activeIdx < navList.length - 1) {
            router.push(navList[activeIdx + 1]);
          }
        } else {
          // Swiped Right (finger moved left-to-right) -> Previous Tab
          if (activeIdx > 0) {
            router.push(navList[activeIdx - 1]);
          }
        }
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pathname, dashboardHref, isKeyboardOpen, router]);

  // Don't show bottom navigation if loading or not logged in
  if (isPending || !isLoggedIn) return null;

  const userImage = session?.user?.image;
  const userName = session?.user?.name;

  const tabs = [
    {
      name: t("home") || "Home",
      href: "/",
      icon: Home,
    },
    {
      name: t("dashboard") || "Dashboard",
      href: dashboardHref,
      icon: LayoutDashboard,
    },
    {
      name: t("chat") || "Chat",
      href: "/chat",
      icon: MessageCircle,
    },
    {
      name: t("notice") || "Notice",
      href: "/notice",
      icon: ClipboardList,
    },
    {
      name: t("profile") || "Profile",
      href: "/profile",
      icon: User,
      isProfile: true,
    },
  ];

  return (
    <div
      className={`md:hidden fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto pointer-events-none transition-all duration-300 ease-out ${
        isKeyboardOpen
          ? "opacity-0 translate-y-28 pointer-events-none select-none"
          : "opacity-100 translate-y-0"
      }`}
    >
      <div className="pointer-events-auto relative bg-white/65 dark:bg-slate-900/65 backdrop-blur-2xl backdrop-saturate-200 border border-white/80 dark:border-white/15 shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] rounded-[26px] p-1.5 px-3 flex justify-around items-center ring-1 ring-black/5 dark:ring-white/10 transition-all duration-300 overflow-hidden">
        {/* Specular Top Edge Light */}
        <div className="absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/90 dark:via-white/20 to-transparent pointer-events-none" />

        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            pathname === tab.href ||
            (tab.href !== "/" && pathname.startsWith(tab.href));

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`relative flex flex-col items-center justify-center py-1.5 px-2.5 sm:px-3 rounded-2xl transition-all duration-200 active:scale-95 select-none ${
                isActive
                  ? "text-white font-bold scale-105"
                  : "text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-gray-200"
              }`}
            >
              {/* Active Tab Highlight Capsule */}
              {isActive && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 shadow-md shadow-orange-500/25 border border-orange-400/40 transition-all duration-300 -z-10" />
              )}

              <div className="relative flex items-center justify-center">
                {tab.isProfile && userImage ? (
                  <div
                    className={`w-6 h-6 rounded-full overflow-hidden border transition-all duration-300 ${
                      isActive
                        ? "border-white ring-2 ring-white/50 scale-110 shadow-sm"
                        : "border-gray-300 dark:border-slate-700"
                    }`}
                  >
                    <Image
                      src={userImage}
                      alt={userName || "Profile"}
                      width={24}
                      height={24}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : tab.isProfile && userName ? (
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      isActive
                        ? "bg-white text-orange-600 shadow-sm scale-110"
                        : "bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {userName[0]?.toUpperCase()}
                  </div>
                ) : (
                  <Icon
                    size={20}
                    className={`transition-all duration-300 ${
                      isActive
                        ? "scale-110 stroke-[2.4] text-white"
                        : "scale-100 stroke-[1.8]"
                    }`}
                  />
                )}

                {/* Unread Chat Badge (9+ if > 9) */}
                {tab.href === "/chat" && !isActive && chatUnreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 bg-gradient-to-r from-red-500 to-rose-600 text-white text-[9px] font-black font-mono rounded-full flex items-center justify-center shadow-md shadow-red-500/50 border border-white dark:border-slate-900 animate-in zoom-in duration-200 pointer-events-none">
                    {chatUnreadCount > 9 ? "9+" : chatUnreadCount}
                  </span>
                )}
              </div>

              <span className={`text-[10px] tracking-tight mt-1 font-semibold ${isActive ? "text-white" : "text-gray-600 dark:text-gray-300"}`}>
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
