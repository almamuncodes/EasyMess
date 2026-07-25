"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import PageLoader from "@/components/ui/PageLoader";

export default function ManagerMembersPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/manager-dashboard/meal-management");
  }, [router]);

  return <PageLoader text="Redirecting to Meal Management..." />;
}