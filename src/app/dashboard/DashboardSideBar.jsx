"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Home,
  Users,
  Utensils,
  Receipt,
  Wallet,
  Settings,
  Store,
  Building,
  BarChart3,
  UserCog,
  ClipboardClock,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/useTranslation";

export default function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { t, lang } = useTranslation();

  useEffect(() => {
    const loadSessionAndRole = async () => {
      try {
        const sessionRes = await authClient.getSession();
        const userId = sessionRes?.data?.user?.id;
        if (!userId) return;

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/member/role/${userId}`);
        const data = await res.json();
        setRole(data.role);
      } catch (error) {
        console.error("Error loading session/role:", error);
      }
    };

    if (mounted) {
      loadSessionAndRole();
    }
  }, [mounted]);

  if (!mounted) {
    return (
      <aside className="hidden md:flex flex-col w-64 min-h-screen bg-white border-r border-gray-100 p-6 animate-pulse">
        <div className="mb-10">
          <div className="h-4 bg-gray-100 rounded w-20 px-4"></div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="h-10 bg-gray-50 rounded-xl"></div>
          <div className="h-10 bg-gray-50 rounded-xl"></div>
          <div className="h-10 bg-gray-50 rounded-xl"></div>
        </div>
      </aside>
    );
  }

  const menuItems = [
    {
      name: t("overview"),
      href: "/dashboard/user-dashboard/overview",
      icon: LayoutDashboard,
      roles: ["member"],
    },
    {
      name: t("overview"),
      href: "/dashboard/manager-dashboard/overview",
      icon: LayoutDashboard,
      roles: [ "manager"],
    },
    {
      name: t("overview"),
      href: "/dashboard/admin-dashboard/overview",
      icon: LayoutDashboard,
      roles: [ "admin"],
    },
    {
      name: t("myMess"),
      href: "/dashboard/manager-dashboard/my-mess",
      icon: Home,
      roles: [ "manager"],
    },
    {
      name: t("myMeals"),
      href: "/dashboard/manager-dashboard/my-meals",
      icon: Utensils,
      roles: [ "manager"],
    },
    {
      name: t("myMess"),
      href: "/dashboard/user-dashboard/my-mess",
      icon: Home,
      roles: ["member"],
    },
    {
      name: t("mealsSidebar"),
      href: "/dashboard/user-dashboard/meals",
      icon: Utensils,
      roles: ["member"],
    },
    {
      name: t("billsSidebar"),
      href: "/dashboard/manager-dashboard/bills",
      icon: Receipt,
      roles: [ "manager"],
    },
    {
      name: t("billsSidebar"),
      href: "/dashboard/user-dashboard/bills",
      icon: Receipt,
      roles: ["member"],
    },
    { name: t("membersSidebar"), href: "/dashboard/manager-dashboard/members", icon: Users, roles: ["manager"] },
    { name: t("bazaarSidebar"), href: "/dashboard/manager-dashboard/bazaar", icon: Store, roles: ["manager"] },
    { name: t("bazaarAnalysis"), href: "/dashboard/manager-dashboard/bazaar-analysis", icon: BarChart3, roles: ["manager"] },
    { name: t("bazaarAnalysis"), href: "/dashboard/user-dashboard/bazaar-analysis", icon: BarChart3, roles: ["member"] },
    { name: t("paymentsSidebar"), href: "/dashboard/manager-dashboard/payments", icon: Wallet, roles: ["manager"] },
    { name: t("pendingRequestsSidebar"), href: "/dashboard/manager-dashboard/pending-requests", icon:  ClipboardClock, roles: ["manager"] },
    {
      name: t("allMessesSidebar"),
      href: "/dashboard/admin-dashboard/messes",
      icon: Building,
      roles: ["admin"],
    },
    {
      name: t("managersSidebar"),
      href: "/admin/managers",
      icon: UserCog,
      roles: ["admin"],
    },
    { name: t("usersSidebar"), href: "/admin/users", icon: Users, roles: ["admin"] },
    {
      name: t("analyticsSidebar"),
      href: "/admin/analytics",
      icon: BarChart3,
      roles: ["admin"],
    },
    {
      name: t("settingsSidebar"),
      href: "/settings",
      icon: Settings,
      roles: ["pore thik korbo ata "],
    },
    {
      name: t("settingsSidebar"),
      href: "/dashboard/manager-dashboard/settings",
      icon: Settings,
      roles: [ "manager"],
    },
    {
      name: t("settingsSidebar"),
      href: "/settings",
      icon: Settings,
      roles: [ "admin"],
    },
  ];

  const filteredItems = menuItems.filter((item) => item.roles.includes(role));

  if (!role) {
    return (
      <p className="text-center
    text-gray-600
    text-xl
    font-semibold
    max-w-md
    mx-auto
    leading-relaxed
   
  ">
        Please create or join a mess first to access your dashboard
      </p>
    );
  }

  return (
    <>
      {/*  Horizontal Scrollable Menu */}
      <nav className="md:hidden flex overflow-x-auto w-full bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 p-2 gap-2 scrollbar-hide">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition ${
                isActive
                  ? "bg-orange-500 text-white"
                  : "text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-800"
              }`}
            >
              <Icon size={16} />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 p-6">
        <div className="mb-10">
          <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-4">
            {role ? `${role.toUpperCase()} ${lang === "en" ? "Dashboard" : "ড্যাশবোর্ড"}` : (lang === "en" ? "Menu" : "মেনু")}
          </h2>
        </div>
        <nav className="flex flex-col gap-1.5">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  isActive
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-200/20"
                    : "text-gray-600 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-slate-800 hover:text-orange-600 dark:hover:text-orange-400"
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
