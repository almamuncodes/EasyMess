'use client';
import { GetUser } from '@/components/action/action';
import { AlertTriangle, Home, Loader2, UtensilsCrossed } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/useTranslation";


import PageLoader from '@/components/ui/PageLoader';

const Page = () => {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = GetUser();
  const userId = user?.user?.id;
  const router = useRouter();
  const { t } = useTranslation();

  const redirectByRole = (r) => {
    if (r === "member") {
      router.replace("/dashboard/user-dashboard/overview");
    } else if (r === "manager") {
      router.replace("/dashboard/manager-dashboard/overview");
    } else if (r === "admin") {
      router.replace("/dashboard/admin-dashboard/overview");
    }
  };

  useEffect(() => {
    if (!user) {
      router.push("/signin");
    }
  }, [user, router]);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      // Check cache first for instant zero-lag redirect
      const cachedRole = typeof window !== "undefined" ? sessionStorage.getItem(`user_role_${userId}`) : null;
      if (cachedRole) {
        setRole(cachedRole);
        setLoading(false);
        redirectByRole(cachedRole);
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/member/role/${userId}`);
        const data = await res.json();
        
        if (data.role) {
          setRole(data.role);
          if (typeof window !== "undefined") {
            sessionStorage.setItem(`user_role_${userId}`, data.role);
          }
          redirectByRole(data.role);
        } else {
          setRole(null);
          if (typeof window !== "undefined") {
            sessionStorage.removeItem(`user_role_${userId}`);
          }
        }
      } catch (error) {
        console.error("Error fetching role:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [userId, router]);

  if (loading) {
    return <PageLoader text={t("checkingAccess")} />;
  }

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-lg bg-white p-8 rounded-3xl shadow-lg border border-gray-100 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-orange-50 flex items-center justify-center mb-6">
            <AlertTriangle className="w-12 h-12 text-orange-500" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-3">
            {t("messAccessRequired")}
          </h1>
          <p className="text-gray-500 mb-8 max-w-sm">
            {t("notAMember")}
          </p>
          <Link
            href="/"
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-all shadow-md hover:shadow-orange-200"
          >
            <Home size={20} />
            {t("backToHome")}
          </Link>
        </div>
      </div>
    );
  }

  // ✅ role paoar por-o same visual language (card + icon + CTA)
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-slate-950">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-slate-800 flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-full bg-orange-50 dark:bg-slate-800 flex items-center justify-center mb-6">
          <UtensilsCrossed className="w-12 h-12 text-orange-500" />
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-2">
          {t("welcomeBack")}
        </h1>
        <p className="text-gray-500 dark:text-slate-400 mb-1">
          {t("loggedInAs")}
        </p>
        <span className="px-4 py-1 rounded-full bg-orange-100 dark:bg-slate-800 text-orange-600 dark:text-orange-400 font-semibold text-sm capitalize mb-6">
          {role}
        </span>
        <p className="text-gray-400 dark:text-slate-500 text-sm">
          {t("dashboardContent")}
        </p>
      </div>
    </div>
  );
};

export default Page;