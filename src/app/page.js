"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// আজকের তারিখ YYYY-MM-DD ফরম্যাটে
function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export default function LandingPage() {
  const { data: session, isPending } = authClient.useSession();

  // null = এখনো চেক করা হচ্ছে, false = mess নেই, true = mess আছে
  const [hasMess, setHasMess] = useState(null);
  const [checkingMess, setCheckingMess] = useState(true);

  // Today's meal counts (read-only overview)
  const [todayMeals, setTodayMeals] = useState(null); // { summary, members }
  const [mealsLoading, setMealsLoading] = useState(true);
  const [mealError, setMealError] = useState("");

  // Mess info (name, manager, member count) + this month's meal rate/bill — also read-only
  const [messInfo, setMessInfo] = useState(null);
  const [monthSummary, setMonthSummary] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  const today = todayDateString();

  // ১. ইউজার কোনো mess-এর member কিনা চেক করা
  useEffect(() => {
    if (!session?.user?.id) {
      setCheckingMess(false);
      return;
    }

    let ignore = false;

    async function checkMembership() {
      try {
        setCheckingMess(true);

        const res = await fetch(
          `${API_URL}/api/member/messid/${session.user.id}`,
        );

        if (ignore) return;

        // ব্যাকএন্ড 404 পাঠায় যখন ইউজার কোনো মেসের মেম্বার না
        if (res.status === 404) {
          setHasMess(false);
        } else {
          const data = await res.json();
          setHasMess(!!data.messId);
        }
      } catch (err) {
        console.error("Failed to check mess membership:", err);
        if (!ignore) setHasMess(false);
      } finally {
        if (!ignore) setCheckingMess(false);
      }
    }

    checkMembership();

    return () => {
      ignore = true;
    };
  }, [session]);

  // ২. Mess পাওয়া গেলে আজকের meal status আনা (এইটা যেকোনো member এর জন্য কাজ করে, শুধু manager না)
  useEffect(() => {
    if (!hasMess || !session?.user?.id) {
      setMealsLoading(false);
      return;
    }

    let ignore = false;

    async function loadTodayMeals() {
      try {
        setMealsLoading(true);
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
      } catch (err) {
        console.error("Failed to load today's meals:", err);
        if (!ignore) setMealError("Could not load today's meals.");
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
        setOverviewLoading(true);

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

        if (messRes.ok) setMessInfo(await messRes.json());
        if (summaryRes.ok) setMonthSummary(await summaryRes.json());
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

  // সেশন লোড হচ্ছে, বা লগইন থাকলে mess membership চেক হচ্ছে — flash এড়াতে skeleton
  if (isPending || (session && checkingMess)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F1EC]">
        {fonts}
        <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-[#9a9691]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#FF6900]" />
          Loading EasyMess
        </div>
      </div>
    );
  }

  // ================= State 1: Logged out — marketing landing ================= //
  if (!session) {
    return (
      <div className="min-h-screen bg-[#F3F1EC] font-body">
        {fonts}

        <section className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16">
          <p className="fade-in-up font-meta text-[11px] uppercase tracking-[0.3em] text-[#FF6900]">
            EasyMess
          </p>

          <h1
            className="fade-in-up font-display mt-4 max-w-2xl text-center text-4xl font-bold leading-tight text-[#16181D] sm:text-5xl"
            style={{ animationDelay: "0.08s" }}
          >
            Run your mess without the group-chat math
          </h1>

          <p
            className="fade-in-up mt-5 max-w-md text-center text-[#6b6f76]"
            style={{ animationDelay: "0.16s" }}
          >
            Track meals, split grocery bills, and always know who owes what —
            all in one place for your mess.
          </p>

          <div
            className="fade-in-up mt-8 flex flex-col items-center gap-3 sm:flex-row"
            style={{ animationDelay: "0.24s" }}
          >
            <Link
              href="/login"
              className="rounded-full bg-[#FF6900] px-7 py-3 font-display text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 hover:bg-[#e55f00] hover:shadow-orange-500/30 active:scale-95"
            >
              Log in to get started
            </Link>
            <a
              href="#how-it-works"
              className="font-display text-sm font-semibold text-[#16181D] underline decoration-[#E7E5E1] underline-offset-4 hover:decoration-[#FF6900]"
            >
              See how it works
            </a>
          </div>

          {/* Signature element: a floating "mess ledger" card, grounded in the actual subject */}
          <div
            className="float-card fade-in-up mt-14 w-full max-w-sm rounded-2xl bg-white p-5 shadow-[0_8px_30px_-10px_rgba(22,24,29,0.25)] ring-1 ring-[#EAE7E0]"
            style={{ animationDelay: "0.32s" }}
          >
            <div className="flex items-center justify-between">
              <p className="font-meta text-[10px] uppercase tracking-[0.2em] text-[#9a9691]">
                This month
              </p>
              <p className="font-meta text-[10px] uppercase tracking-[0.2em] text-[#9a9691]">
                4 members
              </p>
            </div>
            <p className="font-display mt-2 text-3xl font-bold text-[#16181D]">
              ৳4,200
            </p>
            <p className="font-meta text-xs text-[#6b6f76]">
              split evenly · ৳1,050 each
            </p>
            <div className="mt-4 flex -space-x-2">
              {["R", "S", "M", "T"].map((initial) => (
                <span
                  key={initial}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF6900]/10 font-meta text-xs font-semibold text-[#FF6900] ring-2 ring-white"
                >
                  {initial}
                </span>
              ))}
            </div>
          </div>

          {/* Feature strip */}
          <div className="mt-16 grid w-full gap-4 sm:grid-cols-3">
            {[
              {
                label: "Track meals",
                copy: "Log daily meals per member, no more paper charts.",
              },
              {
                label: "Split bills",
                copy: "Grocery costs divide automatically by meal count.",
              },
              {
                label: "See who owes",
                copy: "A live running balance for every member, always.",
              },
            ].map((f) => (
              <div
                key={f.label}
                className="rounded-2xl border border-[#E7E5E1] bg-white/60 p-5"
              >
                <p className="font-display text-sm font-semibold text-[#16181D]">
                  {f.label}
                </p>
                <p className="mt-1.5 text-sm text-[#6b6f76]">{f.copy}</p>
              </div>
            ))}
          </div>

          {/* How it works — a real sequence, so numbered steps earn their place here */}
          <div id="how-it-works" className="mt-16 w-full">
            <p className="text-center font-meta text-[11px] uppercase tracking-[0.2em] text-[#9a9691]">
              How it works
            </p>
            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Create or join a mess",
                  copy: "Start your own mess, or use an invite code to join one that already exists.",
                },
                {
                  step: "02",
                  title: "Mark your daily meals",
                  copy: "Tap on or off for breakfast, lunch, and dinner before each deadline.",
                },
                {
                  step: "03",
                  title: "Settle up at month end",
                  copy: "EasyMess turns grocery bills and meal counts into one bill per member.",
                },
              ].map((s) => (
                <div key={s.step} className="text-center sm:text-left">
                  <p className="font-display text-3xl font-bold text-[#FF6900]/30">
                    {s.step}
                  </p>
                  <p className="font-display -mt-1 text-base font-semibold text-[#16181D]">
                    {s.title}
                  </p>
                  <p className="mt-1 text-sm text-[#6b6f76]">{s.copy}</p>
                </div>
              ))}
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
              Welcome to EasyMess
            </h1>
            <p
              className="fade-in-up mt-4 text-center text-[#6b6f76]"
              style={{ animationDelay: "0.12s" }}
            >
              Create your own mess or join an existing one
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
                  Create mess
                </h2>
                <p className="mt-1 text-sm font-medium text-orange-50 opacity-90 md:text-base">
                  Start and manage your own mess
                </p>
              </Link>

              <Link
                href="/join-mess"
                className="mx-6 flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#E7E5E1] bg-white p-8 text-center shadow-lg transition-all hover:-translate-y-1 hover:shadow-orange-200/40 active:scale-95 sm:mx-0"
              >
                <h2 className="font-display text-xl font-bold text-[#16181D] sm:text-2xl">
                  Join mess
                </h2>
                <p className="mt-1 text-sm text-[#6b6f76]">
                  Join an existing community
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
    { key: "breakfast", label: "Breakfast" },
    { key: "lunch", label: "Lunch" },
    { key: "dinner", label: "Dinner" },
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
              {messInfo?.messName || "Your mess"}
            </h1>
            <p className="mt-1 font-meta text-xs text-[#9a9691]">
              {messInfo?.totalMembers ?? "—"} members · managed by{" "}
              {messInfo?.managerName || "—"}
            </p>
          </>
        )}

        {/* This month's rate & bill — read-only, straight from the ledger */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white p-4 text-center shadow-[0_1px_2px_rgba(22,24,29,0.04)] ring-1 ring-[#EAE7E0]">
            <p className="font-meta text-[10px] uppercase tracking-wide text-[#9a9691]">
              Meal rate
            </p>
            <p className="font-display mt-1 text-xl font-bold text-[#16181D]">
              {monthSummary ? `৳${monthSummary.mealRate}` : "—"}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 text-center shadow-[0_1px_2px_rgba(22,24,29,0.04)] ring-1 ring-[#EAE7E0]">
            <p className="font-meta text-[10px] uppercase tracking-wide text-[#9a9691]">
              Your bill
            </p>
            <p className="font-display mt-1 text-xl font-bold text-[#16181D]">
              {monthSummary ? `৳${monthSummary.bill}` : "—"}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 text-center shadow-[0_1px_2px_rgba(22,24,29,0.04)] ring-1 ring-[#EAE7E0]">
            <p className="font-meta text-[10px] uppercase tracking-wide text-[#9a9691]">
              {monthSummary?.status === "due" ? "You owe" : "Advance"}
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
          Today's meals
        </h2>
        <p className="mt-1 font-meta text-xs text-[#9a9691]">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>

        {mealsLoading ? (
          <div className="mt-6 flex items-center gap-3 font-meta text-xs uppercase tracking-[0.2em] text-[#9a9691]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#FF6900]" />
            Loading today's meals
          </div>
        ) : !todayMeals ? (
          <p className="mt-6 font-meta text-xs text-[#D4453A]">
            {mealError || "Could not load today's meals."}
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
                    of {todayMeals.members.length} eating
                  </p>
                  
                </div>
                
              ))}
            </div>

            {/* Who's eating what — view only, nobody can change anything from here */}
            <div className="mt-6 rounded-2xl bg-white shadow-[0_1px_2px_rgba(22,24,29,0.04)] ring-1 ring-[#EAE7E0]">
              <div className="flex items-center justify-between border-b border-[#E7E5E1] px-5 py-3">
                <p className="font-meta text-[10px] uppercase tracking-wide text-[#9a9691]">
                  Member
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
                          src={member.image}
                          alt={member.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF6900]/10 font-meta text-xs font-semibold text-[#FF6900]">
                          {member.name?.charAt(0) || "?"}
                        </span>
                      )}
                      <span className="text-sm font-medium text-[#16181D]">
                        {isMe ? "You" : member.name}
                        {member.role === "manager" && (
                          <span className="ml-1.5 font-meta text-[9px] uppercase tracking-wide text-[#9a9691]">
                            manager
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
                          title={`${isMe ? "You" : member.name} — ${
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
              This is a view-only overview — go to the dashboard to change
              your own meals or manage the mess.
            </p>
          </>
        )}
      </section>
    </div>
  );
}