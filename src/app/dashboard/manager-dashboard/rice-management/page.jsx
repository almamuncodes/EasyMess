"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { GetUser } from "@/components/action/action";
import { toast } from "sonner";
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

export default function ManagerRiceManagementPage() {
  const user = GetUser();
  const userId = user?.user?.id;
  const { t, lang } = useTranslation();

  const [date, setDate] = useState(() => getBDDateStr());
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [members, setMembers] = useState([]);
  const [activeGuestUserId, setActiveGuestUserId] = useState(null);

  // Deposit modal state
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositMemberId, setDepositMemberId] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositNote, setDepositNote] = useState("");
  const [savingDeposit, setSavingDeposit] = useState(false);

  const fetchData = async (showLoader = false) => {
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
  };

  useEffect(() => {
    if (userId) fetchData(true);
  }, [userId, date]);

  // Toggle meal state (Breakfast, Lunch, Dinner)
  const handleToggleMeal = async (memberId, mealType, currentVal) => {
    const newVal = !currentVal;
    // Optimistic UI update
    setMembers((prev) =>
      prev.map((m) => (m.userId === memberId ? { ...m, [mealType]: newVal } : m))
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
            [mealType]: newVal,
          }),
        }
      );
      const resData = await res.json();
      if (!resData.success) {
        toast.error(resData.message || "Failed to update meal");
        fetchData(false);
      }
    } catch (err) {
      toast.error("Error updating meal");
      fetchData(false);
    }
  };

  // Change Guest Rice count (+ / -) without touching original Meal Management Guest Meals!
  const handleGuestMealChange = async (memberId, delta) => {
    const member = members.find((m) => m.userId === memberId);
    if (!member) return;

    const currentExtra = member.guestRiceExtra || 0;
    const baseGuest = (member.guestBreakfast || 0) + (member.guestLunch || 0) + (member.guestDinner || 0);

    // Prevent total guest rice from going below 0
    if (baseGuest + currentExtra + delta < 0) return;

    const newExtra = currentExtra + delta;

    // Optimistic UI update
    setMembers((prev) =>
      prev.map((m) =>
        m.userId === memberId ? { ...m, guestRiceExtra: newExtra } : m
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
            userId: memberId,
            date,
            guestRiceExtra: newExtra,
          }),
        }
      );
      const resData = await res.json();
      if (!resData.success) {
        toast.error(resData.message || "Failed to update guest rice");
        fetchData(false);
      }
    } catch (err) {
      toast.error("Error updating guest rice");
      fetchData(false);
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
      if (curr.breakfast) acc.breakfast += 1;
      if (curr.lunch) acc.lunch += 1;
      if (curr.dinner) acc.dinner += 1;
      acc.guestMeal += (curr.guestBreakfast || 0) + (curr.guestLunch || 0) + (curr.guestDinner || 0);
      return acc;
    },
    { breakfast: 0, lunch: 0, dinner: 0, guestMeal: 0 }
  );

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded w-1/3"></div>
        <div className="h-48 bg-gray-200 dark:bg-slate-800 rounded-3xl"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Boxes className="text-amber-500" size={26} />
            <span>{lang === "bn" ? "রাইস ম্যানেজমেন্ট" : "Rice Management"}</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {lang === "bn"
              ? "দৈনিক চাল জমা, খরচ, মিল কমানো/বাড়ানো এবং গেস্ট চালের হিসাব"
              : "Daily Rice Management (Deduct/Add Rice, Toggle Meals & Guest Rice)"}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/manager-dashboard/rice-overview"
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 hover:from-amber-600 hover:to-orange-600 shadow-md transition cursor-pointer"
          >
            <BarChart3 size={16} />
            <span>{lang === "bn" ? "রাইস ওভারভিউ" : "Rice Overview"}</span>
          </Link>

          <button
            onClick={() => {
              if (members.length > 0) setDepositMemberId(members[0].userId);
              setIsDepositModalOpen(true);
            }}
            className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 hover:bg-emerald-700 shadow-md transition cursor-pointer"
          >
            <Plus size={16} />
            <span>{lang === "bn" ? "চাল জমা/বিয়োগ (+/-)" : "Add/Deduct Rice"}</span>
          </button>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500/20 outline-none transition"
            />
          </div>

          <button
            onClick={() => fetchData(true)}
            className="p-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/50 p-4 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/10 dark:bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Sun size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
              Breakfast Rice
            </p>
            <p className="text-2xl font-extrabold text-amber-950 dark:text-amber-100">
              {summary.breakfast}
            </p>
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-900/50 p-4 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-500/10 dark:bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-400">
            <Sunset size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wider">
              Lunch Rice
            </p>
            <p className="text-2xl font-extrabold text-orange-950 dark:text-orange-100">
              {summary.lunch}
            </p>
          </div>
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/50 p-4 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Moon size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
              Dinner Rice
            </p>
            <p className="text-2xl font-extrabold text-indigo-950 dark:text-indigo-100">
              {summary.dinner}
            </p>
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/50 p-4 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-500/10 dark:bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
              Guest Rice
            </p>
            <p className="text-2xl font-extrabold text-purple-950 dark:text-purple-100">
              {summary.guestMeal}
            </p>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={lang === "bn" ? "মেম্বার খুঁজুন..." : "Search member..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Mobile View - Cards (No Horizontal Scrolling) */}
        <div className="md:hidden divide-y divide-gray-100 dark:divide-slate-800">
          {filteredMembers.map((m) => {
            const totalGuest = Math.max(0, (m.guestBreakfast || 0) + (m.guestLunch || 0) + (m.guestDinner || 0) + (m.guestRiceExtra || 0));

            return (
              <div key={m.userId} className="p-4 space-y-3 hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {m.image ? (
                      <Image
                        src={m.image}
                        alt={m.name}
                        width={36}
                        height={36}
                        className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-slate-700"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-xs">
                        {m.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{m.name}</p>
                      <span className="text-[10px] uppercase font-bold text-gray-400">{m.role}</span>
                    </div>
                  </div>

                  {/* Guest Rice (+ / -) */}
                  <div className="inline-flex items-center gap-1 bg-purple-50 dark:bg-purple-950/40 p-1.5 rounded-xl border border-purple-200/50">
                    <button
                      onClick={() => handleGuestMealChange(m.userId, -1)}
                      className="p-1 rounded-lg bg-white dark:bg-slate-800 text-purple-600 hover:bg-purple-100 transition cursor-pointer"
                      title="Decrease Guest Rice"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="px-2 text-xs font-extrabold text-purple-950 dark:text-purple-200">
                      Guest: {totalGuest}
                    </span>
                    <button
                      onClick={() => handleGuestMealChange(m.userId, 1)}
                      className="p-1 rounded-lg bg-white dark:bg-slate-800 text-purple-600 hover:bg-purple-100 transition cursor-pointer"
                      title="Increase Guest Rice"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>

                {/* Meal Toggles */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    onClick={() => handleToggleMeal(m.userId, "breakfast", m.breakfast)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                      m.breakfast
                        ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20"
                        : "bg-gray-100 dark:bg-slate-800 text-gray-400"
                    }`}
                  >
                    {m.breakfast ? <Check size={14} /> : <X size={14} />}
                    <span>BF: {m.breakfast ? "ON" : "OFF"}</span>
                  </button>

                  <button
                    onClick={() => handleToggleMeal(m.userId, "lunch", m.lunch)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                      m.lunch
                        ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20"
                        : "bg-gray-100 dark:bg-slate-800 text-gray-400"
                    }`}
                  >
                    {m.lunch ? <Check size={14} /> : <X size={14} />}
                    <span>LN: {m.lunch ? "ON" : "OFF"}</span>
                  </button>

                  <button
                    onClick={() => handleToggleMeal(m.userId, "dinner", m.dinner)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                      m.dinner
                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                        : "bg-gray-100 dark:bg-slate-800 text-gray-400"
                    }`}
                  >
                    {m.dinner ? <Check size={14} /> : <X size={14} />}
                    <span>DN: {m.dinner ? "ON" : "OFF"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop View - Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/60 dark:bg-slate-800/40 border-b border-gray-100 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-gray-400">
                <th className="py-4 px-6">Member</th>
                <th className="py-4 px-4 text-center">Breakfast</th>
                <th className="py-4 px-4 text-center">Lunch</th>
                <th className="py-4 px-4 text-center">Dinner</th>
                <th className="py-4 px-4 text-center">Guest Rice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-sm">
              {filteredMembers.map((m) => {
                const totalGuest = Math.max(0, (m.guestBreakfast || 0) + (m.guestLunch || 0) + (m.guestDinner || 0) + (m.guestRiceExtra || 0));

                return (
                  <tr key={m.userId} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {m.image ? (
                          <Image
                            src={m.image}
                            alt={m.name}
                            width={36}
                            height={36}
                            className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-slate-700"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-xs">
                            {m.name?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">{m.name}</p>
                          <span className="text-[10px] uppercase font-bold text-gray-400">{m.role}</span>
                        </div>
                      </div>
                    </td>

                    {/* Breakfast Toggle */}
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleToggleMeal(m.userId, "breakfast", m.breakfast)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer ${
                          m.breakfast
                            ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20"
                            : "bg-gray-100 dark:bg-slate-800 text-gray-400"
                        }`}
                      >
                        {m.breakfast ? <Check size={14} /> : <X size={14} />}
                        <span>{m.breakfast ? "ON" : "OFF"}</span>
                      </button>
                    </td>

                    {/* Lunch Toggle */}
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleToggleMeal(m.userId, "lunch", m.lunch)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer ${
                          m.lunch
                            ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20"
                            : "bg-gray-100 dark:bg-slate-800 text-gray-400"
                        }`}
                      >
                        {m.lunch ? <Check size={14} /> : <X size={14} />}
                        <span>{m.lunch ? "ON" : "OFF"}</span>
                      </button>
                    </td>

                    {/* Dinner Toggle */}
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleToggleMeal(m.userId, "dinner", m.dinner)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer ${
                          m.dinner
                            ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                            : "bg-gray-100 dark:bg-slate-800 text-gray-400"
                        }`}
                      >
                        {m.dinner ? <Check size={14} /> : <X size={14} />}
                        <span>{m.dinner ? "ON" : "OFF"}</span>
                      </button>
                    </td>

                    {/* Guest Rice / Guest Meals (+ / -) */}
                    <td className="py-4 px-4 text-center relative">
                      <div className="inline-flex items-center gap-1 bg-purple-50 dark:bg-purple-950/40 p-1.5 rounded-xl border border-purple-200/50">
                        <button
                          onClick={() => handleGuestMealChange(m.userId, -1)}
                          className="p-1 rounded-lg bg-white dark:bg-slate-800 text-purple-600 hover:bg-purple-100 transition cursor-pointer"
                          title="Decrease Guest Rice"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-2 text-xs font-extrabold text-purple-950 dark:text-purple-200">
                          {totalGuest}
                        </span>
                        <button
                          onClick={() => handleGuestMealChange(m.userId, 1)}
                          className="p-1 rounded-lg bg-white dark:bg-slate-800 text-purple-600 hover:bg-purple-100 transition cursor-pointer"
                          title="Increase Guest Rice"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Deposit Modal */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">
              {lang === "bn" ? "চাল জমা/বিয়োগ করুন" : "Add / Deduct Rice Deposit"}
            </h3>

            <form onSubmit={handleAddDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                  Select Member
                </label>
                <select
                  value={depositMemberId}
                  onChange={(e) => setDepositMemberId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-sm font-medium outline-none focus:border-amber-500"
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
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-sm font-medium outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-sm font-medium outline-none focus:border-amber-500"
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
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-sm font-medium outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDepositModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDeposit}
                  className="px-5 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 shadow-md transition disabled:opacity-50"
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
