"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";
import { useTranslation } from "@/lib/useTranslation";
import PageLoader from "@/components/ui/PageLoader";
import { preloadImage, getOptimizedImageUrl, shimmerBlurDataUrl } from "@/lib/image-utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// today date and time in Beijing time
const BD_OFFSET_MS = 6 * 60 * 60 * 1000;

function todayDateString() {
  const bdNow = new Date(Date.now() + BD_OFFSET_MS);
  return bdNow.toISOString().slice(0, 10);
}

function getBDMonthYear() {
  const bdNow = new Date(Date.now() + BD_OFFSET_MS);
  return { month: bdNow.getUTCMonth() + 1, year: bdNow.getUTCFullYear() };
}

export default function LandingPage() {
  const { data: session, isPending } = authClient.useSession();
  const { t, lang } = useTranslation();

  // null = এখনো চেক করা হচ্ছে, false = mess নেই, true = mess আছে
  const [hasMess, setHasMess] = useState(() => {
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem("user_has_mess");
      if (cached !== null) return cached === "true";
    }
    return null;
  });

  const [checkingMess, setCheckingMess] = useState(() => {
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem("user_has_mess");
      if (cached !== null) return false;
    }
    return true;
  });

  // Today's meal counts (read-only overview)
  const [todayMeals, setTodayMeals] = useState(() => {
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem("cached_today_meals");
      if (cached) {
        try { return JSON.parse(cached); } catch (e) {}
      }
    }
    return null;
  });
  const [mealsLoading, setMealsLoading] = useState(() => !todayMeals);
  const [mealError, setMealError] = useState("");

  // Mess info (name, manager, member count) + this month's meal rate/bill — also read-only
  const [messInfo, setMessInfo] = useState(() => {
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem("cached_mess_info");
      if (cached) {
        try { return JSON.parse(cached); } catch (e) {}
      }
    }
    return null;
  });
  const [monthSummary, setMonthSummary] = useState(() => {
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem("cached_month_summary");
      if (cached) {
        try { return JSON.parse(cached); } catch (e) {}
      }
    }
    return null;
  });
  const [overviewLoading, setOverviewLoading] = useState(() => !messInfo);

  const [selectedMember, setSelectedMember] = useState(null);

  // Simulator states for interactive calculator
  const [calcBazaar, setCalcBazaar] = useState(6000);
  const [calcMeals, setCalcMeals] = useState(120);
  const [calcMyMeals, setCalcMyMeals] = useState(30);
  const [calcDeposit, setCalcDeposit] = useState(2000);

  const today = todayDateString();

  // ১. ইউজার কোনো mess-এর member কিনা চেক করা (উইথ sessionStorage ক্যাশিং)
  useEffect(() => {
    if (!session?.user?.id) {
      if (!isPending) setCheckingMess(false);
      return;
    }

    let ignore = false;
    const cacheKey = `user_has_mess_${session.user.id}`;

    // Instant cache read
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem(cacheKey) || sessionStorage.getItem("user_has_mess");
      if (cached !== null) {
        setHasMess(cached === "true");
        setCheckingMess(false);
      }
    }

    async function checkMembership() {
      try {
        const res = await fetch(
          `${API_URL}/api/member/messid/${session.user.id}`,
        );

        if (ignore) return;

        if (res.status === 404) {
          setHasMess(false);
          if (typeof window !== "undefined") {
            sessionStorage.setItem(cacheKey, "false");
            sessionStorage.setItem("user_has_mess", "false");
          }
        } else {
          const data = await res.json();
          const exists = !!data.messId;
          setHasMess(exists);
          if (typeof window !== "undefined") {
            sessionStorage.setItem(cacheKey, String(exists));
            sessionStorage.setItem("user_has_mess", String(exists));
          }
        }
      } catch (err) {
        console.error("Failed to check mess membership:", err);
        if (!ignore && hasMess === null) setHasMess(false);
      } finally {
        if (!ignore) setCheckingMess(false);
      }
    }

    checkMembership();

    return () => {
      ignore = true;
    };
  }, [session, isPending]);

  // ২. Mess পাওয়া গেলে আজকের meal status আনা (এইটা যেকোনো member এর জন্য কাজ করে, শুধু manager না)
  useEffect(() => {
    if (!hasMess || !session?.user?.id) {
      setMealsLoading(false);
      return;
    }

    let ignore = false;

    async function loadTodayMeals() {
      try {
        if (!todayMeals) setMealsLoading(true);
        setMealError("");

        const res = await fetch(
          `${API_URL}/api/mess/meals?userId=${session.user.id}&date=${today}`,
        );

        if (ignore) return;

        if (!res.ok) {
          setMealError("Could not load today's meals.");
          return;
        }

        const data = await res.json();
        setTodayMeals(data);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("cached_today_meals", JSON.stringify(data));
        }
      } catch (err) {
        console.error("Failed to load today's meals:", err);
        if (!ignore && !todayMeals) setMealError("Could not load today's meals.");
      } finally {
        if (!ignore) setMealsLoading(false);
      }
    }

    loadTodayMeals();

    return () => {
      ignore = true;
    };
  }, [hasMess, session, today]);

  // ৩. Mess-এর নাম/manager/member সংখ্যা আর এই মাসের meal rate/bill — সব read-only
  useEffect(() => {
    if (!hasMess || !session?.user?.id) {
      setOverviewLoading(false);
      return;
    }

    let ignore = false;

    async function loadOverview() {
      try {
        if (!messInfo) setOverviewLoading(true);

        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const [messRes, summaryRes] = await Promise.all([
          fetch(`${API_URL}/api/user/my-mess/${session.user.id}`),
          fetch(
            `${API_URL}/api/user/month-summary/${session.user.id}?month=${month}&year=${year}`,
          ),
        ]);

        if (ignore) return;

        if (messRes.ok) {
          const messData = await messRes.json();
          setMessInfo(messData);
          if (typeof window !== "undefined") {
            sessionStorage.setItem("cached_mess_info", JSON.stringify(messData));
          }
        }
        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          setMonthSummary(summaryData);
          if (typeof window !== "undefined") {
            sessionStorage.setItem("cached_month_summary", JSON.stringify(summaryData));
          }
        }
      } catch (err) {
        console.error("Failed to load mess overview:", err);
      } finally {
        if (!ignore) setOverviewLoading(false);
      }
    }

    loadOverview();

    return () => {
      ignore = true;
    };
  }, [hasMess, session]);

  const fonts = (
    <style jsx global>{`
      @import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap");
      .font-display {
        font-family: "Space Grotesk", sans-serif;
      }
      .font-body {
        font-family: "Inter", sans-serif;
      }
      .font-meta {
        font-family: "IBM Plex Mono", monospace;
      }
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(14px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .fade-in-up {
        opacity: 0;
        animation: fadeInUp 0.6s ease-out forwards;
      }
      @keyframes float {
        0%,
        100% {
          transform: translateY(0) rotate(-2deg);
        }
        50% {
          transform: translateY(-10px) rotate(-1deg);
        }
      }
      .float-card {
        animation: float 5s ease-in-out infinite;
      }
    `}</style>
  );

  // সেশন লোড হচ্ছে, বা লগইন থাকলে mess membership চেক হচ্ছে — flash এড়াতে skeleton (ক্যাশ থাকলে সরাসরি পেজ রেন্ডার হবে)
  if (isPending && checkingMess) {
    return <PageLoader text={lang === "en" ? "Loading EasyMess..." : "EasyMess লোড হচ্ছে..."} />;
  }

  const isBn = lang === "bn";
  const simulatedMealRate = calcMeals > 0 ? (calcBazaar / calcMeals).toFixed(2) : "0.00";
  const simulatedMyBill = calcMeals > 0 ? ((calcBazaar / calcMeals) * calcMyMeals).toFixed(0) : "0";
  const simulatedBalance = calcDeposit - Number(simulatedMyBill);

  // ================= State 1: Logged out — marketing landing ================= //
  if (!session) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 font-body text-gray-800 dark:text-slate-200">
        {fonts}

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b border-gray-100 dark:border-slate-800/80">
          <div className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 bg-orange-200/30 dark:bg-orange-950/15 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute top-20 right-0 w-72 h-72 bg-amber-200/30 dark:bg-amber-950/15 rounded-full blur-3xl" />

          <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left side text and CTA */}
            <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
              <span className="fade-in-up inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-orange-100/80 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200/50 dark:border-orange-800/30 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                {isBn ? "স্মার্ট মেস ম্যানেজার" : "Smart Mess Manager"}
              </span>

              <h1
                className="fade-in-up font-display text-4xl sm:text-5xl md:text-6xl font-black leading-tight text-gray-900 dark:text-slate-50 tracking-tight"
                style={{ animationDelay: "0.08s" }}
              >
                {isBn ? (
                  <>
                    গ্রুপ-চ্যাটের জটিল হিসাব{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">
                      ছাড়াই
                    </span>{" "}
                    মেস চালান
                  </>
                ) : (
                  <>
                    Run your mess{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">
                      without
                    </span>{" "}
                    the group-chat math
                  </>
                )}
              </h1>

              <p
                className="fade-in-up mt-6 text-base sm:text-lg text-gray-500 dark:text-slate-400 leading-relaxed max-w-xl"
                style={{ animationDelay: "0.16s" }}
              >
                {t("runMessDesc")}
              </p>

              <div
                className="fade-in-up mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
                style={{ animationDelay: "0.24s" }}
              >
                <Link
                  href="/signin"
                  className="w-full sm:w-auto text-center rounded-xl bg-[#FF6900] px-8 py-3.5 font-display text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 hover:shadow-orange-500/30 transition duration-200 active:scale-95"
                >
                  {t("loginToGetStarted")}
                </Link>
                <a
                  href="#how-it-works"
                  className="w-full sm:w-auto text-center rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-8 py-3.5 font-display text-sm font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition duration-200"
                >
                  {t("seeHowItWorks")}
                </a>
              </div>

              {/* Trust/Metric Strip */}
              <div
                className="fade-in-up mt-12 pt-8 border-t border-gray-100 dark:border-slate-800/80 flex gap-8 justify-center lg:justify-start w-full"
                style={{ animationDelay: "0.3s" }}
              >
                <div>
                  <p className="text-2xl font-black text-orange-500">100%</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">
                    {isBn ? "ফ্রি ও নির্ভুল হিসাব" : "Free & Accurate"}
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-black text-orange-500">12+</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">
                    {isBn ? "স্মার্ট ফিচার" : "Smart Features"}
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-black text-orange-500">Real-time</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">
                    {isBn ? "পুশ নোটিফিকেশন" : "Push Notifications"}
                  </p>
                </div>
              </div>
            </div>

            {/* Right side Interactive Simulator Widget */}
            <div
              className="lg:col-span-5 fade-in-up w-full"
              style={{ animationDelay: "0.32s" }}
            >
              <div className="w-full rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-gray-100 dark:border-slate-800/60 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-100/30 dark:bg-orange-950/20 rounded-full blur-xl pointer-events-none" />

                {/* Widget Header */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800/60 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📊</span>
                    <h3 className="font-display font-bold text-sm text-gray-900 dark:text-slate-100">
                      {isBn ? "লাইভ হিসাব ক্যালকুলেটর" : "Live Bill Simulator"}
                    </h3>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400">
                    Interactive
                  </span>
                </div>

                {/* Input Slider 1: Total Bazaar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">
                    <span>{isBn ? "মোট বাজার খরচ" : "Total Bazaar Cost"}</span>
                    <span className="text-orange-500 font-mono">৳{calcBazaar}</span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="20000"
                    step="500"
                    value={calcBazaar}
                    onChange={(e) => setCalcBazaar(Number(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer h-1.5 bg-gray-100 dark:bg-slate-800 rounded-lg appearance-none"
                  />
                </div>

                {/* Input Slider 2: Total Meals */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">
                    <span>{isBn ? "মোট মিল সংখ্যা" : "Total Mess Meals"}</span>
                    <span className="text-orange-500 font-mono">{calcMeals}</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="500"
                    step="10"
                    value={calcMeals}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCalcMeals(val);
                      if (calcMyMeals > val) setCalcMyMeals(val);
                    }}
                    className="w-full accent-orange-500 cursor-pointer h-1.5 bg-gray-100 dark:bg-slate-800 rounded-lg appearance-none"
                  />
                </div>

                {/* Input Slider 3: My Meals */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">
                    <span>{isBn ? "আপনার মিল সংখ্যা" : "Your Meals"}</span>
                    <span className="text-orange-500 font-mono">{calcMyMeals}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={calcMeals}
                    step="1"
                    value={calcMyMeals}
                    onChange={(e) => setCalcMyMeals(Number(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer h-1.5 bg-gray-100 dark:bg-slate-800 rounded-lg appearance-none"
                  />
                </div>

                {/* Input Slider 4: Deposit */}
                <div className="mb-5">
                  <div className="flex justify-between text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">
                    <span>{isBn ? "আপনার জমা টাকা" : "Your Deposit"}</span>
                    <span className="text-orange-500 font-mono">৳{calcDeposit}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5000"
                    step="100"
                    value={calcDeposit}
                    onChange={(e) => setCalcDeposit(Number(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer h-1.5 bg-gray-100 dark:bg-slate-800 rounded-lg appearance-none"
                  />
                </div>

                {/* Simulated Results Section */}
                <div className="bg-orange-50/50 dark:bg-orange-950/20 rounded-2xl p-4 border border-orange-100/50 dark:border-orange-900/30 grid grid-cols-2 gap-3 text-center">
                  <div className="border-r border-orange-100/50 dark:border-orange-900/20">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide">
                      {isBn ? "মিল রেট" : "Meal Rate"}
                    </p>
                    <p className="text-lg font-black text-gray-900 dark:text-slate-100 mt-0.5">
                      ৳{simulatedMealRate}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide">
                      {isBn ? "আপনার বিল" : "Your Bill"}
                    </p>
                    <p className="text-lg font-black text-gray-900 dark:text-slate-100 mt-0.5">
                      ৳{simulatedMyBill}
                    </p>
                  </div>
                  <div className="col-span-2 pt-3 border-t border-orange-100/50 dark:border-orange-900/20 flex items-center justify-between px-2">
                    <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                      {simulatedBalance >= 0
                        ? (isBn ? "ফেরত পাবেন (অগ্রিম)" : "Refund (Advance)")
                        : (isBn ? "দিতে হবে (বাকি)" : "Due (Owe)")
                      }
                    </span>
                    <span className={`text-base font-black ${simulatedBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-[#D4453A]"}`}>
                      ৳{Math.abs(simulatedBalance)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid Section */}
        <section className="py-20 bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800/80">
          <div className="mx-auto max-w-5xl px-6">
            <div className="text-center mb-16">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#FF6900] mb-2">
                {isBn ? "ফিচার সমূহ" : "Core Features"}
              </p>
              <h2 className="text-3xl font-black text-gray-900 dark:text-slate-50 tracking-tight">
                {isBn ? "ঝামেলাহীন মেস ম্যানেজমেন্টের অনন্য সমাধান" : "A cleaner, simpler way to run things"}
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {[
                {
                  icon: "🍽️",
                  title: t("trackMealsTitle"),
                  copy: t("trackMealsDesc"),
                  badge: isBn ? "প্রতিদিনের" : "Daily"
                },
                {
                  icon: "🛒",
                  title: t("splitBillsTitle"),
                  copy: t("splitBillsDesc"),
                  badge: isBn ? "স্বয়ংক্রিয়" : "Automated"
                },
                {
                  icon: "💰",
                  title: t("seeWhoOwesTitle"),
                  copy: t("seeWhoOwesDesc"),
                  badge: isBn ? "রানিং ব্যালেন্স" : "Real-time"
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="group relative rounded-2xl border border-gray-100 dark:border-slate-850 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md hover:border-orange-100 dark:hover:border-orange-900/40 transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {f.icon}
                  </div>
                  <h3 className="font-display font-bold text-base text-gray-900 dark:text-slate-100 mb-1.5 flex items-center justify-between">
                    {f.title}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500">
                      {f.badge}
                    </span>
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{f.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works Section */}
        <section id="how-it-works" className="py-20 bg-gradient-to-br from-white via-[#FBFBF9] to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          <div className="mx-auto max-w-5xl px-6">
            <div className="text-center mb-16">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#FF6900] mb-2">
                {t("howItWorks")}
              </p>
              <h2 className="text-3xl font-black text-gray-900 dark:text-slate-50 tracking-tight">
                {isBn ? "মাত্র ৩টি ধাপে মেস হিসাব শুরু করুন" : "Set up your mess in 3 easy steps"}
              </h2>
            </div>

            <div className="grid gap-8 sm:grid-cols-3 relative">
              {[
                {
                  step: "01",
                  title: t("step1Title"),
                  copy: t("step1Desc"),
                  icon: "🔑",
                },
                {
                  step: "02",
                  title: t("step2Title"),
                  copy: t("step2Desc"),
                  icon: "⏰",
                },
                {
                  step: "03",
                  title: t("step3Title"),
                  copy: t("step3Desc"),
                  icon: "📈",
                },
              ].map((s, idx) => (
                <div key={s.step} className="flex flex-col items-center sm:items-start text-center sm:text-left relative group">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-display text-4xl font-black text-orange-500/20 group-hover:text-orange-500/40 transition-colors duration-300">
                      {s.step}
                    </span>
                    <span className="w-8 h-8 rounded-lg bg-orange-100/50 dark:bg-orange-950/30 flex items-center justify-center text-sm">
                      {s.icon}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-base text-gray-900 dark:text-slate-100 mb-2">
                    {s.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{s.copy}</p>

                  {idx < 2 && (
                    <div className="hidden sm:block absolute top-5 -right-4 w-8 h-[2px] bg-gradient-to-r from-orange-200 to-transparent dark:from-orange-900" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>



        {/* Action Banner (CTA) */}
        <section className="py-16 mx-auto max-w-5xl px-6 mb-12">
          <div className="rounded-3xl bg-gradient-to-br from-orange-500 to-amber-500 p-8 sm:p-12 text-white text-center relative overflow-hidden shadow-lg shadow-orange-500/10">
            <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-2xl animate-pulse" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 w-48 h-48 bg-white/10 rounded-full blur-2xl" />

            <div className="relative max-w-md mx-auto">
              <h2 className="text-2xl sm:text-3xl font-black mb-3">
                {isBn ? "ঝামেলাহীন মেস শুরু হোক আজই" : "Start your paperless mess today"}
              </h2>
              <p className="text-orange-50 text-sm mb-8 leading-relaxed opacity-95">
                {isBn
                  ? "সব মেম্বারকে একসাথে আনুন, মিল আর বাজারের স্বচ্ছ হিসাব রাখুন সম্পূর্ণ বিনামূল্যে।"
                  : "Invite your members, log meals, track costs, and calculate balances automatically."}
              </p>
              <Link
                href="/signup"
                className="inline-block rounded-xl bg-white px-8 py-3.5 font-display text-sm font-bold text-orange-600 shadow-md hover:bg-orange-50 transition active:scale-95"
              >
                {isBn ? "ফ্রি রেজিস্ট্রেশন করুন" : "Sign Up For Free"}
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ================= State 2: Logged in, no mess yet ================= //
  if (!hasMess) {
    return (
      <div className="min-h-screen bg-[#F3F1EC] font-body">
        {fonts}
        <section className="flex min-h-screen items-center justify-center px-4 py-16">
          <div className="w-full max-w-3xl">
            <p className="fade-in-up text-center font-meta text-[11px] uppercase tracking-[0.3em] text-[#FF6900]">
              EasyMess
            </p>
            <h1
              className="fade-in-up font-display mt-3 text-center text-4xl font-bold text-[#16181D] sm:text-5xl"
              style={{ animationDelay: "0.06s" }}
            >
              {t("welcomeToEasyMess")}
            </h1>
            <p
              className="fade-in-up mt-4 text-center text-[#6b6f76]"
              style={{ animationDelay: "0.12s" }}
            >
              {t("createOrJoinDesc")}
            </p>

            <div
              className="fade-in-up mt-12 grid gap-6 md:grid-cols-2"
              style={{ animationDelay: "0.18s" }}
            >
              <Link
                href="/create-mess"
                className="mx-6 flex flex-col items-center justify-center gap-2 rounded-2xl bg-[#FF6900] p-8 text-center text-white shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-1 hover:bg-[#e55f00] hover:shadow-orange-500/30 active:scale-95 sm:mx-0"
              >
                <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                  {t("createMessButton")}
                </h2>
                <p className="mt-1 text-sm font-medium text-orange-50 opacity-90 md:text-base">
                  {t("startAndManageDesc")}
                </p>
              </Link>

              <Link
                href="/join-mess"
                className="mx-6 flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#E7E5E1] bg-white p-8 text-center shadow-lg transition-all hover:-translate-y-1 hover:shadow-orange-200/40 active:scale-95 sm:mx-0"
              >
                <h2 className="font-display text-xl font-bold text-[#16181D] sm:text-2xl">
                  {t("joinMessButton")}
                </h2>
                <p className="mt-1 text-sm text-[#6b6f76]">
                  {t("joinExistingDesc")}
                </p>
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ================= State 3: Member of an existing mess — read-only overview ================= //
  const mealTypes = [
    { key: "breakfast", label: lang === "en" ? "Breakfast" : "সকাল" },
    { key: "lunch", label: lang === "en" ? "Lunch" : "দুপুর" },
    { key: "dinner", label: lang === "en" ? "Dinner" : "রাত" },
  ];

  return (
    <div className="min-h-screen bg-[#F3F1EC] font-body">
      {fonts}
      <section className="mx-auto max-w-2xl px-4 py-14">
        <p className="font-meta text-[11px] uppercase tracking-[0.3em] text-[#FF6900]">
          EasyMess
        </p>

        {overviewLoading ? (
          <div className="mt-2 h-9 w-48 animate-pulse rounded-lg bg-[#E7E5E1]" />
        ) : (
          <>
            <h1 className="font-display mt-2 text-3xl font-bold text-[#16181D]">
              {messInfo?.messName || (lang === "en" ? "Your mess" : "আপনার মেস")}
            </h1>
            <p className="mt-1 font-meta text-xs text-[#9a9691]">
              {messInfo?.totalMembers ?? "—"} {t("members")} · {lang === "en" ? "managed by" : "পরিচালনায়"} {" "}
              {messInfo?.managerName || "—"}
            </p>
          </>
        )}

        {/* This month's rate & bill — read-only, straight from the ledger */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white p-4 text-center shadow-[0_1px_2px_rgba(22,24,29,0.04)] ring-1 ring-[#EAE7E0]">
            <p className="font-meta text-[10px] uppercase tracking-wide text-[#9a9691]">
              {t("mealRate")}
            </p>
            <p className="font-display mt-1 text-xl font-bold text-[#16181D]">
              {monthSummary ? `৳${monthSummary.mealRate}` : "—"}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 text-center shadow-[0_1px_2px_rgba(22,24,29,0.04)] ring-1 ring-[#EAE7E0]">
            <p className="font-meta text-[10px] uppercase tracking-wide text-[#9a9691]">
              {t("yourBill")}
            </p>
            <p className="font-display mt-1 text-xl font-bold text-[#16181D]">
              {monthSummary ? `৳${monthSummary.bill}` : "—"}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 text-center shadow-[0_1px_2px_rgba(22,24,29,0.04)] ring-1 ring-[#EAE7E0]">
            <p className="font-meta text-[10px] uppercase tracking-wide text-[#9a9691]">
              {monthSummary?.status === "due" ? t("youOwe") : t("advance")}
            </p>
            <p
              className={`font-display mt-1 text-xl font-bold ${
                monthSummary?.status === "due"
                  ? "text-[#D4453A]"
                  : "text-[#16181D]"
              }`}
            >
              {monthSummary ? `৳${Math.abs(monthSummary.balance)}` : "—"}
            </p>
          </div>
        </div>

        <h2 className="font-display mt-10 text-xl font-semibold text-[#16181D]">
          {t("todaysMeals")}
        </h2>
        <p className="mt-1 font-meta text-xs text-[#9a9691]">
          {new Date().toLocaleDateString(lang === "en" ? "en-US" : "bn-BD", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>

        {mealsLoading ? (
          <div className="mt-6 flex items-center gap-3 font-meta text-xs uppercase tracking-[0.2em] text-[#9a9691]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#FF6900]" />
            {t("loadingTodayMeals")}
          </div>
        ) : !todayMeals ? (
          <p className="mt-6 font-meta text-xs text-[#D4453A]">
            {mealError ? t("couldNotLoadMeals") : t("couldNotLoadMeals")}
          </p>
        ) : (
          <>
            {/* Summary — how many members are eating each meal today */}
            <div className="mt-4 grid grid-cols-3 gap-4">
              {mealTypes.map((m) => (
                <div
                  key={m.key}
                  className="rounded-2xl bg-white p-4 text-center shadow-[0_1px_2px_rgba(22,24,29,0.04)] ring-1 ring-[#EAE7E0]"
                >
                  <p className="font-meta text-[10px] uppercase tracking-wide text-[#9a9691]">
                    {m.label}
                  </p>
                  <p className="font-display mt-1 text-2xl font-bold text-[#16181D]">
                    {todayMeals.summary?.[m.key] ?? 0}
                  </p>
                  <p className="font-meta text-[10px] text-[#9a9691]">
                    {t("eatingOf")} {todayMeals.members.length} {t("eating")}
                  </p>
                </div>
              ))}
            </div>

            {/* Who's eating what — view only, nobody can change anything from here */}
            <div className="mt-6 rounded-2xl bg-white shadow-[0_1px_2px_rgba(22,24,29,0.04)] ring-1 ring-[#EAE7E0]">
              <div className="flex items-center justify-between border-b border-[#E7E5E1] px-5 py-3">
                <p className="font-meta text-[10px] uppercase tracking-wide text-[#9a9691]">
                  {t("memberHeader")}
                </p>
                <div className="flex gap-6">
                  {mealTypes.map((m) => (
                    <p
                      key={m.key}
                      className="w-8 text-center font-meta text-[10px] uppercase tracking-wide text-[#9a9691]"
                    >
                      {m.label.slice(0, 1)}
                    </p>
                  ))}
                </div>
              </div>

              {todayMeals.members.map((member) => {
                const isMe = member.userId === session.user.id;
                return (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between px-5 py-3 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-[#F3F1EC]"
                  >
                    <div className="flex items-center gap-2.5">
                      {member.image ? (
                        <Image
                          width={48}
                          height={48}
                          src={getOptimizedImageUrl(member.image, { width: 96, height: 96 })}
                          alt={member.name}
                          unoptimized={typeof member.image === "string" && member.image.startsWith("http")}
                          className="h-8 w-8 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                          onMouseEnter={() => preloadImage(member.image, { width: 400, height: 400 })}
                          onClick={() => setSelectedMember(member)}
                        />
                      ) : (
                        <span 
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF6900]/10 font-meta text-xs font-semibold text-[#FF6900] cursor-pointer hover:bg-[#FF6900]/20 transition-colors"
                          onClick={() => setSelectedMember(member)}
                        >
                          {member.name?.charAt(0) || "?"}
                        </span>
                      )}
                      <span className="text-sm font-medium text-[#16181D]">
                        {isMe ? t("youLabel") : member.name}
                        {member.role === "manager" && (
                          <span className="ml-1.5 font-meta text-[9px] uppercase tracking-wide text-[#9a9691]">
                            {t("managerLabel")}
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex gap-6">
                      {mealTypes.map((m) => (
                        <span
                          key={m.key}
                          className={`block h-2.5 w-2.5 self-center rounded-full ${
                            member[m.key] ? "bg-[#FF6900]" : "bg-[#E7E5E1]"
                          }`}
                          title={`${isMe ? t("youLabel") : member.name} — ${
                            m.label
                          } ${member[m.key] ? "on" : "off"}`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-4 font-meta text-[11px] text-[#9a9691]">
              {t("viewOnlyDesc")}
            </p>
          </>
        )}
      </section>

      {/* Enlarged Member Profile Detail Modal */}
      {selectedMember && (
        <div 
          className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 pb-20 md:pb-4 backdrop-blur-sm transition-all duration-300"
          onClick={() => setSelectedMember(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center text-center relative border border-gray-100 dark:border-slate-800 transform transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-xl font-bold transition-colors"
              onClick={() => setSelectedMember(null)}
              aria-label="Close modal"
            >
              ✕
            </button>
            
            {selectedMember.image ? (
              <Image 
                src={getOptimizedImageUrl(selectedMember.image, { width: 400, height: 400 })} 
                alt={selectedMember.name} 
                width={192}
                height={192}
                unoptimized={typeof selectedMember.image === "string" && selectedMember.image.startsWith("http")}
                sizes="(max-width: 640px) 150px, (max-width: 1024px) 300px, 400px"
                className="w-48 h-48 rounded-2xl object-cover mb-4 shadow-lg border border-gray-100 dark:border-slate-800"
              />
            ) : (
              <div className="w-48 h-48 rounded-2xl bg-orange-50 dark:bg-slate-850 flex items-center justify-center mb-4 border border-orange-100 dark:border-slate-800">
                <span className="text-5xl font-bold text-orange-500">
                  {selectedMember.name?.charAt(0) || "?"}
                </span>
              </div>
            )}
            
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mb-1">
              {selectedMember.name}
            </h3>
            {selectedMember.role && (
              <span className="px-3 py-1 rounded-full bg-orange-50 dark:bg-slate-800 text-orange-600 dark:text-orange-400 font-semibold text-xs capitalize mt-1">
                {selectedMember.role}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}