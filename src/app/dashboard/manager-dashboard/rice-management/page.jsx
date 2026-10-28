"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import { GetUser } from "@/components/action/action";
import { toast } from "sonner";
import MemberAvatar from "@/components/ui/MemberAvatar";
import {
  Boxes,
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
  BarChart3,
  TrendingDown,
  ArrowUpRight,
} from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";
import { getBDDateStr } from "@/lib/date-utils";

export const dynamic = "force-dynamic";

const display = Fraunces({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-display", display: "swap" });
const body = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });

export default function ManagerRiceManagementPage() {
  const user = GetUser();
  const userId = user?.user?.id;
  const { t, lang } = useTranslation();
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
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/user/mess-settings/${userId}`)
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

  const fetchData = React.useCallback(async (showLoader = false) => {
    if (!userId) return;
    if (showLoader) setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/rice/daily?managerId=${userId}&date=${date}`
      );
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
  }, [userId, date]);

  useEffect(() => {
    if (!userId) return;
    let ignore = false;

    fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/rice/daily?managerId=${userId}&date=${date}`)
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
    setMembers((prev) =>
      prev.map((m) => (m.userId === memberId ? { ...m, [riceKey]: newVal } : m))
    );

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/rice/daily`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            managerId: userId,
            userId: memberId,
            date,
            [riceKey]: newVal,
          }),
        }
      );
      const resData = await res.json();
      if (!resData.success) {
        toast.error(resData.message || "Failed to update rice setting");
        fetchData(false);
      }
    } catch (err) {
      toast.error("Error updating rice setting");
      fetchData(false);
    }
  };

  // Open modal for guest rice edit
  const openGuestModal = (member) => {
    const gBf = member.guestBreakfastRice !== undefined ? member.guestBreakfastRice : (member.guestBreakfast || 0);
    const gLn = member.guestLunchRice !== undefined ? member.guestLunchRice : (member.guestLunch || 0);
    const gDn = member.guestDinnerRice !== undefined ? member.guestDinnerRice : (member.guestDinner || 0);

    setEditingGuestMember({
      userId: member.userId,
      name: member.name,
      image: member.image,
      guestBreakfastRice: gBf,
      guestLunchRice: gLn,
      guestDinnerRice: gDn,
      guestRiceExtra: member.guestRiceExtra || 0,
    });
    setIsGuestModalOpen(true);
  };

  // Save guest rice per meal time (Breakfast, Lunch, Dinner Rice)
  // NOTE: This updates ONLY rice management (Meals.guestBreakfastRice etc.), keeping original meal management meals untouched!
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
          ? {
              ...m,
              guestBreakfastRice: bCount,
              guestLunchRice: lCount,
              guestDinnerRice: dCount,
              guestRiceExtra: 0,
            }
          : m
      )
    );

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/rice/daily`,
        {
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
        }
      );
      const resData = await res.json();
      if (resData.success) {
        toast.success(
          isBn
            ? `${editingGuestMember.name}-এর গেস্ট চালের হিসাব আপডেট হয়েছে`
            : `Updated guest rice for ${editingGuestMember.name}`
        );
        setIsGuestModalOpen(false);
        fetchData(false);
      } else {
        toast.error(resData.message || "Failed to update guest rice");
        fetchData(false);
      }
    } catch (err) {
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
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/rice/deposit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            managerId: userId,
            userId: depositMemberId,
            amount: parseFloat(depositAmount),
            date,
            note: depositNote,
          }),
        }
      );
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
      toast.error("Error saving deposit");
    } finally {
      setSavingDeposit(false);
    }
  };

  const filteredMembers = members.filter((m) =>
    m.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compute daily totals
  const summary = members.reduce(
    (acc, curr) => {
      const isBf = curr.breakfastRice !== undefined ? curr.breakfastRice : curr.breakfast;
      const isLn = curr.lunchRice !== undefined ? curr.lunchRice : curr.lunch;
      const isDn = curr.dinnerRice !== undefined ? curr.dinnerRice : curr.dinner;
      if (isBf) acc.breakfast += 1;
      if (isLn) acc.lunch += 1;
      if (isDn) acc.dinner += 1;

      const gBf = curr.guestBreakfastRice !== undefined ? curr.guestBreakfastRice : (curr.guestBreakfast || 0);
      const gLn = curr.guestLunchRice !== undefined ? curr.guestLunchRice : (curr.guestLunch || 0);
      const gDn = curr.guestDinnerRice !== undefined ? curr.guestDinnerRice : (curr.guestDinner || 0);

      acc.guestBreakfast += gBf;
      acc.guestLunch += gLn;
      acc.guestDinner += gDn;
      acc.guestMeal += gBf + gLn + gDn + (curr.guestRiceExtra || 0);
      return acc;
    },
    { breakfast: 0, lunch: 0, dinner: 0, guestBreakfast: 0, guestLunch: 0, guestDinner: 0, guestMeal: 0 }
  );

  if (loading) {
    return (
      <div className={`${display.variable} ${body.variable} ${mono.variable} min-h-screen bg-[#F2F4F1] dark:bg-slate-950 p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-pulse`}>
        <div className="h-10 bg-amber-200/50 dark:bg-slate-800 rounded-2xl w-1/3"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="h-28 bg-white dark:bg-slate-900 rounded-2xl"></div>
          <div className="h-28 bg-white dark:bg-slate-900 rounded-2xl"></div>
          <div className="h-28 bg-white dark:bg-slate-900 rounded-2xl"></div>
          <div className="h-28 bg-white dark:bg-slate-900 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${display.variable} ${body.variable} ${mono.variable} min-h-screen bg-[#F2F4F1] dark:bg-slate-950 font-[family-name:var(--font-body)] text-[#1B2A26] dark:text-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6`}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-[#1B2A26]/10 dark:border-slate-800 pb-5">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#C99A3E] font-semibold flex items-center gap-1.5">
            <Boxes size={15} /> <span>{isBn ? "ম্যানেজার রাইস প্যানেল" : "Manager Rice Panel"}</span>
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold">
            {isBn ? "দৈনিক চাল ব্যবস্থাপনা" : "Daily Rice Management"}
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            {isBn
              ? "দৈনিক চাল জমা, খরচ, মিল চাল চালু/বন্ধ এবং গেস্ট চালের হিসাব"
              : "Daily Rice Management (Deduct/Add Rice, Toggle Meals & Guest Rice)"}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/manager-dashboard/rice-overview"
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 hover:from-amber-600 hover:to-orange-600 shadow-sm transition cursor-pointer"
          >
            <BarChart3 size={15} />
            <span>{isBn ? "রাইস ওভারভিউ" : "Rice Overview"}</span>
          </Link>

          <button
            onClick={() => {
              if (members.length > 0) setDepositMemberId(members[0].userId);
              setIsDepositModalOpen(true);
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus size={15} />
            <span>{isBn ? "চাল জমা/বিয়োগ (+/-)" : "Add/Deduct Rice"}</span>
          </button>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-[#1B2A26]/15 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C99A3E] cursor-pointer"
            />
          </div>

          <button
            onClick={() => fetchData(true)}
            className="p-2 bg-white dark:bg-slate-900 border border-[#1B2A26]/15 dark:border-slate-800 text-gray-700 dark:text-slate-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition cursor-pointer shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Breakfast */}
        <div className="rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 backdrop-blur-xl p-4 shadow-sm hover:scale-[1.01] transition-all">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              {isBn ? "সকালের চাল" : "Breakfast Rice"}
            </span>
            <span className="text-base">🌅</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-mono)] text-gray-900 dark:text-white">
            {summary.breakfast} <span className="text-xs font-normal text-gray-500">{isBn ? "জন" : "Meals"}</span>
          </p>
          {summary.guestBreakfast > 0 && (
            <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 mt-0.5">
              +{summary.guestBreakfast} {isBn ? "গেস্ট" : "guest"}
            </p>
          )}
        </div>

        {/* Lunch */}
        <div className="rounded-2xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/40 backdrop-blur-xl p-4 shadow-sm hover:scale-[1.01] transition-all">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 dark:text-orange-300">
              {isBn ? "দুপুরের চাল" : "Lunch Rice"}
            </span>
            <span className="text-base">☀️</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-mono)] text-gray-900 dark:text-white">
            {summary.lunch} <span className="text-xs font-normal text-gray-500">{isBn ? "জন" : "Meals"}</span>
          </p>
          {summary.guestLunch > 0 && (
            <p className="text-[11px] font-semibold text-orange-700 dark:text-orange-300 mt-0.5">
              +{summary.guestLunch} {isBn ? "গেস্ট" : "guest"}
            </p>
          )}
        </div>

        {/* Dinner */}
        <div className="rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 backdrop-blur-xl p-4 shadow-sm hover:scale-[1.01] transition-all">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              {isBn ? "রাতের চাল" : "Dinner Rice"}
            </span>
            <span className="text-base">🌙</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-mono)] text-gray-900 dark:text-white">
            {summary.dinner} <span className="text-xs font-normal text-gray-500">{isBn ? "জন" : "Meals"}</span>
          </p>
          {summary.guestDinner > 0 && (
            <p className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 mt-0.5">
              +{summary.guestDinner} {isBn ? "গেস্ট" : "guest"}
            </p>
          )}
        </div>

        {/* Guest Rice */}
        <div className="rounded-2xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 backdrop-blur-xl p-4 shadow-sm hover:scale-[1.01] transition-all">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
              {isBn ? "গেস্ট চাল" : "Guest Rice"}
            </span>
            <span className="text-base">👥</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-mono)] text-gray-900 dark:text-white">
            {summary.guestMeal} <span className="text-xs font-normal text-gray-500">{isBn ? "জন" : "Extra"}</span>
          </p>
          <p className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 mt-0.5">
            🌅 {summary.guestBreakfast} • ☀️ {summary.guestLunch} • 🌙 {summary.guestDinner}
          </p>
        </div>
      </div>

      {/* Main Table / Member List Section */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-4 sm:p-6 space-y-4">
        {/* Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-slate-800 pb-4">
          <h2 className="text-base font-bold">
            {isBn ? "সদস্যদের রাইস কন্ট্রোল প্যানেল" : "Member Rice Controls"}
          </h2>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder={isBn ? "মেম্বার খুঁজুন..." : "Search member..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
            />
          </div>
        </div>

        {/* Mobile View - Cards (No Horizontal Scrolling) */}
        <div className="md:hidden space-y-3">
          {filteredMembers.map((m) => {
            const gBf = m.guestBreakfastRice !== undefined ? m.guestBreakfastRice : (m.guestBreakfast || 0);
            const gLn = m.guestLunchRice !== undefined ? m.guestLunchRice : (m.guestLunch || 0);
            const gDn = m.guestDinnerRice !== undefined ? m.guestDinnerRice : (m.guestDinner || 0);
            const totalGuest = Math.max(0, gBf + gLn + gDn + (m.guestRiceExtra || 0));

            return (
              <div key={m.userId} className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <MemberAvatar src={m.image} name={m.name} size={36} />
                    <div>
                      <p className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">{m.name}</p>
                      <span className="text-[10px] uppercase font-bold text-gray-400">{m.role || "MEMBER"}</span>
                    </div>
                  </div>

                  {/* Guest Rice Button (Opens Meal-specific Guest Modal) */}
                  <button
                    onClick={() => openGuestModal(m)}
                    className="px-2.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/45 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-semibold hover:bg-purple-100 dark:hover:bg-purple-900/50 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title={isBn ? "গেস্ট চালের হিসাব বিস্তারিত ও পরিবর্তন" : "Edit Guest Rice"}
                  >
                    <Users size={12} className="text-purple-600 dark:text-purple-400" />
                    <span className="font-bold">Guest: {totalGuest}</span>
                    {totalGuest > 0 ? (
                      <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                        (🌅{gBf} ☀️{gLn} 🌙{gDn})
                      </span>
                    ) : (
                      <Plus size={11} className="text-purple-500" />
                    )}
                  </button>
                </div>

                {/* Meal Toggles */}
                {(() => {
                  const isBf = m.breakfastRice !== undefined ? m.breakfastRice : m.breakfast;
                  const isLn = m.lunchRice !== undefined ? m.lunchRice : m.lunch;
                  const isDn = m.dinnerRice !== undefined ? m.dinnerRice : m.dinner;
                  return (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <button
                        onClick={() => handleToggleMeal(m.userId, "breakfast", isBf)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                          isBf
                            ? "bg-[#ff6900] text-white shadow-sm shadow-orange-500/20"
                            : "bg-gray-100 dark:bg-slate-800 text-gray-400"
                        }`}
                      >
                        {isBf ? <Check size={14} /> : <X size={14} />}
                        <span>BF: {isBf ? "ON" : "OFF"}</span>
                        {gBf > 0 && (
                          <span className="ml-0.5 px-1 rounded bg-black/20 text-[10px]">
                            +{gBf}g
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => handleToggleMeal(m.userId, "lunch", isLn)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                          isLn
                            ? "bg-[#ff6900] text-white shadow-sm shadow-orange-500/20"
                            : "bg-gray-100 dark:bg-slate-800 text-gray-400"
                        }`}
                      >
                        {isLn ? <Check size={14} /> : <X size={14} />}
                        <span>LN: {isLn ? "ON" : "OFF"}</span>
                        {gLn > 0 && (
                          <span className="ml-0.5 px-1 rounded bg-black/20 text-[10px]">
                            +{gLn}g
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => handleToggleMeal(m.userId, "dinner", isDn)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                          isDn
                            ? "bg-[#ff6900] text-white shadow-sm shadow-orange-500/20"
                            : "bg-gray-100 dark:bg-slate-800 text-gray-400"
                        }`}
                      >
                        {isDn ? <Check size={14} /> : <X size={14} />}
                        <span>DN: {isDn ? "ON" : "OFF"}</span>
                        {gDn > 0 && (
                          <span className="ml-0.5 px-1 rounded bg-black/20 text-[10px]">
                            +{gDn}g
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>

        {/* Desktop View - Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-gray-400 bg-gray-50/50 dark:bg-slate-800/40">
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4 text-center">Breakfast Rice</th>
                <th className="py-3 px-4 text-center">Lunch Rice</th>
                <th className="py-3 px-4 text-center">Dinner Rice</th>
                <th className="py-3 px-4 text-center">Guest Rice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {filteredMembers.map((m) => {
                const gBf = m.guestBreakfastRice !== undefined ? m.guestBreakfastRice : (m.guestBreakfast || 0);
                const gLn = m.guestLunchRice !== undefined ? m.guestLunchRice : (m.guestLunch || 0);
                const gDn = m.guestDinnerRice !== undefined ? m.guestDinnerRice : (m.guestDinner || 0);
                const totalGuest = Math.max(0, gBf + gLn + gDn + (m.guestRiceExtra || 0));

                return (
                  <tr key={m.userId} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <MemberAvatar src={m.image} name={m.name} size={36} />
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">{m.name}</p>
                          <span className="text-[10px] uppercase font-bold text-gray-400">{m.role || "MEMBER"}</span>
                        </div>
                      </div>
                    </td>

                    {/* Breakfast Toggle */}
                    {(() => {
                      const isBf = m.breakfastRice !== undefined ? m.breakfastRice : m.breakfast;
                      const isLn = m.lunchRice !== undefined ? m.lunchRice : m.lunch;
                      const isDn = m.dinnerRice !== undefined ? m.dinnerRice : m.dinner;
                      return (
                        <>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleToggleMeal(m.userId, "breakfast", isBf)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer ${
                                isBf
                                  ? "bg-[#ff6900] text-white shadow-sm shadow-orange-500/20"
                                  : "bg-gray-100 dark:bg-slate-800 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200"
                              }`}
                            >
                              {isBf ? <Check size={14} /> : <X size={14} />}
                              <span>{isBf ? "ON" : "OFF"}</span>
                              {gBf > 0 && (
                                <span className="ml-0.5 px-1.5 py-0.2 rounded-md bg-black/20 text-[10px] font-semibold" title={`${gBf} guest breakfast rice`}>
                                  +{gBf}g
                                </span>
                              )}
                            </button>
                          </td>

                          {/* Lunch Toggle */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleToggleMeal(m.userId, "lunch", isLn)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer ${
                                isLn
                                  ? "bg-[#ff6900] text-white shadow-sm shadow-orange-500/20"
                                  : "bg-gray-100 dark:bg-slate-800 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200"
                              }`}
                            >
                              {isLn ? <Check size={14} /> : <X size={14} />}
                              <span>{isLn ? "ON" : "OFF"}</span>
                              {gLn > 0 && (
                                <span className="ml-0.5 px-1.5 py-0.2 rounded-md bg-black/20 text-[10px] font-semibold" title={`${gLn} guest lunch rice`}>
                                  +{gLn}g
                                </span>
                              )}
                            </button>
                          </td>

                          {/* Dinner Toggle */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleToggleMeal(m.userId, "dinner", isDn)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer ${
                                isDn
                                  ? "bg-[#ff6900] text-white shadow-sm shadow-orange-500/20"
                                  : "bg-gray-100 dark:bg-slate-800 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200"
                              }`}
                            >
                              {isDn ? <Check size={14} /> : <X size={14} />}
                              <span>{isDn ? "ON" : "OFF"}</span>
                              {gDn > 0 && (
                                <span className="ml-0.5 px-1.5 py-0.2 rounded-md bg-black/20 text-[10px] font-semibold" title={`${gDn} guest dinner rice`}>
                                  +{gDn}g
                                </span>
                              )}
                            </button>
                          </td>
                        </>
                      );
                    })()}

                    {/* Guest Rice / Guest Meals (+ / -) */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => openGuestModal(m)}
                        className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/70 dark:border-purple-800/60 rounded-xl text-xs font-semibold hover:bg-purple-100 dark:hover:bg-purple-900/50 transition inline-flex flex-col items-center gap-0.5 cursor-pointer shadow-xs"
                        title={isBn ? "গেস্ট চালের হিসাব বিস্তারিত ও পরিবর্তন" : "Edit Guest Rice Breakdown"}
                      >
                        <div className="flex items-center gap-1.5 font-bold">
                          <Users size={13} className="text-purple-600 dark:text-purple-400" />
                          <span>Guest: {totalGuest}</span>
                          <Plus size={11} className="text-purple-500" />
                        </div>
                        {totalGuest > 0 ? (
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                            🌅 {gBf} • ☀️ {gLn} • 🌙 {gDn}
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400 font-normal">
                            {isBn ? "গেস্ট যোগ করুন" : "+ Add guest"}
                          </span>
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

      {/* Guest Meal Breakdown Modal */}
      {isGuestModalOpen && editingGuestMember && (
        <div className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl w-full max-w-sm border border-gray-100 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <MemberAvatar src={editingGuestMember.image} name={editingGuestMember.name} size={36} />
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                    {editingGuestMember.name}
                  </h2>
                  <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                    {isBn ? "গেস্ট চালের হিসাব" : "Guest Rice Breakdown"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGuestModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2.5">
              {[
                { label: isBn ? "সকালের গেস্ট চাল" : "Guest Breakfast Rice", key: "guestBreakfastRice", type: "breakfast", icon: "🌅" },
                { label: isBn ? "দুপুরের গেস্ট চাল" : "Guest Lunch Rice", key: "guestLunchRice", type: "lunch", icon: "☀️" },
                { label: isBn ? "রাতের গেস্ট চাল" : "Guest Dinner Rice", key: "guestDinnerRice", type: "dinner", icon: "🌙" },
              ].map(({ label, key, type, icon }) => {
                const isWeightZero = mealWeights[type] === 0;
                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between p-3 rounded-xl border ${
                      isWeightZero
                        ? "bg-gray-100/50 dark:bg-slate-800/30 border-dashed border-gray-200 dark:border-slate-800 opacity-60"
                        : "bg-gray-50 dark:bg-slate-800/60 border-gray-100 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{icon}</span>
                      <div>
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                          {label}
                        </span>
                        {isWeightZero && (
                          <span className="text-[10px] text-gray-400 font-medium">
                            {isBn ? "মেসে এই বেলা বন্ধ" : "Disabled in mess"}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingGuestMember((prev) => ({
                            ...prev,
                            [key]: Math.max(0, (prev[key] || 0) - 1),
                          }))
                        }
                        disabled={isWeightZero}
                        className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 flex items-center justify-center transition font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-7 text-center font-bold text-xs sm:text-sm font-[family-name:var(--font-mono)] text-gray-900 dark:text-white">
                        {isWeightZero ? 0 : editingGuestMember[key] || 0}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingGuestMember((prev) => ({
                            ...prev,
                            [key]: (prev[key] || 0) + 1,
                          }))
                        }
                        disabled={isWeightZero}
                        className="w-7 h-7 rounded-lg bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center transition font-bold shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Guest in Modal */}
            <div className="flex items-center justify-between px-3 py-2 bg-purple-50/70 dark:bg-purple-950/30 rounded-xl border border-purple-100 dark:border-purple-900/30 text-xs">
              <span className="font-semibold text-purple-900 dark:text-purple-300">
                {isBn ? "মোট গেস্ট চাল:" : "Total Guest Rice:"}
              </span>
              <span className="font-bold font-[family-name:var(--font-mono)] text-purple-950 dark:text-purple-200 text-sm">
                {(editingGuestMember.guestBreakfastRice || 0) +
                  (editingGuestMember.guestLunchRice || 0) +
                  (editingGuestMember.guestDinnerRice || 0)}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsGuestModalOpen(false)}
                className="w-full py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                {isBn ? "বাতিল" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleSaveGuestMeals}
                disabled={savingGuest}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs transition shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {savingGuest ? (isBn ? "সংরক্ষণ হচ্ছে..." : "Saving...") : (isBn ? "সংরক্ষণ করুন" : "Save Changes")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Deposit Modal */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Plus size={18} className="text-amber-500" />
                <span>{isBn ? "চাল জমা/বিয়োগ করুন" : "Add / Deduct Rice Deposit"}</span>
              </h3>
              <button
                onClick={() => setIsDepositModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-1 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                  Select Member
                </label>
                <select
                  value={depositMemberId}
                  onChange={(e) => setDepositMemberId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                  Amount (Unit) — Positive (+) to Add, Negative (-) to Deduct
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="e.g. 10 to add, or -2 to deduct"
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  value={depositNote}
                  onChange={(e) => setDepositNote(e.target.value)}
                  placeholder="e.g. Rice deposit or adjustment note"
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDepositModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDeposit}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {savingDeposit ? "Saving..." : "Save Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
