"use client";
import React, { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics";

const MealCalendar = () => {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

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

  const fetchMeals = async () => {
    if (!userId) return;

    const key = `user_meals_calendar_${userId}_${month}_${year}`;
    if (typeof window !== "undefined") {
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
    const cachedKey = `user_messid_${userId}`;
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem(cachedKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setMessId(parsed.messId);
          if (parsed.createdAt) setJoiningDate(new Date(parsed.createdAt));
        } catch (e) {}
      }
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/member/messid/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setMessId(data.messId);
        if (data.createdAt) {
          const dateObj = new Date(data.createdAt);
          setJoiningDate(dateObj);
          if (typeof window !== "undefined") {
            sessionStorage.setItem(cachedKey, JSON.stringify({ messId: data.messId, createdAt: data.createdAt }));
          }
        }
      })
      .catch((err) => console.error("Error fetching messId:", err));
  }, [userId]);

  useEffect(() => { fetchMeals(); }, [userId, month, year]);

  const mealsByDay = React.useMemo(() => {
    const map = {};
    if (Array.isArray(meals)) {
      meals.forEach((m) => {
        if (m && m.date) {
          const dayNum = new Date(m.date).getDate();
          map[dayNum] = m;
        }
      });
    }
    return map;
  }, [meals]);

  const handleUpdate = async (day, type, currentStatus) => {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/meal/update`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, messId, date: dateStr, mealType: type, status: !currentStatus }),
    });
    const data = await res.json();
    if (data.success) {
      trackEvent("create_meal", { mealType: type, status: !currentStatus });
      fetchMeals();
    } else {
      toast.warning(data.message);
    }
  };

  return (
    <div className="p-5 bg-[#F2F4F1] dark:bg-slate-900 rounded-xl shadow max-w-xl mx-auto border dark:border-slate-800 text-neutral-900 dark:text-slate-100">
  
      <div className="flex justify-between mb-5">
        <button onClick={() => setMonth(m => m === 1 ? 12 : m - 1)} className="px-4 py-2 bg-gray-200 dark:bg-slate-800 rounded">←</button>
        <h2 className="font-bold text-xl">{month}/{year}</h2>
        <button onClick={() => setMonth(m => m === 12 ? 1 : m + 1)} className="px-4 py-2 bg-gray-200 dark:bg-slate-800 rounded">→</button>
      </div>

      <div className="grid grid-cols-4 font-bold mb-4 text-center">
        <span>Date</span> <span>Morning</span> <span>Lunch</span> <span>Dinner</span>
      </div>

      {[...Array(daysInMonth)].map((_, i) => {
        const day = i + 1;
        const dateObj = new Date(year, month - 1, day);
        const today = new Date();
        const isPast = dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        // জয়েনিং লজিক
        const isBeforeJoining = joiningDate && dateObj < new Date(joiningDate.getFullYear(), joiningDate.getMonth(), joiningDate.getDate());

        const meal = mealsByDay[day] || {};

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