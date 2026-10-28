"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { GetUser } from "@/components/action/action";
import { toast } from "sonner";
import MemberAvatar from "@/components/ui/MemberAvatar";
import {
  Boxes,
  Check,
  X,
  Calendar,
  Plus,
  Minus,
  Search,
  RefreshCw,
  Users,
  BarChart3,
  Sun,
  Sunset,
  Moon,
} from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";
import { getBDDateStr } from "@/lib/date-utils";

export const dynamic = "force-dynamic";

const API = process.env.NEXT_PUBLIC_API_URL || "";

// Meal config (one place for label / icon / key names)
const MEALS = [
  {
    type: "breakfast",
    short: "BF",
    icon: "🌅",
    IconComponent: Sun,
    bn: "সকাল",
    en: "Breakfast",
    guestKey: "guestBreakfastRice",
    bnGuest: "সকালের গেস্ট চাল",
    enGuest: "Guest Breakfast Rice",
  },
  {
    type: "lunch",
    short: "LN",
    icon: "☀️",
    IconComponent: Sunset,
    bn: "দুপুর",
    en: "Lunch",
    guestKey: "guestLunchRice",
    bnGuest: "দুপুরের গেস্ট চাল",
    enGuest: "Guest Lunch Rice",
  },
  {
    type: "dinner",
    short: "DN",
    icon: "🌙",
    IconComponent: Moon,
    bn: "রাত",
    en: "Dinner",
    guestKey: "guestDinnerRice",
    bnGuest: "রাতের গেস্ট চাল",
    enGuest: "Guest Dinner Rice",
  },
];

// Fallback logic: Rice fields first, old meal fields second
const readMember = (m) => ({
  on: {
    breakfast: m.breakfastRice !== undefined ? m.breakfastRice : m.breakfast,
    lunch: m.lunchRice !== undefined ? m.lunchRice : m.lunch,
    dinner: m.dinnerRice !== undefined ? m.dinnerRice : m.dinner,
  },
  guest: {
    breakfast: m.guestBreakfastRice !== undefined ? m.guestBreakfastRice : m.guestBreakfast || 0,
    lunch: m.guestLunchRice !== undefined ? m.guestLunchRice : m.guestLunch || 0,
    dinner: m.guestDinnerRice !== undefined ? m.guestDinnerRice : m.guestDinner || 0,
  },
});

const inputCls =
  "w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition";

