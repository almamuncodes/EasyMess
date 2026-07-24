"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import PageLoader from "@/components/ui/PageLoader";

export default function BazaarAnalysisRedirect() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) return;

    if (!session?.user?.id) {
      router.push("/signin");
      return;
    }

    const cachedRole = typeof window !== "undefined" ? sessionStorage.getItem(`user_role_${session.user.id}`) : null;
    if (cachedRole === "manager" || cachedRole === "admin") {
      router.replace("/dashboard/manager-dashboard/bazaar-analysis");
    } else {
      router.replace("/dashboard/user-dashboard/bazaar-analysis");
    }
  }, [session, isPending, router]);

  return <PageLoader text="Redirecting to Bazaar Analysis..." />;
}
