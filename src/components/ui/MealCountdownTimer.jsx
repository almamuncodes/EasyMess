"use client";

import React, { useState, useEffect } from "react";
import { Clock, AlertTriangle, Sun, Moon, Coffee } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";
import { useUser } from "@/components/action/action";
import { getBDNow } from "@/lib/date-utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function MealCountdownTimer({ userId: customUserId }) {
  const { t, lang } = useTranslation();
  const isBn = lang === "bn";

  const session = useUser();
  const userId = customUserId || session?.user?.id;

  const [mounted, setMounted] = useState(false);
  const [deadlines, setDeadlines] = useState({
    breakfast: "07:00",
    lunch: "11:00",
    dinner: "20:00",
  });

  const [state, setState] = useState({
    mealNameBn: "",
    mealNameEn: "",
    hours: 0,
    minutes: 0,
    seconds: 0,
    icon: Sun,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Mess Settings dynamically for the mess
  useEffect(() => {
    if (!userId) return;

    fetch(`${API_BASE}/api/user/mess-settings/${userId}`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.mealSettings) {
          const ms = resData.mealSettings;

          const parseTo24 = (val, defaultVal) => {
            if (!val) return defaultVal;
            if (typeof val === "string") {
              const str = val.trim();
              if (str.includes(":")) {
                const parts = str.split(":");
                let h = parseInt(parts[0]) || 0;
                let m = parseInt(parts[1]) || 0;
                if (str.toUpperCase().includes("PM") && h < 12) h += 12;
                if (str.toUpperCase().includes("AM") && h === 12) h = 0;
                return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
              }
              const h = parseInt(str) || 0;
              return `${String(h).padStart(2, "0")}:00`;
            }
            return defaultVal;
          };

          const bTime = parseTo24(
            ms.breakfastDeadline || ms.breakfastTime || ms.breakfastTimeLimit || ms.breakfast,
            "07:00"
          );
          const lTime = parseTo24(
            ms.lunchDeadline || ms.lunchTime || ms.lunchTimeLimit || ms.lunch,
            "11:00"
          );
          const dTime = parseTo24(
            ms.dinnerDeadline || ms.dinnerTime || ms.dinnerTimeLimit || ms.dinner,
            "20:00"
          );

          setDeadlines({ breakfast: bTime, lunch: lTime, dinner: dTime });
        }
      })
      .catch((err) => console.error("Error fetching mess settings for timer:", err));
  }, [userId]);

  useEffect(() => {
    if (!mounted) return;

    function updateTimer() {
      const bdNow = getBDNow();
      const currentMinutes = bdNow.hours * 60 + bdNow.minutes;

      const parseTime = (tStr) => {
        const [h, m] = (tStr || "00:00").split(":").map(Number);
        return { hours: h || 0, minutes: m || 0, totalMinutes: (h || 0) * 60 + (m || 0) };
      };

      const bTime = parseTime(deadlines.breakfast);
      const lTime = parseTime(deadlines.lunch);
      const dTime = parseTime(deadlines.dinner);

      // Construct target BD date object
      let targetBDDate = new Date(bdNow.bdDateObj);
      let mealNameBn = "";
      let mealNameEn = "";
      let MealIcon = Sun;

      if (currentMinutes < bTime.totalMinutes) {
        // Next: Breakfast Today
        targetBDDate.setUTCHours(bTime.hours, bTime.minutes, 0, 0);
        mealNameBn = "আজকের সকালের মিল";
        mealNameEn = "Today's Breakfast";
        MealIcon = Coffee;
      } else if (currentMinutes < lTime.totalMinutes) {
        // Next: Lunch Today
        targetBDDate.setUTCHours(lTime.hours, lTime.minutes, 0, 0);
        mealNameBn = "আজকের দুপুরের মিল";
        mealNameEn = "Today's Lunch";
        MealIcon = Sun;
      } else if (currentMinutes < dTime.totalMinutes) {
        // Next: Dinner Today
        targetBDDate.setUTCHours(dTime.hours, dTime.minutes, 0, 0);
        mealNameBn = "আজকের রাতের মিল";
        mealNameEn = "Today's Dinner";
        MealIcon = Moon;
      } else {
        // Next: Tomorrow's Breakfast
        targetBDDate.setUTCDate(targetBDDate.getUTCDate() + 1);
        targetBDDate.setUTCHours(bTime.hours, bTime.minutes, 0, 0);
        mealNameBn = "আগামীকাল সকালের মিল";
        mealNameEn = "Tomorrow's Breakfast";
        MealIcon = Coffee;
      }

      const diffMs = targetBDDate.getTime() - bdNow.bdDateObj.getTime();
      const diffSecs = Math.max(0, Math.floor(diffMs / 1000));

      const hours = Math.floor(diffSecs / 3600);
      const minutes = Math.floor((diffSecs % 3600) / 60);
      const seconds = diffSecs % 60;

      setState({
        mealNameBn,
        mealNameEn,
        hours,
        minutes,
        seconds,
        icon: MealIcon,
      });
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [mounted, deadlines]);

  if (!mounted) return null;

  const pad = (n) => String(n).padStart(2, "0");
  const IconComponent = state.icon || Clock;

  return (
    <div className="p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 dark:from-orange-500/20 dark:to-slate-900 border-orange-500/30 text-slate-800 dark:text-slate-100">
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-md shadow-orange-500/20">
          <IconComponent className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-xs sm:text-sm text-orange-950 dark:text-orange-200 flex items-center gap-1.5 leading-snug">
            <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
            <span>
              {isBn
                ? `${state.mealNameBn} অন/অফ করার সময় বাকি`
                : `Time Remaining to Update ${state.mealNameEn}`}
            </span>
          </h3>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 bg-white dark:bg-slate-900 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-orange-500/20 shadow-sm w-full sm:w-auto justify-center">
        <div className="text-center font-mono">
          <span className="text-lg sm:text-xl font-black text-orange-600 dark:text-orange-400">
            {pad(state.hours)}
          </span>
          <span className="text-[9px] block text-gray-400 uppercase font-bold">
            {isBn ? "ঘণ্টা" : "HRS"}
          </span>
        </div>
        <span className="text-orange-500 font-bold text-base mb-2">:</span>
        <div className="text-center font-mono">
          <span className="text-lg sm:text-xl font-black text-orange-600 dark:text-orange-400">
            {pad(state.minutes)}
          </span>
          <span className="text-[9px] block text-gray-400 uppercase font-bold">
            {isBn ? "মিনিট" : "MIN"}
          </span>
        </div>
        <span className="text-orange-500 font-bold text-base mb-2">:</span>
        <div className="text-center font-mono">
          <span className="text-lg sm:text-xl font-black text-orange-600 dark:text-orange-400">
            {pad(state.seconds)}
          </span>
          <span className="text-[9px] block text-gray-400 uppercase font-bold">
            {isBn ? "সেকেন্ড" : "SEC"}
          </span>
        </div>
      </div>
    </div>
  );
}
