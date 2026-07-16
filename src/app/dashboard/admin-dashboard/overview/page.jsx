"use client";

import { GetUser } from "@/components/action/action";
import {
  Home,
  Users,
  UserCheck,
  UserX,
  Inbox,
  Lock,
  ChevronRight,
  RefreshCcw,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";

export default function AdminOverviewPage() {
  const user = GetUser();
  const userId = user?.user?.id;

  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState(null); // { summary, messWiseMembers }

  const loadOverview = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError("");
      setUnauthorized(false);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/overview?userId=${userId}`,
      );
      const result = await res.json();

      if (res.status === 403) {
        setUnauthorized(true);
        return;
      }

      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to load overview");
      }

      setOverview(result);
    } catch (err) {
      console.error("Admin overview failed:", err);
      setError(err.message || "Something went wrong while loading the overview.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  // ---------- Loading ----------
  if (loading) {
    return (
      <Shell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-[#9a9691]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#FF6900]" />
            Loading overview
          </div>
        </div>
      </Shell>
    );
  }

  // ---------- Unauthorized ----------
  if (unauthorized) {
    return (
      <Shell>
        <div className="flex min-h-[50vh] items-center justify-center px-4">
          <div className="max-w-sm rounded-[28px] bg-white p-8 text-center shadow-[0_1px_2px_rgba(22,24,29,0.04),0_8px_24px_-12px_rgba(22,24,29,0.12)] ring-1 ring-[#EAE7E0]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#16181D]/[0.05]">
              <Lock className="h-5 w-5 text-[#16181D]" strokeWidth={1.75} />
            </div>
            <p className="font-meta mt-4 text-[10px] uppercase tracking-[0.25em] text-[#FF6900]">
              Access denied
            </p>
            <h2 className="font-display mt-1 text-lg font-semibold text-[#16181D]">
              Admins only
            </h2>
            <p className="mt-2 text-sm text-[#6b6f76]">
              This overview is restricted to admin accounts. Ask an admin for
              access if you believe this is a mistake.
            </p>
          </div>
        </div>
      </Shell>
    );
  }

  // ---------- Error ----------
  if (error) {
    return (
      <Shell>
        <div className="flex min-h-[50vh] items-center justify-center px-4">
          <div className="max-w-sm rounded-[28px] bg-white p-8 text-center shadow-[0_1px_2px_rgba(22,24,29,0.04),0_8px_24px_-12px_rgba(22,24,29,0.12)] ring-1 ring-[#EAE7E0]">
            <p className="font-meta text-[10px] uppercase tracking-[0.25em] text-[#D4453A]">
              Couldn&rsquo;t load overview
            </p>
            <h2 className="font-display mt-1 text-lg font-semibold text-[#16181D]">
              {error}
            </h2>
            <button
              onClick={loadOverview}
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#16181D]/10 px-4 py-2 font-display text-xs font-semibold text-[#16181D] transition hover:border-[#FF6900] hover:text-[#FF6900]"
            >
              <RefreshCcw className="h-3.5 w-3.5" strokeWidth={2} />
              Try again
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  const { summary, messWiseMembers } = overview;
  const maxMembers = Math.max(
    1,
    ...messWiseMembers.map((m) => m.totalMembers),
  );

  const joinedPct =
    summary.totalUsers > 0
      ? Math.round((summary.joinedUserCount / summary.totalUsers) * 100)
      : 0;

  return (
    <Shell>
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-10 font-body sm:py-14">
        {/* ---------- Header ---------- */}
        <div className="flex items-baseline justify-between">
          <div>
            <p className="font-meta text-[10px] uppercase tracking-[0.25em] text-[#FF6900]">
              Admin console
            </p>
            <h1 className="font-display text-2xl font-semibold text-[#16181D]">
              Mess network overview
            </h1>
          </div>
          <button
            onClick={loadOverview}
            aria-label="Refresh"
            className="shrink-0 rounded-full border border-[#16181D]/10 p-2 text-[#6b6f76] transition hover:border-[#FF6900] hover:text-[#FF6900]"
          >
            <RefreshCcw className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        {/* ---------- Stat tiles ---------- */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatTile
            icon={<Home className="h-4 w-4" strokeWidth={1.75} />}
            label="Total mess"
            value={summary.totalMess}
          />
          <StatTile
            icon={<Users className="h-4 w-4" strokeWidth={1.75} />}
            label="Total users"
            value={summary.totalUsers}
          />
          <StatTile
            icon={<Inbox className="h-4 w-4" strokeWidth={1.75} />}
            label="Pending requests"
            value={summary.totalPendingRequests}
            accent
          />
        </div>

        {/* ---------- Roll call bar ---------- */}
        <div className="rounded-[28px] bg-white p-6 shadow-[0_1px_2px_rgba(22,24,29,0.04)] ring-1 ring-[#EAE7E0] sm:p-8">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="font-meta text-[10px] uppercase tracking-[0.25em] text-[#9a9691]">
                Roll call
              </p>
              <h2 className="font-display mt-1 text-lg font-semibold text-[#16181D]">
                Who&rsquo;s in a mess
              </h2>
            </div>
            <span className="font-meta text-2xl font-semibold text-[#16181D]">
              {joinedPct}%
            </span>
          </div>

          <div className="mt-5 flex h-3 w-full overflow-hidden rounded-full bg-[#F3F1EC]">
            <div
              className="h-full bg-[#FF6900] transition-all"
              style={{ width: `${joinedPct}%` }}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-meta text-xs uppercase tracking-wide text-[#6b6f76]">
            <span className="inline-flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-[#FF6900]" strokeWidth={2} />
              {summary.joinedUserCount} joined a mess
            </span>
            <span className="inline-flex items-center gap-1.5">
              <UserX className="h-3.5 w-3.5 text-[#9a9691]" strokeWidth={2} />
              {summary.notJoinedUserCount} haven&rsquo;t yet
            </span>
          </div>
        </div>

        {/* ---------- Mess ledger ---------- */}
        <div className="rounded-[28px] bg-white p-6 shadow-[0_1px_2px_rgba(22,24,29,0.04)] ring-1 ring-[#EAE7E0] sm:p-8">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="font-meta text-[10px] uppercase tracking-[0.25em] text-[#9a9691]">
                Ledger
              </p>
              <h2 className="font-display mt-1 text-lg font-semibold text-[#16181D]">
                Mess by member count
              </h2>
            </div>
            <span className="font-meta text-[11px] uppercase tracking-wide text-[#9a9691]">
              {messWiseMembers.length} total
            </span>
          </div>

          {messWiseMembers.length === 0 ? (
            <p className="mt-6 text-sm text-[#6b6f76]">
              No mess has been created yet.
            </p>
          ) : (
            <div className="mt-5 divide-y divide-dashed divide-[#E7E5E1]">
              {messWiseMembers.map((mess, idx) => (
                <div key={mess._id} className="flex items-center gap-4 py-4">
                  <span className="font-meta w-6 shrink-0 text-xs text-[#9a9691]">
                    {String(idx + 1).padStart(2, "0")}
                  </span>

                  <div className="h-11 w-11 shrink-0 -rotate-2 overflow-hidden rounded-xl bg-[#F3F1EC] ring-1 ring-[#16181D]/[0.06]">
                    {mess.messImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mess.messImage}
                        alt={mess.messName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-display text-sm font-semibold text-[#9a9691]">
                        {mess.messName?.charAt(0)?.toUpperCase() || "M"}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-display truncate text-sm font-semibold text-[#16181D]">
                      {mess.messName}
                    </p>
                    <p className="font-meta truncate text-[11px] uppercase tracking-wide text-[#9a9691]">
                      {mess.messLocation || "No location set"} &middot; {mess.inviteCode}
                    </p>
                    <div className="mt-1.5 h-1.5 w-full max-w-[160px] overflow-hidden rounded-full bg-[#F3F1EC]">
                      <div
                        className="h-full rounded-full bg-[#FF6900]"
                        style={{
                          width: `${(mess.totalMembers / maxMembers) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="font-display text-lg font-semibold text-[#16181D]">
                      {mess.totalMembers}
                    </p>
                    <p className="font-meta text-[10px] uppercase tracking-wide text-[#9a9691]">
                      members
                    </p>
                  </div>

                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-[#9a9691]"
                    strokeWidth={2}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}

function StatTile({ icon, label, value, accent = false }) {
  return (
    <div className="rounded-[22px] bg-white p-5 shadow-[0_1px_2px_rgba(22,24,29,0.04)] ring-1 ring-[#EAE7E0]">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full ${
          accent ? "bg-[#FF6900] text-white" : "bg-[#16181D]/[0.05] text-[#16181D]"
        }`}
      >
        {icon}
      </div>
      <p className="font-display mt-3 text-2xl font-semibold text-[#16181D]">
        {value}
      </p>
      <p className="font-meta text-[10px] uppercase tracking-[0.2em] text-[#9a9691]">
        {label}
      </p>
    </div>
  );
}

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-[#F3F1EC] border rounded-xl border-[#E7E5E1]">
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
      `}</style>
      {children}
    </div>
  );
}