export default function ManagerRiceManagementPage() {
  const user = GetUser();
  const userId = user?.user?.id;
  const { lang } = useTranslation();
  const isBn = lang === "bn";

  const [date, setDate] = useState(() => getBDDateStr());
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [members, setMembers] = useState([]);
  const [mealWeights, setMealWeights] = useState({ breakfast: 0.5, lunch: 1, dinner: 1 });

  // Guest Meal Modal state
  const [editingGuestMember, setEditingGuestMember] = useState(null);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [savingGuest, setSavingGuest] = useState(false);

  // Deposit modal state
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositMemberId, setDepositMemberId] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositNote, setDepositNote] = useState("");
  const [savingDeposit, setSavingDeposit] = useState(false);

  // Fetch Mess meal settings (weights)
  useEffect(() => {
    if (!userId) return;
    fetch(`${API}/api/user/mess-settings/${userId}`)
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

  const fetchData = useCallback(
    async (showLoader = false) => {
      if (!userId) return;
      if (showLoader) setLoading(true);

      try {
        const res = await fetch(`${API}/api/rice/daily?managerId=${userId}&date=${date}`);
        const resData = await res.json();
        if (resData.success) {
          setMembers(resData.members || []);
        } else {
          toast.error(resData.message || "Failed to load daily rice management");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error connecting to server");
      } finally {
        setLoading(false);
      }
    },
    [userId, date]
  );

  useEffect(() => {
    if (!userId) return;
    let ignore = false;

    fetch(`${API}/api/rice/daily?managerId=${userId}&date=${date}`)
      .then((res) => res.json())
      .then((resData) => {
        if (ignore) return;
        setLoading(false);
        if (resData.success) {
          setMembers(resData.members || []);
        } else {
          toast.error(resData.message || "Failed to load daily rice management");
        }
      })
      .catch((err) => {
        if (ignore) return;
        console.error(err);
        setLoading(false);
        toast.error("Error connecting to server");
      });

    return () => {
      ignore = true;
    };
  }, [userId, date]);

  // Toggle rice state (Breakfast, Lunch, Dinner Rice) without changing meal management meals!
  const handleToggleMeal = async (memberId, mealType, currentVal) => {
    const riceKey = `${mealType}Rice`;
    const newVal = !currentVal;
    // Optimistic UI update
    setMembers((prev) => prev.map((m) => (m.userId === memberId ? { ...m, [riceKey]: newVal } : m)));

    try {
      const res = await fetch(`${API}/api/rice/daily`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerId: userId, userId: memberId, date, [riceKey]: newVal }),
      });
      const resData = await res.json();
      if (!resData.success) {
        toast.error(resData.message || "Failed to update rice setting");
        fetchData(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating rice setting");
      fetchData(false);
    }
  };

  // Open modal for guest rice edit
  const openGuestModal = (member) => {
    const { guest } = readMember(member);
    setEditingGuestMember({
      userId: member.userId,
      name: member.name,
      image: member.image,
      guestBreakfastRice: guest.breakfast,
      guestLunchRice: guest.lunch,
      guestDinnerRice: guest.dinner,
      guestRiceExtra: member.guestRiceExtra || 0,
    });
    setIsGuestModalOpen(true);
  };

  // Save guest rice per meal time. Updates ONLY rice management, meal management stays untouched!
  const handleSaveGuestMeals = async () => {
    if (!editingGuestMember || !userId) return;
    setSavingGuest(true);

    const bCount = mealWeights.breakfast === 0 ? 0 : Math.max(0, parseInt(editingGuestMember.guestBreakfastRice) || 0);
    const lCount = mealWeights.lunch === 0 ? 0 : Math.max(0, parseInt(editingGuestMember.guestLunchRice) || 0);
    const dCount = mealWeights.dinner === 0 ? 0 : Math.max(0, parseInt(editingGuestMember.guestDinnerRice) || 0);

    // Optimistic UI update
    setMembers((prev) =>
      prev.map((m) =>
        m.userId === editingGuestMember.userId
          ? { ...m, guestBreakfastRice: bCount, guestLunchRice: lCount, guestDinnerRice: dCount, guestRiceExtra: 0 }
          : m
      )
    );

    try {
      const res = await fetch(`${API}/api/rice/daily`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          managerId: userId,
          userId: editingGuestMember.userId,
          date,
          guestBreakfastRice: bCount,
          guestLunchRice: lCount,
          guestDinnerRice: dCount,
          guestRiceExtra: 0,
        }),
      });
      const resData = await res.json();
      if (resData.success) {
        toast.success(
          isBn
            ? `${editingGuestMember.name}-এর গেস্ট চালের হিসাব আপডেট হয়েছে`
            : `Updated guest rice for ${editingGuestMember.name}`
        );
        setIsGuestModalOpen(false);
        fetchData(false);
      } else {
        toast.error(resData.message || "Failed to update guest rice");
        fetchData(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating guest rice");
      fetchData(false);
    } finally {
      setSavingGuest(false);
    }
  };

  // Handle rice deposit submit
  const handleAddDeposit = async (e) => {
    e.preventDefault();
    if (!depositMemberId || !depositAmount) {
      toast.error("Please select a member and enter amount");
      return;
    }

    setSavingDeposit(true);
    try {
      const res = await fetch(`${API}/api/rice/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          managerId: userId,
          userId: depositMemberId,
          amount: parseFloat(depositAmount),
          date,
          note: depositNote,
        }),
      });
      const resData = await res.json();
      if (resData.success) {
        toast.success("Rice deposit/deduction updated!");
        setIsDepositModalOpen(false);
        setDepositAmount("");
        setDepositNote("");
        fetchData(false);
      } else {
        toast.error(resData.message || "Failed to add deposit");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error saving deposit");
    } finally {
      setSavingDeposit(false);
    }
  };

  const filteredMembers = members.filter((m) => m.name?.toLowerCase().includes(searchQuery.toLowerCase()));

  // Compute daily totals
  const summary = members.reduce(
    (acc, curr) => {
      const { on, guest } = readMember(curr);
      if (on.breakfast) acc.breakfast += 1;
      if (on.lunch) acc.lunch += 1;
      if (on.dinner) acc.dinner += 1;
      acc.guestBreakfast += guest.breakfast;
      acc.guestLunch += guest.lunch;
      acc.guestDinner += guest.dinner;
      acc.guestMeal += guest.breakfast + guest.lunch + guest.dinner + (curr.guestRiceExtra || 0);
      return acc;
    },
    { breakfast: 0, lunch: 0, dinner: 0, guestBreakfast: 0, guestLunch: 0, guestDinner: 0, guestMeal: 0 }
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
              <Boxes size={20} />
            </span>
            <h1 className="text-2xl font-black bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              {isBn ? "দৈনিক চাল ব্যবস্থাপনা" : "Daily Rice Management"}
            </h1>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {isBn
              ? "সদস্যদের মিলের চাল (সকাল, দুপুর, রাত) চালু/বন্ধ এবং গেস্ট চালের সহজ হিসাব"
              : "Manage daily rice (Breakfast, Lunch, Dinner & Guest Rice) for all mess members."}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/manager-dashboard/rice-overview"
            className="px-4 py-2 bg-white/80 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl text-xs flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-slate-700 shadow-xs transition cursor-pointer active:scale-95"
          >
            <BarChart3 size={16} />
            <span>{isBn ? "রাইস ওভারভিউ" : "Rice Overview"}</span>
          </Link>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition backdrop-blur-sm cursor-pointer"
            />
          </div>

          <button
            onClick={() => fetchData(true)}
            className="p-2.5 bg-gray-100/80 dark:bg-slate-800/80 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl transition cursor-pointer active:scale-95"
            title="Refresh"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>

          <button
            onClick={() => {
              if (members.length > 0) setDepositMemberId(members[0].userId);
              setIsDepositModalOpen(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 hover:from-amber-600 hover:to-orange-600 shadow-md shadow-amber-500/25 transition cursor-pointer active:scale-95"
          >
            <Plus size={16} />
            <span>{isBn ? "চাল জমা/বিয়োগ (+/-)" : "Add / Deduct Rice"}</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Breakfast Card */}
        <div
          className={`relative overflow-hidden ${
            mealWeights.breakfast === 0
              ? "opacity-60 bg-gray-50/80 dark:bg-slate-900/40 border-dashed border-gray-300 dark:border-slate-800"
              : "bg-amber-50/80 dark:bg-amber-950/25 border-amber-200/80 dark:border-amber-900/40"
          } border backdrop-blur-xl p-4.5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300`}
        >
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent pointer-events-none" />
          <div className="w-12 h-12 bg-amber-500/15 dark:bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner">
            <Sun size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
              {isBn ? "সকালের চাল" : "Breakfast Rice"}
            </p>
            <p className="text-2xl font-extrabold text-amber-950 dark:text-amber-100 mt-0.5">
              {summary.breakfast + summary.guestBreakfast}
            </p>
            <p className="text-[11px] text-amber-800/70 dark:text-amber-300/60 mt-0.5">
              {summary.breakfast} {isBn ? "জন" : "mem"}
              {summary.guestBreakfast > 0 && ` + ${summary.guestBreakfast} guest`}
            </p>
          </div>
        </div>

        {/* Lunch Card */}
        <div
          className={`relative overflow-hidden ${
            mealWeights.lunch === 0
              ? "opacity-60 bg-gray-50/80 dark:bg-slate-900/40 border-dashed border-gray-300 dark:border-slate-800"
              : "bg-orange-50/80 dark:bg-orange-950/25 border-orange-200/80 dark:border-orange-900/40"
          } border backdrop-blur-xl p-4.5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300`}
        >
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-orange-400/40 to-transparent pointer-events-none" />
          <div className="w-12 h-12 bg-orange-500/15 dark:bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-inner">
            <Sunset size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wider">
              {isBn ? "দুপুরের চাল" : "Lunch Rice"}
            </p>
            <p className="text-2xl font-extrabold text-orange-950 dark:text-orange-100 mt-0.5">
              {summary.lunch + summary.guestLunch}
            </p>
            <p className="text-[11px] text-orange-800/70 dark:text-orange-300/60 mt-0.5">
              {summary.lunch} {isBn ? "জন" : "mem"}
              {summary.guestLunch > 0 && ` + ${summary.guestLunch} guest`}
            </p>
          </div>
        </div>

        {/* Dinner Card */}
        <div
          className={`relative overflow-hidden ${
            mealWeights.dinner === 0
              ? "opacity-60 bg-gray-50/80 dark:bg-slate-900/40 border-dashed border-gray-300 dark:border-slate-800"
              : "bg-indigo-50/80 dark:bg-indigo-950/25 border-indigo-200/80 dark:border-indigo-900/40"
          } border backdrop-blur-xl p-4.5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300`}
        >
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent pointer-events-none" />
          <div className="w-12 h-12 bg-indigo-500/15 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
            <Moon size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
              {isBn ? "রাতের চাল" : "Dinner Rice"}
            </p>
            <p className="text-2xl font-extrabold text-indigo-950 dark:text-indigo-100 mt-0.5">
              {summary.dinner + summary.guestDinner}
            </p>
            <p className="text-[11px] text-indigo-800/70 dark:text-indigo-300/60 mt-0.5">
              {summary.dinner} {isBn ? "জন" : "mem"}
              {summary.guestDinner > 0 && ` + ${summary.guestDinner} guest`}
            </p>
          </div>
        </div>

        {/* Guest Rice Card */}
        <div className="relative overflow-hidden bg-purple-50/80 dark:bg-purple-950/25 border border-purple-200/80 dark:border-purple-900/40 backdrop-blur-xl p-4.5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/40 to-transparent pointer-events-none" />
          <div className="w-12 h-12 bg-purple-500/15 dark:bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-inner">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
              {isBn ? "মোট গেস্ট চাল" : "Guest Rice"}
            </p>
            <p className="text-2xl font-extrabold text-purple-950 dark:text-purple-100 mt-0.5">
              {summary.guestMeal}
            </p>
            <p className="text-[11px] text-purple-800/70 dark:text-purple-300/60 mt-0.5">
              🌅 {summary.guestBreakfast} &nbsp;☀️ {summary.guestLunch} &nbsp;🌙 {summary.guestDinner}
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
              placeholder={isBn ? "মেম্বার খুঁজুন..." : "Search member..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition backdrop-blur-sm"
            />
          </div>
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">
            {filteredMembers.length} {isBn ? "জন সদস্য" : "Members"}
          </span>
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 text-sm">
            {isBn ? "কোনো মেম্বার পাওয়া যায়নি" : "No members found for this query."}
          </div>
        ) : (
          <div>
            {/* Mobile View */}
            <div className="block md:hidden divide-y divide-gray-100 dark:divide-slate-800">
              {filteredMembers.map((m, idx) => {
                const { on, guest } = readMember(m);
                const totalGuest = Math.max(0, guest.breakfast + guest.lunch + guest.dinner + (m.guestRiceExtra || 0));
                const isEven = idx % 2 === 0;
                const cardBg = isEven ? "bg-white dark:bg-slate-900" : "bg-orange-50/30 dark:bg-orange-950/15";

                return (
                  <div key={m.userId} className={`p-4 space-y-3 ${cardBg}`}>
                    {/* Top row: Avatar & name + guest trigger */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MemberAvatar src={m.image} name={m.name} size={40} />
                        <div>
                          <p className="font-bold text-sm text-gray-900 dark:text-white leading-tight">{m.name}</p>
                          <p className="text-[11px] text-gray-400 capitalize">{m.role || "Member"}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => openGuestModal(m)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition inline-flex items-center gap-1.5 cursor-pointer ${
                          totalGuest > 0
                            ? "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50"
                            : "bg-gray-50 dark:bg-slate-800/60 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <Users size={14} />
                        <span>Guest: {totalGuest}</span>
                      </button>
                    </div>

                    {/* Meal Toggles */}
                    <div className="grid grid-cols-3 gap-2">
                      {MEALS.map((meal) => {
                        const isOn = on[meal.type];
                        const Icon = meal.IconComponent;
                        return (
                          <button
                            key={meal.type}
                            onClick={() => handleToggleMeal(m.userId, meal.type, isOn)}
                            className={`py-2 px-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                              isOn
                                ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20 hover:bg-orange-600"
                                : "bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700"
                            }`}
                          >
                            <Icon size={13} className={isOn ? "text-white" : "text-gray-400"} />
                            <span>
                              {meal.short}: {isOn ? "ON" : "OFF"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="bg-gray-50/70 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <th className="py-4 px-6">{isBn ? "সদস্য" : "Member"}</th>
                    {MEALS.map((meal) => (
                      <th key={meal.type} className="py-4 px-4 text-center">
                        {isBn ? `${meal.bn}র চাল` : `${meal.en} Rice`}
                      </th>
                    ))}
                    <th className="py-4 px-4 text-center">{isBn ? "গেস্ট চাল" : "Guest Rice"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {filteredMembers.map((m, idx) => {
                    const { on, guest } = readMember(m);
                    const totalGuest = Math.max(0, guest.breakfast + guest.lunch + guest.dinner + (m.guestRiceExtra || 0));
                    const isEven = idx % 2 === 0;
                    const rowBg = isEven ? "bg-white dark:bg-slate-900" : "bg-orange-50/20 dark:bg-orange-950/10";

                    return (
                      <tr key={m.userId} className={`${rowBg} hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition`}>
                        {/* Member Info */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <MemberAvatar src={m.image} name={m.name} size={40} />
                            <div>
                              <p className="font-bold text-sm text-gray-900 dark:text-white leading-tight">{m.name}</p>
                              <p className="text-xs text-gray-400 capitalize">{m.role || "Member"}</p>
                            </div>
                          </div>
                        </td>

                        {/* Meal Toggles */}
                        {MEALS.map((meal) => {
                          const isOn = on[meal.type];
                          return (
                            <td key={meal.type} className="py-4 px-4 text-center">
                              <button
                                onClick={() => handleToggleMeal(m.userId, meal.type, isOn)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 mx-auto cursor-pointer ${
                                  isOn
                                    ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20 hover:bg-orange-600"
                                    : "bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700"
                                }`}
                              >
                                {isOn ? <Check size={14} /> : <X size={14} />}
                                <span>{isOn ? "ON" : "OFF"}</span>
                              </button>
                            </td>
                          );
                        })}

                        {/* Guest Rice Button */}
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => openGuestModal(m)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition inline-flex items-center gap-1.5 cursor-pointer ${
                              totalGuest > 0
                                ? "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50 shadow-xs"
                                : "bg-gray-50 dark:bg-slate-800/60 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800"
                            }`}
                            title={isBn ? "গেস্ট চালের হিসাব" : "Guest rice"}
                          >
                            <Users size={14} />
                            {totalGuest > 0 ? (
                              <>
                                <span className="font-bold">Guest: {totalGuest}</span>
                                <span className="text-[11px] opacity-80">
                                  🌅{guest.breakfast} ☀️{guest.lunch} 🌙{guest.dinner}
                                </span>
                              </>
                            ) : (
                              <>
                                <Plus size={12} />
                                <span>{isBn ? "গেস্ট চাল" : "Add Guest"}</span>
                              </>
                            )}
                          </button>
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

      {/* Guest Meal Breakdown Modal */}
      {isGuestModalOpen && editingGuestMember && (
        <div className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl w-full max-w-sm border border-gray-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <MemberAvatar src={editingGuestMember.image} name={editingGuestMember.name} size={38} />
                <div>
                  <h2 className="font-bold text-base text-gray-900 dark:text-white leading-tight">
                    {editingGuestMember.name}
                  </h2>
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                    {isBn ? "গেস্ট চালের হিসাব" : "Guest rice breakdown"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGuestModalOpen(false)}
                aria-label="Close"
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2.5">
              {MEALS.map((meal) => {
                const key = meal.guestKey;
                const isWeightZero = mealWeights[meal.type] === 0;
                const Icon = meal.IconComponent;
                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between p-3 rounded-xl border ${
                      isWeightZero
                        ? "border-dashed border-gray-200 dark:border-slate-800 opacity-60"
                        : "bg-gray-50 dark:bg-slate-800/60 border-gray-100 dark:border-slate-700/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
                        <Icon size={16} />
                      </span>
                      <div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white block">
                          {isBn ? meal.bnGuest : meal.enGuest}
                        </span>
                        {isWeightZero && (
                          <span className="text-[11px] text-gray-400">
                            {isBn ? "মেসে এই বেলা বন্ধ" : "Disabled in mess"}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingGuestMember((prev) => ({ ...prev, [key]: Math.max(0, (prev[key] || 0) - 1) }))
                        }
                        disabled={isWeightZero}
                        aria-label="Decrease"
                        className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600 flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-bold text-base text-gray-800 dark:text-gray-100">
                        {isWeightZero ? 0 : editingGuestMember[key] || 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingGuestMember((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }))}
                        disabled={isWeightZero}
                        aria-label="Increase"
                        className="w-8 h-8 rounded-lg bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm shadow-orange-500/20"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Guest in Modal */}
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200/80 dark:border-purple-900/40 text-sm">
              <span className="font-semibold text-purple-700 dark:text-purple-300">
                {isBn ? "মোট গেস্ট চাল:" : "Total guest rice"}
              </span>
              <span className="font-bold text-lg text-purple-700 dark:text-purple-300">
                {(editingGuestMember.guestBreakfastRice || 0) +
                  (editingGuestMember.guestLunchRice || 0) +
                  (editingGuestMember.guestDinnerRice || 0)}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsGuestModalOpen(false)}
                className="w-full py-2.5 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl font-bold text-sm text-gray-700 dark:text-gray-300 transition cursor-pointer"
              >
                {isBn ? "বাতিল" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleSaveGuestMeals}
                disabled={savingGuest}
                className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition disabled:opacity-50 cursor-pointer shadow-md shadow-orange-500/25"
              >
                {savingGuest ? (isBn ? "সংরক্ষণ হচ্ছে..." : "Saving...") : isBn ? "সংরক্ষণ করুন" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Deposit Modal */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                {isBn ? "চাল জমা/বিয়োগ করুন" : "Add or deduct rice"}
              </h3>
              <button
                onClick={() => setIsDepositModalOpen(false)}
                aria-label="Close"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddDeposit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  {isBn ? "সদস্য নির্বাচন করুন" : "Select member"}
                </label>
                <select value={depositMemberId} onChange={(e) => setDepositMemberId(e.target.value)} className={inputCls}>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  {isBn ? "পরিমাণ (কেজি / ইউনিট)" : "Amount (unit)"}
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="e.g. 10 to add, or -2 to deduct"
                  className={inputCls}
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  {isBn ? "যোগ করতে পজিটিভ (+), কমাতে নেগেটিভ (-) দিন" : "Positive (+) adds rice, negative (-) deducts."}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  {isBn ? "তারিখ" : "Date"}
                </label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} required />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  {isBn ? "নোট (ঐচ্ছিক)" : "Note (optional)"}
                </label>
                <input
                  type="text"
                  value={depositNote}
                  onChange={(e) => setDepositNote(e.target.value)}
                  placeholder={isBn ? "চাল জমা বা খরচের বিবরণ..." : "e.g. Rice deposit or adjustment note"}
                  className={inputCls}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDepositModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {isBn ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={savingDeposit}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-sm font-bold transition disabled:opacity-50 cursor-pointer shadow-md shadow-orange-500/25"
                >
                  {savingDeposit ? (isBn ? "সংরক্ষণ হচ্ছে..." : "Saving...") : isBn ? "সংরক্ষণ করুন" : "Save entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}