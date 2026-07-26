"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AlertTriangle, Home } from "lucide-react";
import Sidebar from "./DashboardSideBar";
import { useTranslation } from "@/lib/useTranslation";
import { authClient } from "@/lib/auth-client";
import PageLoader from "@/components/ui/PageLoader";
import BroadcastModalListener from "@/components/BroadcastModalListener";

export default function DashboardGuard({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();

  const { data: session, isPending: isSessionLoading } = authClient.useSession();
  const userId = session?.user?.id;

  const [role, setRole] = useState(() => {
    if (typeof window !== "undefined" && userId) {
      return sessionStorage.getItem(`user_role_${userId}`) || sessionStorage.getItem("user_role") || null;
    }
    return null;
  });
  const [loading, setLoading] = useState(!role);

  useEffect(() => {
    if (!isSessionLoading && !session) {
      router.push("/signin");
    }
  }, [isSessionLoading, session, router]);

  useEffect(() => {
    let isSubscribed = true;

    async function checkRole() {
      if (!userId) {
        if (!isSessionLoading) setLoading(false);
        return;
      }

      // Check sessionStorage cache
      const cachedRole = sessionStorage.getItem(`user_role_${userId}`) || sessionStorage.getItem("user_role");
      if (cachedRole && isSubscribed) {
        setRole(cachedRole);
        setLoading(false);
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/member/role/${userId}`);
        const data = await res.json();
        
        if (isSubscribed) {
          if (data.role) {
            setRole(data.role);
            sessionStorage.setItem(`user_role_${userId}`, data.role);
            sessionStorage.setItem("user_role", data.role);
            // Set cookie so proxy middleware can identify role
            document.cookie = `em_user_role=${data.role}; path=/; SameSite=Strict`;
          } else {
            setRole(null);
            sessionStorage.removeItem(`user_role_${userId}`);
            sessionStorage.removeItem("user_role");
            document.cookie = "em_user_role=; path=/; max-age=0";
          }
        }
      } catch (err) {
        console.error("Error checking user role:", err);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    }

    checkRole();

    return () => {
      isSubscribed = false;
    };
  }, [userId, isSessionLoading]);

  // Handle role-based sub-route authorization + maintenance mode check
  useEffect(() => {
    if (!role) return;

    if (role === "member" && pathname.startsWith("/dashboard/manager-dashboard")) {
      router.replace("/dashboard/user-dashboard/overview");
    }

    if (role !== "admin" && pathname.startsWith("/dashboard/admin-dashboard")) {
      if (role === "manager") {
        router.replace("/dashboard/manager-dashboard/overview");
      } else {
        router.replace("/dashboard/user-dashboard/overview");
      }
    }

    // Maintenance mode check for non-admins inside the dashboard (cached for 60s to avoid spamming the endpoint)
    if (role !== "admin") {
      const now = Date.now();
      const cachedTimeStr = typeof window !== "undefined" ? sessionStorage.getItem("cached_maintenance_time") : null;
      const cachedStatus = typeof window !== "undefined" ? sessionStorage.getItem("cached_maintenance_status") : null;
      const cachedTime = cachedTimeStr ? Number(cachedTimeStr) : 0;

      if (cachedStatus && (now - cachedTime < 60000)) {
        if (cachedStatus === "true") {
          router.replace("/maintenance");
        }
      } else {
        fetch("/api/maintenance-status")
          .then((r) => r.json())
          .then(({ maintenanceMode }) => {
            if (typeof window !== "undefined") {
              sessionStorage.setItem("cached_maintenance_time", String(now));
              sessionStorage.setItem("cached_maintenance_status", String(maintenanceMode));
            }
            if (maintenanceMode) {
              router.replace("/maintenance");
            }
          })
          .catch(() => {});
      }
    }
  }, [role, pathname, router]);

  if (isSessionLoading || loading) {
    return <PageLoader text={t("checkingAccess")} />;
  }

  // 🔒 PROTECTED ROUTE CHECK: User is not in any mess
  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gray-50 dark:bg-slate-950">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-[32px] shadow-xl border border-gray-100/80 dark:border-slate-800 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
          {/* Circular Warning Badge */}
          <div className="w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mb-6 ring-8 ring-amber-50/50 dark:ring-amber-500/5">
            <AlertTriangle className="w-10 h-10 text-orange-500 stroke-[2.2]" />
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
            {t("messAccessRequired")}
          </h1>

          {/* Description */}
          <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed mb-8 max-w-xs">
            {t("notAMember")}
          </p>

          {/* Action Button */}
          <div className="w-full space-y-3">
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-bold text-sm transition-all shadow-md shadow-orange-500/25"
            >
              <Home className="w-4 h-4" />
              {t("backToHome")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ✅ USER HAS MESS ACCESS: Render normal sidebar + main layout children
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      {/* Sidebar */}
      <aside className="w-full md:w-64 shrink-0 bg-white dark:bg-slate-900">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 bg-gray-50 dark:bg-slate-950">
        {children}
      </main>

      {/* Global System Broadcast Popup Modal */}
      <BroadcastModalListener />
    </div>
  );
}
