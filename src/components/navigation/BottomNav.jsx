"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, LayoutDashboard, ClipboardList, User } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useTranslation } from "@/lib/useTranslation";

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
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
    <div className="md:hidden fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto pointer-events-none">
      <div className="pointer-events-auto relative bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl backdrop-saturate-180 border border-gray-200/90 dark:border-white/15 shadow-[0_12px_35px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] rounded-[26px] p-1.5 px-3 flex justify-around items-center ring-1 ring-black/5 dark:ring-white/10 transition-all duration-300 overflow-hidden">
        {/* Specular Top Edge Light */}
        <div className="absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent pointer-events-none" />

        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            pathname === tab.href ||
            (tab.href !== "/" && pathname.startsWith(tab.href));

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`relative flex flex-col items-center justify-center py-2 px-4 rounded-2xl transition-all duration-200 active:scale-95 select-none ${
                isActive
                  ? "text-white font-bold scale-105"
                  : "text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-gray-200"
              }`}
            >
              {/* Active Tab Highlight Capsule */}
              {isActive && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 shadow-md shadow-orange-500/25 border border-orange-400/40 transition-all duration-300 -z-10" />
              )}

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
