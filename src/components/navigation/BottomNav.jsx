"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
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

  const tabs = [
    {
      name: t("home"),
      href: "/",
      icon: Home,
    },
    {
      name: t("dashboard"),
      href: dashboardHref,
      icon: LayoutDashboard,
    },
    {
      name: t("notice"),
      href: "/notice",
      icon: ClipboardList,
    },
    {
      name: t("profile"),
      href: "/profile",
      icon: User,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-50/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-gray-100 dark:border-slate-800/80 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] px-4 py-2 pb-safe-bottom">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-1.5 py-1 px-3.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? "text-orange-500 font-semibold"
                  : "text-gray-500 dark:text-gray-400 hover:text-orange-400"
              }`}
            >
              <Icon size={20} className={isActive ? "scale-110" : "scale-100"} />
              <span className="text-[10px] tracking-tight">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
