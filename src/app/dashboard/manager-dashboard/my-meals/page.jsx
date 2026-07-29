"use client";
import React, { useEffect, useState } from "react";
import { GetUser } from "@/components/action/action";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import MealCountdownTimer from "@/components/ui/MealCountdownTimer";
import { getBDNow, getUTCDayFromMongoDate, getBDDateStr } from "@/lib/date-utils";


const MealCalendar = () => {
  const user = GetUser();
  const userId = user?.user?.id;
  const [month, setMonth] = useState(() => getBDNow().month);
  const [year, setYear] = useState(() => getBDNow().year);

  const [meals, setMeals] = useState(() => {
    if (typeof window !== "undefined" && userId) {
      const cached = sessionStorage.getItem(`user_meals_calendar_${userId}_${month}_${year}`);
      if (cached) {
        try { return JSON.parse(cached); } catch (e) {}
      }
    }
    return [];
  });
  const [messId, setMessId] = useState(null);
  const [joiningDate, setJoiningDate] = useState(null); 
  const router = useRouter();

  const daysInMonth = new Date(year, month, 0).getDate();

  const fetchMeals = async (force = false) => {
    if (!userId) return;

    const key = `user_meals_calendar_${userId}_${month}_${year}`;
    if (!force && typeof window !== "undefined") {
      const cached = sessionStorage.getItem(key);
      if (cached) {
        try { setMeals(JSON.parse(cached)); } catch (e) {}
      }
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/meal/report?userId=${userId}&month=${month}&year=${year}`);
      const data = await res.json();
      const updatedMeals = data.meals || [];
      setMeals(updatedMeals);
      if (typeof window !== "undefined") {
        sessionStorage.setItem(key, JSON.stringify(updatedMeals));
      }
    } catch (err) { console.log(err); }
  };

  useEffect(() => {
    if (!userId) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/member/messid/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setMessId(data.messId);
        if (data.createdAt) setJoiningDate(new Date(data.createdAt));
      });
  }, [userId]);

  useEffect(() => { fetchMeals(); }, [userId, month, year]);


  

  const handleUpdate = async (day, type, currentStatus) => {
    // 1. Save previous meals state for rollback
    const previousMeals = [...meals];

    // 2. Perform optimistic update on React state
    const targetDateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00.000Z`;
    let mealExists = false;
    const newMeals = meals.map((m) => {
      if (getUTCDayFromMongoDate(m.date) === day) {
        mealExists = true;
        return {
          ...m,
          [type]: !currentStatus,
        };
      }
      return m;
    });

    if (!mealExists) {
      newMeals.push({
        date: targetDateStr,
        breakfast: type === "breakfast" ? !currentStatus : true,
        lunch: type === "lunch" ? !currentStatus : true,
        dinner: type === "dinner" ? !currentStatus : true,
      });
    }

    setMeals(newMeals);

    // Also update sessionStorage cache optimistically
    const cacheKey = `user_meals_calendar_${userId}_${month}_${year}`;
    if (typeof window !== "undefined") {
      sessionStorage.setItem(cacheKey, JSON.stringify(newMeals));
    }

    // 3. Make API request in the background
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/meal/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, messId, date: dateStr, mealType: type, status: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        trackEvent("create_meal", { mealType: type, status: !currentStatus });
        fetchMeals(true); // force fetch to skip reading stale cache
      } else {
        // Rollback state and cache, then show warning
        setMeals(previousMeals);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(cacheKey, JSON.stringify(previousMeals));
        }
        toast.warning(data.message);
      }
    } catch (err) {
      console.log(err);
      // Rollback state and cache, then show error
      setMeals(previousMeals);
      if (typeof window !== "undefined") {
        sessionStorage.setItem(cacheKey, JSON.stringify(previousMeals));
      }
      toast.error("Failed to update meal. Please try again.");
    }
  };
  const bdTodayStr = getBDNow().dateStr;
  const joiningDateStr = joiningDate ? getBDDateStr(joiningDate) : null;

  return (
    <div className="p-5 bg-[#f2f4f1] dark:bg-slate-900 rounded-xl shadow max-w-lg mx-auto border dark:border-slate-800 space-y-4">
      
      {/* ⏳ Smart Next-Meal Lock Countdown Timer */}
      <MealCountdownTimer userId={userId} />

      <div className="flex justify-between mb-5">
        <button onClick={() => setMonth(m => m === 1 ? 12 : m - 1)} className="px-4 py-2 bg-gray-200 rounded">←</button>
        <h2 className="font-bold text-xl">{month}/{year}</h2>
        <button onClick={() => setMonth(m => m === 12 ? 1 : m + 1)} className="px-4 py-2 bg-gray-200 rounded">→</button>
      </div>

      <div className="grid grid-cols-4 font-bold mb-4 text-center">
        <span>Date</span> <span>Morning</span> <span>Lunch</span> <span>Dinner</span>
      </div>

      {[...Array(daysInMonth)].map((_, i) => {
        const day = i + 1;
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const isPast = dateStr < bdTodayStr;
        
        // জয়েনিং লজিক
        const isBeforeJoining = joiningDateStr && dateStr < joiningDateStr;

        const meal = meals.find((m) => getUTCDayFromMongoDate(m.date) === day) || {};

        return (
          <div key={day} className="grid grid-cols-4 gap-2 mb-2 text-center items-center">
            <span className="font-semibold">{day}</span>
            {["breakfast", "lunch", "dinner"].map((type) => {
              const active = isBeforeJoining ? false : (meal[type] !== false);

              // কালার লজিক
              let bgColor;
              if (isBeforeJoining) {
                bgColor = "bg-gray-50 border-none"; 
              } else {
                bgColor = !active ? "bg-white border" : (isPast ? "bg-orange-400" : "bg-orange-200");
              }

              return (
                <button
                  key={type}
                  onClick={() => {
                    if (isBeforeJoining) return;
                    if (isPast) { toast.error("you can't edit the past event"); return; }
                    handleUpdate(day, type, active);
                  }}
                  className={`h-10 rounded ${bgColor} ${!isBeforeJoining && 'hover:cursor-pointer'}`}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default MealCalendar;