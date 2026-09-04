"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { GetUser } from "@/components/action/action";
import { toast } from "sonner";

export const dynamic = "force-dynamic";
import {
  Check,
  X,
  Calendar,
  User,
  Utensils,
  Plus,
  Minus,
  Search,
  RefreshCw,
  Sun,
  Sunset,
  Moon,
  Users,
  Boxes,
} from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";
import { getBDDateStr } from "@/lib/date-utils";

export default function MealManagementPage() {
  const user = GetUser();
  const userId = user?.user?.id;
  const { t, lang } = useTranslation();

  const [date, setDate] = useState(() => getBDDateStr());
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const [data, setData] = useState({
    summary: { breakfast: 0, lunch: 0, dinner: 0, guestMeal: 0 },
    members: [],
  });

  const [mealWeights, setMealWeights] = useState({
    breakfast: 0.5,
    lunch: 1,
    dinner: 1,
  });

  const [editingMember, setEditingMember] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const processMealResults = React.useCallback((result, targetDate) => {
    if (result.mealSettings) {
      const ms = result.mealSettings;
      setMealWeights({
        breakfast: ms.breakfastWeight !== undefined ? Number(ms.breakfastWeight) : 0.5,
        lunch: ms.lunchWeight !== undefined ? Number(ms.lunchWeight) : 1,
        dinner: ms.dinnerWeight !== undefined ? Number(ms.dinnerWeight) : 1,
      });
    }
    const selectedDate = new Date(targetDate);
    selectedDate.setUTCHours(0, 0, 0, 0);

    const totalBreakfast = result.members.reduce((sum, m) => {
      const joinDate = new Date(m.createdAt);
      joinDate.setUTCHours(0, 0, 0, 0);
      return joinDate <= selectedDate ? sum + (m.breakfast ? 1 : 0) + (m.guestBreakfast || 0) : sum;
    }, 0);

    const totalLunch = result.members.reduce((sum, m) => {
      const joinDate = new Date(m.createdAt);
      joinDate.setUTCHours(0, 0, 0, 0);
      return joinDate <= selectedDate ? sum + (m.lunch ? 1 : 0) + (m.guestLunch || 0) : sum;
    }, 0);

    const totalDinner = result.members.reduce((sum, m) => {
      const joinDate = new Date(m.createdAt);
      joinDate.setUTCHours(0, 0, 0, 0);
      return joinDate <= selectedDate ? sum + (m.dinner ? 1 : 0) + (m.guestDinner || 0) : sum;
    }, 0);

    const totalGuest = result.members.reduce((sum, m) => {
      const joinDate = new Date(m.createdAt);
      joinDate.setUTCHours(0, 0, 0, 0);
      return joinDate <= selectedDate ? sum + (m.guestBreakfast + m.guestLunch + m.guestDinner) : sum;
    }, 0);

    const updatedData = {
      summary: {
        breakfast: totalBreakfast,
        lunch: totalLunch,
        dinner: totalDinner,
        guestMeal: totalGuest,
      },
      members: result.members,
    };

    setData(updatedData);
    if (typeof window !== "undefined" && userId) {
      sessionStorage.setItem(`manager_meals_${userId}_${targetDate}`, JSON.stringify(updatedData));
    }
  }, [userId]);

  const fetchData = React.useCallback(async (showLoader = false) => {
    if (!userId) return;
    if (showLoader) setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/manager/meals?userId=${userId}&date=${date}`
      );
      const result = await res.json();

      if (result.success) {
        processMealResults(result, date);
      } else {
        toast.error(result.message || "Failed to load meal data");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  }, [userId, date, processMealResults]);

  useEffect(() => {
    if (!userId) return;
    let ignore = false;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/manager/meals?userId=${userId}&date=${date}`)
      .then((res) => res.json())
      .then((result) => {
        if (ignore) return;
        setLoading(false);
        if (result.success) {
          processMealResults(result, date);
        } else {
          toast.error(result.message || "Failed to load meal data");
        }
      })
      .catch((err) => {
        if (ignore) return;
        console.error(err);
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [userId, date, processMealResults]);

  useEffect(() => {
    if (!userId) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/mess-settings/${userId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.mealSettings) {
          const ms = d.mealSettings;
          setMealWeights({
            breakfast: ms.breakfastWeight !== undefined ? Number(ms.breakfastWeight) : 0.5,
            lunch: ms.lunchWeight !== undefined ? Number(ms.lunchWeight) : 1,
            dinner: ms.dinnerWeight !== undefined ? Number(ms.dinnerWeight) : 1,
          });
        }
      })
      .catch(() => {});
  }, [userId]);

  // Toggle individual meal for a member instantly
  const handleToggleMeal = async (member, mealType) => {
    if (mealWeights[mealType] === 0) {
      toast.error(
        lang === "bn"
          ? "এই মেসে এই বেলার মিল বন্ধ (Weight 0)"
          : "This meal is disabled in this mess (Weight: 0)"
      );
      return;
    }
    if (!userId) return;
    const cacheKey = `manager_meals_${userId}_${date}`;
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(cacheKey);
    }

    const newStatus = !member[mealType];
    const updatedMember = {
      ...member,
      [mealType]: newStatus,
    };

    // Optimistic UI update
    setData((prev) => ({
      ...prev,
      members: prev.members.map((m) =>
        m.userId === member.userId ? updatedMember : m
      ),
    }));

    setSavingId(`${member.userId}-${mealType}`);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/manager/update-meal`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            managerId: userId,
            userId: member.userId,
            date,
            breakfast: mealType === "breakfast" ? newStatus : member.breakfast,
            lunch: mealType === "lunch" ? newStatus : member.lunch,
            dinner: mealType === "dinner" ? newStatus : member.dinner,
            guestBreakfast: member.guestBreakfast || 0,
            guestLunch: member.guestLunch || 0,
            guestDinner: member.guestDinner || 0,
          }),
        }
      );
      const resData = await res.json();
      if (resData.success) {
        toast.success(
          `${member.name}'s ${mealType} set to ${newStatus ? "ON" : "OFF"}`
        );
        fetchData(false);
      } else {
        toast.error(resData.message || "Failed to update meal");
        fetchData(false);
      }
    } catch (err) {
      toast.error("Failed to update meal");
      fetchData(false);
    } finally {
      setSavingId(null);
    }
  };

  // Open modal for guest meals edit
  const openGuestModal = (member) => {
    setEditingMember({ ...member });
    setIsModalOpen(true);
  };

  // Save guest meals modal
  const handleSaveGuestMeals = async () => {
    if (!editingMember) return;
    const cacheKey = `manager_meals_${userId}_${date}`;
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(cacheKey);
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/manager/update-meal`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            managerId: userId,
            userId: editingMember.userId,
            date,
            breakfast: mealWeights.breakfast === 0 ? false : editingMember.breakfast,
            lunch: mealWeights.lunch === 0 ? false : editingMember.lunch,
            dinner: mealWeights.dinner === 0 ? false : editingMember.dinner,
            guestBreakfast: mealWeights.breakfast === 0 ? 0 : (parseInt(editingMember.guestBreakfast) || 0),
            guestLunch: mealWeights.lunch === 0 ? 0 : (parseInt(editingMember.guestLunch) || 0),
            guestDinner: mealWeights.dinner === 0 ? 0 : (parseInt(editingMember.guestDinner) || 0),
          }),
        }
      );
      const resData = await res.json();
      if (resData.success) {
        toast.success(`Updated guest meals for ${editingMember.name}`);
        setIsModalOpen(false);
        fetchData(false);
      } else {
        toast.error(resData.message || "Failed to save");
      }
    } catch (err) {
      toast.error("Error saving guest meals");
    }
  };

  const filteredMembers = data.members.filter((m) =>
    m.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300">
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/30 to-transparent pointer-events-none" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Utensils className="text-orange-500" size={26} />
            {t("mealManagement") || "Meal Management"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage daily meals (Breakfast, Lunch, Dinner & Guest Meals) for all mess members.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/manager-dashboard/rice-management"
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 hover:from-amber-600 hover:to-orange-600 shadow-md shadow-amber-500/25 transition cursor-pointer active:scale-95"
          >
            <Boxes size={16} />
            <span>{lang === "bn" ? "রাইস ম্যানেজমেন্ট" : "Rice Management"}</span>
          </Link>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition backdrop-blur-sm"
            />
          </div>

          <button
            onClick={() => fetchData(true)}
            className="p-2.5 bg-gray-100/80 dark:bg-slate-800/80 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl transition cursor-pointer active:scale-95"
            title="Refresh"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Liquid Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Breakfast Card */}
        <div className={`relative overflow-hidden ${mealWeights.breakfast === 0 ? "opacity-60 bg-gray-50/80 dark:bg-slate-900/40 border-dashed border-gray-300 dark:border-slate-800" : "bg-amber-50/80 dark:bg-amber-950/25 border-amber-200/80 dark:border-amber-900/40"} border backdrop-blur-xl p-4.5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300`}>
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent pointer-events-none" />
          <div className="w-12 h-12 bg-amber-500/15 dark:bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner">
            <Sun size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
              Breakfast {mealWeights.breakfast === 0 && <span className="text-[10px] text-gray-400 font-normal">(Weight 0)</span>}
            </p>
            <p className="text-2xl font-extrabold text-amber-950 dark:text-amber-100 mt-0.5">
              {mealWeights.breakfast === 0 ? "—" : data.summary.breakfast}
            </p>
          </div>
        </div>

        {/* Lunch Card */}
        <div className={`relative overflow-hidden ${mealWeights.lunch === 0 ? "opacity-60 bg-gray-50/80 dark:bg-slate-900/40 border-dashed border-gray-300 dark:border-slate-800" : "bg-orange-50/80 dark:bg-orange-950/25 border-orange-200/80 dark:border-orange-900/40"} border backdrop-blur-xl p-4.5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300`}>
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-orange-400/40 to-transparent pointer-events-none" />
          <div className="w-12 h-12 bg-orange-500/15 dark:bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-inner">
            <Sunset size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wider">
              Lunch {mealWeights.lunch === 0 && <span className="text-[10px] text-gray-400 font-normal">(Weight 0)</span>}
            </p>
            <p className="text-2xl font-extrabold text-orange-950 dark:text-orange-100 mt-0.5">
              {mealWeights.lunch === 0 ? "—" : data.summary.lunch}
            </p>
          </div>
        </div>

        {/* Dinner Card */}
        <div className={`relative overflow-hidden ${mealWeights.dinner === 0 ? "opacity-60 bg-gray-50/80 dark:bg-slate-900/40 border-dashed border-gray-300 dark:border-slate-800" : "bg-indigo-50/80 dark:bg-indigo-950/25 border-indigo-200/80 dark:border-indigo-900/40"} border backdrop-blur-xl p-4.5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300`}>
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent pointer-events-none" />
          <div className="w-12 h-12 bg-indigo-500/15 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
            <Moon size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
              Dinner {mealWeights.dinner === 0 && <span className="text-[10px] text-gray-400 font-normal">(Weight 0)</span>}
            </p>
            <p className="text-2xl font-extrabold text-indigo-950 dark:text-indigo-100 mt-0.5">
              {mealWeights.dinner === 0 ? "—" : data.summary.dinner}
            </p>
          </div>
        </div>

        {/* Guest Meal Card */}
        <div className="relative overflow-hidden bg-purple-50/80 dark:bg-purple-950/25 border border-purple-200/80 dark:border-purple-900/40 backdrop-blur-xl p-4.5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/40 to-transparent pointer-events-none" />
          <div className="w-12 h-12 bg-purple-500/15 dark:bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-inner">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
              Guest Meals
            </p>
            <p className="text-2xl font-extrabold text-purple-950 dark:text-purple-100 mt-0.5">
              {data.summary.guestMeal}
            </p>
          </div>
        </div>
      </div>

      {/* Main Members Section */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-300">
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200/60 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search member..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition backdrop-blur-sm"
            />
          </div>
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">
            {filteredMembers.length} Members
          </span>
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            No members found for this query.
          </div>
        ) : (
          <div>
            {/* Mobile View: Rendered on small screens */}
            <div className="block md:hidden divide-y divide-gray-100 dark:divide-slate-800">
              {filteredMembers.map((m, idx) => {
                const joinDate = new Date(m.createdAt);
                joinDate.setUTCHours(0, 0, 0, 0);
                const currentDate = new Date(date);
                currentDate.setUTCHours(0, 0, 0, 0);
                const isBeforeJoining = joinDate > currentDate;

                const totalGuestForMember =
                  (m.guestBreakfast || 0) +
                  (m.guestLunch || 0) +
                  (m.guestDinner || 0);

                const isEven = idx % 2 === 0;
                const cardBg = isEven ? "bg-white dark:bg-slate-900" : "bg-orange-50/50 dark:bg-orange-950/15";

                return (
                  <div key={m.userId} className={`p-4 space-y-3 ${cardBg}`}>
                    {/* Top row: Avatar & name + guest trigger */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {m.image ? (
                          <Image
                            src={m.image}
                            alt={m.name}
                            width={40}
                            height={40}
                            quality={40}
                            className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-slate-700"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-sm">
                            {m.name?.[0]?.toUpperCase() || <User size={18} />}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">
                            {m.name}
                          </p>
                          {isBeforeJoining && (
                            <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                              Joined after this date
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Guest Trigger Button */}
                      {!isBeforeJoining && (
                        <button
                          onClick={() => openGuestModal(m)}
                          className="px-2.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/45 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 text-[11px] font-bold hover:bg-purple-100 dark:hover:bg-purple-900/50 transition flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={11} />
                          <span>Guest: {totalGuestForMember}</span>
                        </button>
                      )}
                    </div>

                    {/* Meal Toggles (3 Columns) */}
                    {!isBeforeJoining && (
                      <div className="grid grid-cols-3 gap-2">
                        {/* Breakfast Toggle */}
                        <button
                          onClick={() => handleToggleMeal(m, "breakfast")}
                          disabled={savingId === `${m.userId}-breakfast` || mealWeights.breakfast === 0}
                          className={`py-2 px-2 rounded-xl text-[11px] font-bold transition flex flex-col items-center justify-center gap-1 border ${
                            mealWeights.breakfast === 0
                              ? "bg-gray-100 dark:bg-slate-800/60 text-gray-400 dark:text-gray-600 border-dashed border-gray-300 dark:border-slate-700 cursor-not-allowed"
                              : m.breakfast
                              ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20 border-transparent hover:bg-orange-600 cursor-pointer"
                              : "bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 border-transparent hover:bg-gray-200 dark:hover:bg-slate-700 cursor-pointer"
                          }`}
                        >
                          <Sun size={14} className={mealWeights.breakfast === 0 ? "text-gray-400 dark:text-gray-600" : m.breakfast ? "text-white" : "text-gray-400"} />
                          <span>BF: {mealWeights.breakfast === 0 ? "—" : m.breakfast ? "ON" : "OFF"}</span>
                        </button>

                        {/* Lunch Toggle */}
                        <button
                          onClick={() => handleToggleMeal(m, "lunch")}
                          disabled={savingId === `${m.userId}-lunch` || mealWeights.lunch === 0}
                          className={`py-2 px-2 rounded-xl text-[11px] font-bold transition flex flex-col items-center justify-center gap-1 border ${
                            mealWeights.lunch === 0
                              ? "bg-gray-100 dark:bg-slate-800/60 text-gray-400 dark:text-gray-600 border-dashed border-gray-300 dark:border-slate-700 cursor-not-allowed"
                              : m.lunch
                              ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20 border-transparent hover:bg-orange-600 cursor-pointer"
                              : "bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 border-transparent hover:bg-gray-200 dark:hover:bg-slate-700 cursor-pointer"
                          }`}
                        >
                          <Sunset size={14} className={mealWeights.lunch === 0 ? "text-gray-400 dark:text-gray-600" : m.lunch ? "text-white" : "text-gray-400"} />
                          <span>Lunch: {mealWeights.lunch === 0 ? "—" : m.lunch ? "ON" : "OFF"}</span>
                        </button>

                        {/* Dinner Toggle */}
                        <button
                          onClick={() => handleToggleMeal(m, "dinner")}
                          disabled={savingId === `${m.userId}-dinner` || mealWeights.dinner === 0}
                          className={`py-2 px-2 rounded-xl text-[11px] font-bold transition flex flex-col items-center justify-center gap-1 border ${
                            mealWeights.dinner === 0
                              ? "bg-gray-100 dark:bg-slate-800/60 text-gray-400 dark:text-gray-600 border-dashed border-gray-300 dark:border-slate-700 cursor-not-allowed"
                              : m.dinner
                              ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20 border-transparent hover:bg-orange-600 cursor-pointer"
                              : "bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 border-transparent hover:bg-gray-200 dark:hover:bg-slate-700 cursor-pointer"
                          }`}
                        >
                          <Moon size={14} className={mealWeights.dinner === 0 ? "text-gray-400 dark:text-gray-600" : m.dinner ? "text-white" : "text-gray-400"} />
                          <span>Dinner: {mealWeights.dinner === 0 ? "—" : m.dinner ? "ON" : "OFF"}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Rendered on md and larger screens */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="bg-gray-50/70 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <th className="py-4 px-6">Member</th>
                    <th className="py-4 px-4 text-center">
                      {mealWeights.breakfast === 0 ? (
                        <span className="line-through text-gray-400 opacity-60">Breakfast (0)</span>
                      ) : (
                        "Breakfast"
                      )}
                    </th>
                    <th className="py-4 px-4 text-center">
                      {mealWeights.lunch === 0 ? (
                        <span className="line-through text-gray-400 opacity-60">Lunch (0)</span>
                      ) : (
                        "Lunch"
                      )}
                    </th>
                    <th className="py-4 px-4 text-center">
                      {mealWeights.dinner === 0 ? (
                        <span className="line-through text-gray-400 opacity-60">Dinner (0)</span>
                      ) : (
                        "Dinner"
                      )}
                    </th>
                    <th className="py-4 px-4 text-center">Guest Meals</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {filteredMembers.map((m, idx) => {
                    const joinDate = new Date(m.createdAt);
                    joinDate.setUTCHours(0, 0, 0, 0);
                    const currentDate = new Date(date);
                    currentDate.setUTCHours(0, 0, 0, 0);
                    const isBeforeJoining = joinDate > currentDate;

                    const totalGuestForMember =
                      (m.guestBreakfast || 0) +
                      (m.guestLunch || 0) +
                      (m.guestDinner || 0);

                    const isEven = idx % 2 === 0;
                    const rowBg = isEven ? "bg-white dark:bg-slate-900" : "bg-orange-50/30 dark:bg-orange-950/10";

                    return (
                      <tr
                        key={m.userId}
                        className={`${rowBg} hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition`}
                      >
                        {/* Member Info */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            {m.image ? (
                              <Image
                                src={m.image}
                                alt={m.name}
                                width={40}
                                height={40}
                                quality={40}
                                className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-slate-700"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-sm">
                                {m.name?.[0]?.toUpperCase() || <User size={18} />}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                {m.name}
                              </p>
                              {isBeforeJoining && (
                                <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                                  Joined after this date
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Breakfast Toggle */}
                        <td className="py-4 px-4 text-center">
                          {isBeforeJoining ? (
                            <span className="text-xs text-gray-400">N/A</span>
                          ) : mealWeights.breakfast === 0 ? (
                            <button
                              disabled
                              title="Disabled in this mess (Weight: 0)"
                              className="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 mx-auto bg-gray-100 dark:bg-slate-800/60 text-gray-400 dark:text-gray-600 border border-dashed border-gray-300 dark:border-slate-700 cursor-not-allowed"
                            >
                              <span>—</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleMeal(m, "breakfast")}
                              disabled={savingId === `${m.userId}-breakfast`}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 mx-auto cursor-pointer ${
                                m.breakfast
                                  ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20 hover:bg-orange-600"
                                  : "bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700"
                              }`}
                            >
                              {m.breakfast ? <Check size={14} /> : <X size={14} />}
                              {m.breakfast ? "ON" : "OFF"}
                            </button>
                          )}
                        </td>

                        {/* Lunch Toggle */}
                        <td className="py-4 px-4 text-center">
                          {isBeforeJoining ? (
                            <span className="text-xs text-gray-400">N/A</span>
                          ) : mealWeights.lunch === 0 ? (
                            <button
                              disabled
                              title="Disabled in this mess (Weight: 0)"
                              className="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 mx-auto bg-gray-100 dark:bg-slate-800/60 text-gray-400 dark:text-gray-600 border border-dashed border-gray-300 dark:border-slate-700 cursor-not-allowed"
                            >
                              <span>—</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleMeal(m, "lunch")}
                              disabled={savingId === `${m.userId}-lunch`}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 mx-auto cursor-pointer ${
                                m.lunch
                                  ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20 hover:bg-orange-600"
                                  : "bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700"
                              }`}
                            >
                              {m.lunch ? <Check size={14} /> : <X size={14} />}
                              {m.lunch ? "ON" : "OFF"}
                            </button>
                          )}
                        </td>

                        {/* Dinner Toggle */}
                        <td className="py-4 px-4 text-center">
                          {isBeforeJoining ? (
                            <span className="text-xs text-gray-400">N/A</span>
                          ) : mealWeights.dinner === 0 ? (
                            <button
                              disabled
                              title="Disabled in this mess (Weight: 0)"
                              className="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 mx-auto bg-gray-100 dark:bg-slate-800/60 text-gray-400 dark:text-gray-600 border border-dashed border-gray-300 dark:border-slate-700 cursor-not-allowed"
                            >
                              <span>—</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleMeal(m, "dinner")}
                              disabled={savingId === `${m.userId}-dinner`}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 mx-auto cursor-pointer ${
                                m.dinner
                                  ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20 hover:bg-orange-600"
                                  : "bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700"
                              }`}
                            >
                              {m.dinner ? <Check size={14} /> : <X size={14} />}
                              {m.dinner ? "ON" : "OFF"}
                            </button>
                          )}
                        </td>

                        {/* Guest Meal Control */}
                        <td className="py-4 px-4 text-center">
                          {isBeforeJoining ? (
                            <span className="text-xs text-gray-400">N/A</span>
                          ) : (
                            <button
                              onClick={() => openGuestModal(m)}
                              className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-semibold hover:bg-purple-100 dark:hover:bg-purple-900/50 transition inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>Guest: {totalGuestForMember}</span>
                              <Plus size={12} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Guest Meal Modal */}
      {isModalOpen && editingMember && (
        <div className="fixed inset-0 bg-black/60 z-[70] backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl w-full max-w-sm border border-gray-100 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Guest Meals for {editingMember.name}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Set additional guest meal counts for {date}
              </p>
            </div>

            <div className="space-y-3">
              {[
                { label: "Guest Breakfast", key: "guestBreakfast", type: "breakfast", color: "amber" },
                { label: "Guest Lunch", key: "guestLunch", type: "lunch", color: "orange" },
                { label: "Guest Dinner", key: "guestDinner", type: "dinner", color: "indigo" },
              ].map(({ label, key, type }) => {
                const isWeightZero = mealWeights[type] === 0;
                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between p-3 rounded-xl border ${
                      isWeightZero
                        ? "bg-gray-100/60 dark:bg-slate-800/30 border-dashed border-gray-300 dark:border-slate-800 opacity-60"
                        : "bg-gray-50 dark:bg-slate-800/60 border-gray-100 dark:border-slate-800"
                    }`}
                  >
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                        {label}
                      </span>
                      {isWeightZero && (
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">
                          🚫 {lang === "bn" ? "বন্ধ (Weight 0)" : "Disabled (Weight 0)"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setEditingMember((prev) => ({
                            ...prev,
                            [key]: Math.max(0, (prev[key] || 0) - 1),
                          }))
                        }
                        disabled={isWeightZero}
                        className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 flex items-center justify-center transition font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-bold text-sm text-gray-900 dark:text-white">
                        {isWeightZero ? 0 : editingMember[key] || 0}
                      </span>
                      <button
                        onClick={() =>
                          setEditingMember((prev) => ({
                            ...prev,
                            [key]: (prev[key] || 0) + 1,
                          }))
                        }
                        disabled={isWeightZero}
                        className="w-8 h-8 rounded-lg bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition font-bold shadow-sm shadow-orange-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGuestMeals}
                className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-sm transition shadow-md shadow-orange-500/20"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
