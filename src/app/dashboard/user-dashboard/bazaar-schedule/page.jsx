"use client";

import React, { useState, useEffect, useCallback } from "react";
import { GetUser } from "@/components/action/action";
import { useTranslation } from "@/lib/useTranslation";
import { Calendar as CalendarIcon, Clock, AlertCircle, ShoppingBag, Sparkles, Users } from "lucide-react";
import PageLoader from "@/components/ui/PageLoader";
import { getBDDateStr } from "@/lib/date-utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function UserBazaarSchedulePage() {
  const { t, lang } = useTranslation();
  const isBn = lang === "bn";

  const user = GetUser();
  const userId = user?.user?.id;

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSchedules = useCallback(async () => {
    if (!userId) return;

    try {
      const now = new Date();
      const res = await fetch(
        `${API_BASE}/api/bazaar-schedules?userId=${userId}&month=${now.getMonth() + 1}&year=${now.getFullYear()}`
      );
      const data = await res.json();
      if (data.success) {
        setSchedules(data.data || []);
      }
    } catch (err) {
      console.error("Error loading user bazaar schedule:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const todayStr = getBDDateStr();

  // Find next assigned bazaar duty for logged-in user
  const nextDuty = schedules.find((s) => {
    const isUserAssigned =
      s.assignedUserId === userId ||
      (Array.isArray(s.assignedMembers) && s.assignedMembers.some((m) => m.userId === userId));
    return isUserAssigned && s.dateStr >= todayStr;
  });

  if (loading) return <PageLoader text={isBn ? "আপনার বাজার রুটিন লোড হচ্ছে..." : "Loading bazaar schedule..."} />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-orange-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-3 sm:p-6 lg:p-8 text-gray-900 dark:text-slate-100">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 sm:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <CalendarIcon className="w-3.5 h-3.5" />
              {isBn ? "আমার বাজার রুটিন" : "My Bazaar Schedule"}
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              {isBn ? "মেস বাজারের রোস্টার ও দায়িত্ব" : "Mess Bazaar Duty Roster"}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
              {isBn ? "ম্যানেজার কর্তৃক নির্ধারিত আপনার ও অন্যান্যদের বাজার করার তারিখসমূহ" : "View assigned grocery shopping turns schedule set by mess manager"}
            </p>
          </div>
        </div>

        {/* Highlight Card: Next Assigned Duty */}
        {nextDuty ? (
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10 pointer-events-none">
              <ShoppingBag className="w-48 h-48" />
            </div>

            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                {isBn ? "আপনার পরবর্তী বাজার ডিউটি" : "Your Next Bazaar Duty"}
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black">
                  {new Date(nextDuty.date).toLocaleDateString(isBn ? "bn-BD" : "en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </h2>
                
                {/* Multi-Member Banner */}
                {Array.isArray(nextDuty.assignedMembers) && nextDuty.assignedMembers.length > 1 ? (
                  <p className="text-xs sm:text-sm font-medium text-orange-100 mt-1 bg-white/10 p-2 rounded-xl border border-white/20">
                    🛍️ {isBn
                      ? `আপনাকে এবং আরও ${nextDuty.assignedMembers.length - 1} জন মেম্বারকে (${nextDuty.assignedMembers.map(m => m.name).join(", ")}) একসাথে দায়িত্ব দেওয়া হয়েছে!`
                      : `You and ${nextDuty.assignedMembers.length - 1} other member(s) (${nextDuty.assignedMembers.map(m => m.name).join(", ")}) are assigned together!`}
                  </p>
                ) : (
                  <p className="text-xs sm:text-sm font-medium text-orange-100 mt-1">
                    🛍️ {isBn ? "একক দায়িত্ব: এই দিনে আপনার বাজার করার পালা!" : "Single duty: It's your turn for grocery shopping!"}
                  </p>
                )}

                {nextDuty.note && (
                  <p className="text-xs text-orange-200 italic mt-1">
                    "{nextDuty.note}"
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 rounded-3xl bg-orange-500/10 border border-orange-500/20 text-orange-950 dark:text-orange-200 text-xs sm:text-sm font-semibold flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-orange-500 shrink-0" />
            <span>
              {isBn
                ? "বর্তমানে আপনার কোনো নিকটবর্তী বাজার ডিউটি নির্ধারিত নেই।"
                : "No upcoming bazaar duty scheduled for you right now."}
            </span>
          </div>
        )}

        {/* Complete Mess Schedule Roster */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
            <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              {isBn ? "মেসের সম্পূর্ণ বাজার রুটিন তালিকা" : "Full Mess Bazaar Roster"}
            </h3>
            <span className="px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-mono text-xs font-bold">
              {schedules.length} {isBn ? "টি দিন" : "days"}
            </span>
          </div>

          {schedules.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <AlertCircle className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-xs text-gray-400">
                {isBn ? "মেসে কোনো বাজার রুটিন যোগ করা হয়নি।" : "No bazaar schedules found."}
              </p>
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {schedules.map((sch) => {
                const dateObj = new Date(sch.date);
                const formattedDate = dateObj.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                const isMe =
                  sch.assignedUserId === userId ||
                  (Array.isArray(sch.assignedMembers) && sch.assignedMembers.some((m) => m.userId === userId));

                const assignedList = Array.isArray(sch.assignedMembers) && sch.assignedMembers.length > 0
                  ? sch.assignedMembers.map((m) => m.name).join(", ")
                  : sch.assignedUserName;

                const memberCount = Array.isArray(sch.assignedMembers) ? sch.assignedMembers.length : 1;

                return (
                  <div
                    key={sch._id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      isMe
                        ? "bg-orange-50/80 dark:bg-orange-950/30 border-orange-500/50 ring-2 ring-orange-500/30 shadow-md"
                        : "bg-gray-50/50 dark:bg-slate-800/40 border-gray-100 dark:border-slate-800 shadow-xs"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400">
                          📅 {formattedDate}
                        </span>
                        {isMe && (
                          <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white text-[9px] font-bold uppercase tracking-wider">
                            {isBn ? "আপনার ডিউটি" : "Your Duty"}
                          </span>
                        )}
                      </div>

                      <div className="flex items-start gap-2.5 mt-1">
                        <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          🛍️
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] font-bold">
                            {memberCount} {isBn ? "জন মেম্বার" : "member(s)"}
                          </span>
                          <p className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white mt-1 leading-snug break-words">
                            {assignedList}
                          </p>
                          {sch.note && (
                            <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/20 text-slate-700 dark:text-slate-300 text-[11px] sm:text-xs font-medium leading-relaxed">
                              <span className="font-bold text-amber-700 dark:text-amber-400 block mb-0.5">
                                📝 {isBn ? "বাজারের তালিকা / নোট:" : "Shopping List / Note:"}
                              </span>
                              {sch.note}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
