"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { GetUser } from "@/components/action/action";
import { useTranslation } from "@/lib/useTranslation";
import {
  Calendar as CalendarIcon,
  UserCheck,
  Plus,
  Trash2,
  Clock,
  AlertCircle,
  Users,
  Check,
  Search,
  AlertTriangle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import PageLoader from "@/components/ui/PageLoader";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

import { getBDDateStr } from "@/lib/date-utils";

export default function ManagerBazaarSchedulePage() {
  const { t, lang } = useTranslation();
  const isBn = lang === "bn";

  const user = GetUser();
  const managerId = user?.user?.id;

  const [date, setDate] = useState(() => getBDDateStr());
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [note, setNote] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [members, setMembers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Custom Delete Modal State
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    scheduleId: null,
    dateStr: "",
    memberNames: "",
    isDeleting: false,
  });

  const loadData = useCallback(async () => {
    if (!managerId) return;

    try {
      // 1. Fetch mess members
      const memRes = await fetch(`${API_BASE}/api/manager/meals?userId=${managerId}&date=${date}`);
      const memData = await memRes.json();
      if (memData.success) {
        setMembers(memData.members || []);
      }

      // 2. Fetch bazaar duty schedules
      const now = new Date(date);
      const schRes = await fetch(
        `${API_BASE}/api/bazaar-schedules?userId=${managerId}&month=${now.getMonth() + 1}&year=${now.getFullYear()}`
      );
      const schData = await schRes.json();
      if (schData.success) {
        setSchedules(schData.data || []);
      }
    } catch (err) {
      console.error("Error loading bazaar schedule data:", err);
      toast.error(isBn ? "ডাটা লোড করতে ব্যর্থ হয়েছে" : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [managerId, date, isBn]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleMemberSelection = (member) => {
    setSelectedMembers((prev) => {
      const exists = prev.some((m) => m.userId === member.userId);
      if (exists) {
        return prev.filter((m) => m.userId !== member.userId);
      } else {
        return [...prev, { userId: member.userId, name: member.name || member.email }];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedMembers.length === members.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(members.map((m) => ({ userId: m.userId, name: m.name || m.email })));
    }
  };

  const handleAssignDuty = async (e) => {
    e.preventDefault();
    if (selectedMembers.length === 0 || !date) {
      toast.error(isBn ? "কমপক্ষে ১ জন মেম্বার এবং তারিখ নির্বাচন করুন" : "Please select at least 1 member and date");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/bazaar-schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          managerId,
          date,
          assignedMembers: selectedMembers,
          note,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          isBn
            ? `${selectedMembers.length} জন মেম্বারকে বাজারের দায়িত্ব বরাদ্দ করা হয়েছে!`
            : `Bazaar duty assigned to ${selectedMembers.length} member(s)!`
        );
        setSelectedMembers([]);
        setNote("");
        loadData();
      } else {
        toast.error(data.message || (isBn ? "ব্যর্থ হয়েছে" : "Failed to assign"));
      }
    } catch (err) {
      console.error("Error assigning duty:", err);
      toast.error(isBn ? "সার্ভারে কানেক্ট করতে ব্যর্থ হয়েছে" : "Failed to connect to server");
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (sch) => {
    const assignedList = Array.isArray(sch.assignedMembers) && sch.assignedMembers.length > 0
      ? sch.assignedMembers.map((m) => m.name).join(", ")
      : sch.assignedUserName;

    setDeleteModal({
      isOpen: true,
      scheduleId: sch._id,
      dateStr: sch.dateStr,
      memberNames: assignedList,
      isDeleting: false,
    });
  };

  const confirmDeleteSchedule = async () => {
    if (!deleteModal.scheduleId) return;

    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
    try {
      const res = await fetch(`${API_BASE}/api/bazaar-schedules/${deleteModal.scheduleId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isBn ? "বাজারের দায়িত্ব রিমুভ করা হয়েছে" : "Schedule entry deleted");
        setSchedules((prev) => prev.filter((s) => s._id !== deleteModal.scheduleId));
        setDeleteModal({ isOpen: false, scheduleId: null, dateStr: "", memberNames: "", isDeleting: false });
      } else {
        toast.error(data.message || (isBn ? "ডিলিট করতে ব্যর্থ হয়েছে" : "Failed to delete"));
      }
    } catch (err) {
      console.error("Error deleting schedule:", err);
      toast.error(isBn ? "সার্ভার এরর" : "Server error");
    } finally {
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  const filteredSchedules = useMemo(() => {
    if (!searchQuery.trim()) return schedules;
    const q = searchQuery.toLowerCase();
    return schedules.filter((sch) => {
      const names = Array.isArray(sch.assignedMembers)
        ? sch.assignedMembers.map((m) => m.name).join(" ")
        : sch.assignedUserName;
      return names.toLowerCase().includes(q) || sch.dateStr.includes(q) || (sch.note && sch.note.toLowerCase().includes(q));
    });
  }, [schedules, searchQuery]);

  if (loading) return <PageLoader text={isBn ? "বাজারের রুটিন লোড হচ্ছে..." : "Loading bazaar schedule..."} />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-orange-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-3 sm:p-6 lg:p-8 text-gray-900 dark:text-slate-100">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 sm:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <CalendarIcon className="w-3.5 h-3.5" />
              {isBn ? "বাজার রুটিন ও রোস্টার" : "Bazaar Duty Schedule"}
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              {isBn ? "মেস বাজারের ডিউটি বরাদ্দ করুন" : "Assign Mess Bazaar Duty"}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
              {isBn ? "একসঙ্গে একাধিক মেম্বার সিলেক্ট করে বাজারের দায়িত্ব দিন" : "Select one or multiple members together for grocery shopping turns"}
            </p>
          </div>
        </div>

        {/* Multi-Member Assign Duty Form */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-sm sm:text-base font-bold flex items-center gap-2">
            <Plus className="w-4 h-4 text-orange-500" />
            {isBn ? "নতুন বাজারের দায়িত্ব নির্ধারণ (একাধিক মেম্বার সাপোর্ট)" : "Assign New Bazaar Duty (Multi-Member Support)"}
          </h2>

          <form onSubmit={handleAssignDuty} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">
                  {isBn ? "তারিখ:" : "Select Date:"}
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">
                  {isBn ? "নোট/বিবরণ (ঐচ্ছিক):" : "Note (Optional):"}
                </label>
                <input
                  type="text"
                  placeholder={isBn ? "যেমন: বড় বাজার (মাছ, মাংস, চাল)" : "e.g. Big Shopping (Meat & Rice)"}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            {/* Multi-Member Selection Checklist */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-slate-400 truncate">
                  {isBn ? "মেম্বার নির্বাচন করুন (একাধিক সিলেক্ট করুন):" : "Select Members (Multi-Select):"}
                </label>
                <span className="text-orange-500 font-mono font-bold text-[10px] sm:text-xs bg-orange-500/10 px-2 py-0.5 rounded-full shrink-0">
                  {selectedMembers.length} {isBn ? "জন নির্বাচিত" : "selected"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800">
                {members.map((m) => {
                  const isSelected = selectedMembers.some((sm) => sm.userId === m.userId);
                  return (
                    <button
                      key={m.userId}
                      type="button"
                      onClick={() => toggleMemberSelection(m)}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                          : "bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 border-gray-200 dark:border-slate-700 hover:border-orange-500/40"
                      }`}
                    >
                      <span className="text-xs font-bold truncate">
                        {m.name || m.email}
                      </span>
                      {isSelected && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-orange-500/25 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                {submitting
                  ? (isBn ? "সংরক্ষণ হচ্ছে..." : "Saving...")
                  : (isBn ? `${selectedMembers.length > 0 ? selectedMembers.length + " জনের" : ""} দায়িত্ব নির্ধারণ করুন` : "Assign Duty")}
              </button>
            </div>
          </form>
        </div>

        {/* Bazaar Roster List & Quick Search */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
            <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              {isBn ? "চলতি মাসের বাজারের রোস্টার তালিকা" : "Current Month Bazaar Duty Roster"}
            </h3>
            
            {/* Quick Search */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={isBn ? "মেম্বারের নামে ফিল্টার করুন..." : "Filter by member name..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 w-44 sm:w-56"
                />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-mono text-xs font-bold shrink-0">
                {filteredSchedules.length} {isBn ? "টি দিন" : "days"}
              </span>
            </div>
          </div>

          {filteredSchedules.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <AlertCircle className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-xs text-gray-400">
                {isBn ? "কোনো বাজারের দায়িত্ব পাওয়া যায়নি।" : "No bazaar schedules found."}
              </p>
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSchedules.map((sch) => {
                const dateObj = new Date(sch.date);
                const formattedDate = dateObj.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const isToday = sch.dateStr === getBDDateStr();

                const assignedList = Array.isArray(sch.assignedMembers) && sch.assignedMembers.length > 0
                  ? sch.assignedMembers.map((m) => m.name).join(", ")
                  : sch.assignedUserName;

                const count = Array.isArray(sch.assignedMembers) ? sch.assignedMembers.length : 1;

                return (
                  <div
                    key={sch._id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      isToday
                        ? "bg-orange-50/60 dark:bg-orange-950/20 border-orange-500/40 ring-2 ring-orange-500/20 shadow-md"
                        : "bg-gray-50/50 dark:bg-slate-800/40 border-gray-100 dark:border-slate-800 shadow-sm"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400">
                          📅 {formattedDate}
                        </span>
                        {isToday && (
                          <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white text-[9px] font-bold uppercase tracking-wider animate-pulse">
                            {isBn ? "আজ" : "Today"}
                          </span>
                        )}
                      </div>

                      <div className="flex items-start gap-2 mt-1">
                        <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          🛍️
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] font-bold">
                              {count} {isBn ? "জন মেম্বার" : "member(s)"}
                            </span>
                          </div>
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

                    <div className="flex justify-end mt-4 pt-2 border-t border-gray-100 dark:border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => openDeleteModal(sch)}
                        className="text-red-500 hover:text-red-600 p-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 border border-transparent hover:border-red-200 transition cursor-pointer"
                        title={isBn ? "ডিলিট করুন" : "Delete"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 🔴 Custom Glassmorphic Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center font-bold shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, scheduleId: null, dateStr: "", memberNames: "", isDeleting: false })}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {isBn ? "বাজারের দায়িত্ব রিমুভ নিশ্চিতকরণ" : "Confirm Delete Bazaar Duty"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {isBn
                  ? `আপনি কি নিশ্চিত যে (${deleteModal.dateStr}) তারিখের [${deleteModal.memberNames}] বাজারের রুটিন এন্ট্রিটি রিমুভ করতে চান?`
                  : `Are you sure you want to remove the bazaar schedule entry for ${deleteModal.dateStr} assigned to [${deleteModal.memberNames}]?`}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, scheduleId: null, dateStr: "", memberNames: "", isDeleting: false })}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 font-bold text-xs text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {isBn ? "বাতিল" : "Cancel"}
              </button>

              <button
                type="button"
                disabled={deleteModal.isDeleting}
                onClick={confirmDeleteSchedule}
                className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 active:scale-95 text-white font-bold text-xs shadow-md shadow-red-500/25 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deleteModal.isDeleting
                  ? (isBn ? "ডিলিট হচ্ছে..." : "Deleting...")
                  : (isBn ? "হ্যাঁ, রিমুভ করুন" : "Yes, Delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
