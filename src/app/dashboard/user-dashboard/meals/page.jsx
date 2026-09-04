"use client";
import React, { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import MealCountdownTimer from "@/components/ui/MealCountdownTimer";
import { getBDNow, getUTCDayFromMongoDate, getBDDateStr } from "@/lib/date-utils";
import { useTranslation } from "@/lib/useTranslation";
import { Users, UserPlus, Plus, Minus, X, Coffee, Sun, Moon, Lock, Check } from "lucide-react";

export const dynamic = "force-dynamic";

const monthNamesEn = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const monthNamesBn = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
];

const MealCalendar = () => {
  const { lang } = useTranslation();
  const isBn = lang === "bn";

  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
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

  // Deadlines state from mess settings
  const [deadlines, setDeadlines] = useState({
    breakfast: "07:00",
    lunch: "12:00",
    dinner: "20:00",
  });

  // Guest Meal Modal state
  const [selectedGuestDay, setSelectedGuestDay] = useState(null);
  const [guestCounts, setGuestCounts] = useState({ guestBreakfast: 0, guestLunch: 0, guestDinner: 0 });
  const [isSavingGuest, setIsSavingGuest] = useState(false);

  const daysInMonth = new Date(year, month, 0).getDate();

  const [refreshKey, setRefreshKey] = useState(0);

  const fetchMeals = React.useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!userId) return;
    let ignore = false;

    async function loadMeals() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/meal/report?userId=${userId}&month=${month}&year=${year}`
        );
        const data = await res.json();
        if (!ignore) {
          const updatedMeals = data.meals || [];
          setMeals(updatedMeals);
          if (typeof window !== "undefined") {
            const key = `user_meals_calendar_${userId}_${month}_${year}`;
            sessionStorage.setItem(key, JSON.stringify(updatedMeals));
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadMeals();

    return () => {
      ignore = true;
    };
  }, [userId, month, year, refreshKey]);

  useEffect(() => {
    if (!userId) return;
    const cachedKey = `user_messid_${userId}`;

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

    // Fetch mess settings for exact meal deadlines
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/mess-settings/${userId}`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.mealSettings) {
          const ms = resData.mealSettings;
          setDeadlines({
            breakfast: ms.breakfastDeadline || "07:00",
            lunch: ms.lunchDeadline || "12:00",
            dinner: ms.dinnerDeadline || "20:00",
          });
        }
      })
      .catch((err) => console.error("Error fetching mess deadlines:", err));
  }, [userId]);

  const mealsByDay = React.useMemo(() => {
    const map = {};
    if (Array.isArray(meals)) {
      meals.forEach((m) => {
        if (m && m.date) {
          const dayNum = getUTCDayFromMongoDate(m.date);
          if (dayNum) map[dayNum] = m;
        }
      });
    }
    return map;
  }, [meals]);

  const bdNow = getBDNow();
  const bdTodayStr = bdNow.dateStr;
  const joiningDateStr = joiningDate ? getBDDateStr(joiningDate) : null;

  // Check if a meal deadline has passed for a target date
  const isMealDeadlinePassed = (type, targetDateStr) => {
    if (targetDateStr < bdTodayStr) return true;
    if (targetDateStr > bdTodayStr) return false;
    const deadlineVal = deadlines[type] || (type === "breakfast" ? "07:00" : type === "lunch" ? "12:00" : "20:00");
    const [h, m] = deadlineVal.split(":").map(Number);
    const dlMinutes = (h || 0) * 60 + (m || 0);
    const currentMinutes = bdNow.hours * 60 + bdNow.minutes;
    return currentMinutes >= dlMinutes;
  };

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
      toast.error(isBn ? "মিল আপডেট করা যায়নি। আবার চেষ্টা করুন।" : "Failed to update meal. Please try again.");
    }
  };

  // Open Guest Meal Modal
  const openGuestModal = (day) => {
    const meal = mealsByDay[day] || {};
    setSelectedGuestDay(day);
    setGuestCounts({
      guestBreakfast: Math.max(0, parseInt(meal.guestBreakfast) || 0),
      guestLunch: Math.max(0, parseInt(meal.guestLunch) || 0),
      guestDinner: Math.max(0, parseInt(meal.guestDinner) || 0),
    });
  };

  // Save Guest Meals
  const handleSaveGuestMeals = async () => {
    if (!selectedGuestDay || !userId || !messId) return;

    const day = selectedGuestDay;
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const targetDateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00.000Z`;

    const previousMeals = [...meals];
    let mealExists = false;
    const newMeals = meals.map((m) => {
      if (getUTCDayFromMongoDate(m.date) === day) {
        mealExists = true;
        return {
          ...m,
          ...guestCounts,
        };
      }
      return m;
    });

    if (!mealExists) {
      newMeals.push({
        date: targetDateStr,
        breakfast: true,
        lunch: true,
        dinner: true,
        ...guestCounts,
      });
    }

    setMeals(newMeals);

    const cacheKey = `user_meals_calendar_${userId}_${month}_${year}`;
    if (typeof window !== "undefined") {
      sessionStorage.setItem(cacheKey, JSON.stringify(newMeals));
    }

    setIsSavingGuest(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/meal/guest-update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          messId,
          date: dateStr,
          ...guestCounts,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isBn ? "গেস্ট মিল সফলভাবে আপডেট হয়েছে!" : "Guest meals updated successfully!");
        trackEvent("update_guest_meal", { day, ...guestCounts });
        fetchMeals(true);
        setSelectedGuestDay(null);
      } else {
        setMeals(previousMeals);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(cacheKey, JSON.stringify(previousMeals));
        }
        toast.warning(data.message || (isBn ? "গেস্ট মিল আপডেট সম্ভব হয়নি" : "Failed to update guest meals"));
      }
    } catch (err) {
      console.error(err);
      setMeals(previousMeals);
      if (typeof window !== "undefined") {
        sessionStorage.setItem(cacheKey, JSON.stringify(previousMeals));
      }
      toast.error(isBn ? "নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।" : "Network error. Please try again.");
    } finally {
      setIsSavingGuest(false);
    }
  };

  const selectedDateStr = selectedGuestDay
    ? `${year}-${String(month).padStart(2, "0")}-${String(selectedGuestDay).padStart(2, "0")}`
    : null;

  return (
    <div className="p-4 sm:p-5 bg-[#F2F4F1] dark:bg-slate-900 rounded-xl shadow max-w-xl mx-auto border dark:border-slate-800 text-neutral-900 dark:text-slate-100 space-y-4">
      
      {/* ⏳ Smart Next-Meal Lock Countdown Timer */}
      <MealCountdownTimer userId={userId} />

      <div className="flex justify-between items-center mb-5">
        <button onClick={() => setMonth(m => m === 1 ? 12 : m - 1)} className="px-4 py-2 bg-gray-200 dark:bg-slate-800 rounded font-bold">←</button>
        <h2 className="font-bold text-xl">{month}/{year}</h2>
        <button onClick={() => setMonth(m => m === 12 ? 1 : m + 1)} className="px-4 py-2 bg-gray-200 dark:bg-slate-800 rounded font-bold">→</button>
      </div>

      {/* Calendar Table Header */}
      <div className="grid grid-cols-5 font-bold mb-3 text-center text-xs sm:text-sm text-gray-700 dark:text-gray-300 px-1">
        <span>{isBn ? "তারিখ" : "Date"}</span>
        <span>{isBn ? "সকাল" : "Morning"}</span>
        <span>{isBn ? "দুপুর" : "Lunch"}</span>
        <span>{isBn ? "রাত" : "Dinner"}</span>
        <span className="text-amber-600 dark:text-amber-400">{isBn ? "গেস্ট" : "Guest"}</span>
      </div>

      {/* Calendar Rows */}
      <div className="space-y-1.5">
        {[...Array(daysInMonth)].map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isPast = dateStr < bdTodayStr;
          const isToday = dateStr === bdTodayStr;
          
          // Joining logic
          const isBeforeJoining = joiningDateStr && dateStr < joiningDateStr;
          const meal = mealsByDay[day] || {};

          const dayGuestBreakfast = meal.guestBreakfast || 0;
          const dayGuestLunch = meal.guestLunch || 0;
          const dayGuestDinner = meal.guestDinner || 0;
          const totalGuest = dayGuestBreakfast + dayGuestLunch + dayGuestDinner;

          return (
            <div
              key={day}
              className={`grid grid-cols-5 gap-1.5 sm:gap-2 text-center items-center p-1 rounded-xl transition ${
                isToday ? "bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/30" : ""
              }`}
            >
              <div className="flex flex-col items-center justify-center">
                <span className={`font-semibold text-xs sm:text-sm ${isToday ? "text-orange-600 dark:text-orange-400 font-bold" : ""}`}>
                  {day}
                </span>
                {isToday && (
                  <span className="text-[9px] font-bold text-orange-500 uppercase tracking-tighter">
                    {isBn ? "আজ" : "Today"}
                  </span>
                )}
              </div>

              {/* Breakfast, Lunch, Dinner Own Meal Buttons */}
              {["breakfast", "lunch", "dinner"].map((type) => {
                const active = isBeforeJoining ? false : (meal[type] !== false);
                const guestField = type === "breakfast" ? "guestBreakfast" : type === "lunch" ? "guestLunch" : "guestDinner";
                const guestCountForThisMeal = meal[guestField] || 0;

                // Color logic
                let bgColor;
                if (isBeforeJoining) {
                  bgColor = "bg-gray-100 dark:bg-slate-800/40 border-none text-transparent"; 
                } else {
                  bgColor = !active
                    ? "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-400"
                    : (isPast
                        ? "bg-orange-400 dark:bg-orange-500 text-white"
                        : "bg-orange-200 dark:bg-orange-500/30 border border-orange-300 dark:border-orange-500/40 text-orange-900 dark:text-orange-200");
                }

                return (
                  <div key={type} className="relative">
                    <button
                      onClick={() => {
                        if (isBeforeJoining) return;
                        if (isPast) { toast.error(isBn ? "অতীতের মিল এডিট করা যাবে না" : "You can't edit past meals"); return; }
                        handleUpdate(day, type, active);
                      }}
                      disabled={isBeforeJoining}
                      title={
                        isBeforeJoining
                          ? "Before joining"
                          : `${type.toUpperCase()} (${active ? "ON" : "OFF"})${guestCountForThisMeal > 0 ? ` +${guestCountForThisMeal} Guest` : ""}`
                      }
                      className={`w-full h-10 rounded-lg ${bgColor} ${!isBeforeJoining && 'hover:cursor-pointer active:scale-95'} transition flex items-center justify-center relative font-semibold text-xs`}
                    >
                      {/* Show meal indicator or guest indicator */}
                      {guestCountForThisMeal > 0 && (
                        <span
                          className="absolute -top-1.5 -right-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full shadow-xs border border-white dark:border-slate-900"
                          title={`${guestCountForThisMeal} Guest for ${type}`}
                        >
                          +{guestCountForThisMeal}
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}

              {/* Guest Column */}
              <div>
                {isBeforeJoining ? (
                  <div className="h-10 rounded-lg bg-gray-100 dark:bg-slate-800/40" />
                ) : (
                  <button
                    onClick={() => {
                      if (isPast) {
                        toast.error(isBn ? "অতীতের গেস্ট মিল পরিবর্তন করা যাবে না" : "Cannot edit past guest meals");
                        return;
                      }
                      openGuestModal(day);
                    }}
                    title={isPast ? (isBn ? "অতীতের তারিখ" : "Past date") : (isBn ? "গেস্ট মিল যোগ/পরিবর্তন করুন" : "Add/Edit Guest Meal")}
                    className={`w-full h-10 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                      isPast
                        ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-slate-800 text-gray-400"
                        : totalGuest > 0
                        ? "bg-amber-500 hover:bg-amber-600 text-white shadow-xs shadow-amber-500/20 active:scale-95"
                        : "border border-dashed border-gray-300 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 active:scale-95"
                    }`}
                  >
                    {totalGuest > 0 ? (
                      <>
                        <Users className="w-3.5 h-3.5 shrink-0" />
                        <span>+{totalGuest}</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5 shrink-0 text-gray-400 dark:text-gray-500" />
                        <span className="hidden sm:inline text-[10px] text-gray-400 dark:text-gray-500">
                          {isBn ? "গেস্ট" : "+Guest"}
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Guest Meal Management Modal */}
      {selectedGuestDay && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-gray-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-500" />
                  <span>
                    {isBn ? "গেস্ট মিল নির্ধারণ" : "Manage Guest Meals"}
                  </span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                  {selectedGuestDay} {isBn ? monthNamesBn[month - 1] : monthNamesEn[month - 1]} {year}
                </p>
              </div>
              <button
                onClick={() => setSelectedGuestDay(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Meal Items */}
            <div className="space-y-3">
              {[
                {
                  key: "guestBreakfast",
                  type: "breakfast",
                  labelBn: "সকালের নাস্তা (Breakfast)",
                  labelEn: "Breakfast Guest",
                  icon: Coffee,
                  color: "amber",
                },
                {
                  key: "guestLunch",
                  type: "lunch",
                  labelBn: "দুপুরের খাবার (Lunch)",
                  labelEn: "Lunch Guest",
                  icon: Sun,
                  color: "orange",
                },
                {
                  key: "guestDinner",
                  type: "dinner",
                  labelBn: "রাতের খাবার (Dinner)",
                  labelEn: "Dinner Guest",
                  icon: Moon,
                  color: "indigo",
                },
              ].map((m) => {
                const Icon = m.icon;
                const isLocked = isMealDeadlinePassed(m.type, selectedDateStr);
                const count = guestCounts[m.key] || 0;
                const deadlineTime = deadlines[m.type] || "12:00";

                return (
                  <div
                    key={m.key}
                    className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                      isLocked
                        ? "bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-800 opacity-80"
                        : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 shadow-xs"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center shrink-0 text-gray-700 dark:text-gray-200">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-xs sm:text-sm block text-gray-900 dark:text-gray-100">
                          {isBn ? m.labelBn : m.labelEn}
                        </span>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          {isLocked ? (
                            <>
                              <Lock className="w-3 h-3 text-red-500" />
                              <span className="text-red-500 font-medium">
                                {isBn ? `সময় শেষ (${deadlineTime})` : `Locked (${deadlineTime})`}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-gray-400">
                                {isBn ? `শেষ সময়: ${deadlineTime}` : `Deadline: ${deadlineTime}`}
                              </span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Counter Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isLocked || count <= 0}
                        onClick={() =>
                          setGuestCounts((prev) => ({
                            ...prev,
                            [m.key]: Math.max(0, count - 1),
                          }))
                        }
                        className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-gray-700 dark:text-gray-200 font-bold transition active:scale-95"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <span className="w-6 text-center font-black text-sm sm:text-base text-gray-900 dark:text-white">
                        {count}
                      </span>

                      <button
                        type="button"
                        disabled={isLocked || count >= 20}
                        onClick={() =>
                          setGuestCounts((prev) => ({
                            ...prev,
                            [m.key]: count + 1,
                          }))
                        }
                        className="w-8 h-8 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white font-bold transition active:scale-95 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Guest Notice */}
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
              <span>{isBn ? "মোট গেস্ট মিল (এই দিনে):" : "Total Guest Meals (This day):"}</span>
              <span className="font-black text-sm">
                {(guestCounts.guestBreakfast || 0) + (guestCounts.guestLunch || 0) + (guestCounts.guestDinner || 0)} {isBn ? "টি" : "Meals"}
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedGuestDay(null)}
                className="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition"
              >
                {isBn ? "বাতিল" : "Cancel"}
              </button>
              <button
                type="button"
                disabled={isSavingGuest}
                onClick={handleSaveGuestMeals}
                className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-amber-500/20 disabled:opacity-50 transition flex items-center justify-center gap-1.5"
              >
                {isSavingGuest ? (
                  <span>{isBn ? "সংরক্ষণ হচ্ছে..." : "Saving..."}</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{isBn ? "সেভ করুন" : "Save Guest Meals"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealCalendar;