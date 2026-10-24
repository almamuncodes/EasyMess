"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { useTranslation } from "@/lib/useTranslation";
import { getBDNow } from "@/lib/date-utils";
import { toast } from "sonner";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  Minimize2,
  RefreshCw,
  Search,
  Users,
  Utensils,
  Sun,
  Moon,
  Coffee,
  AlertCircle,
  Sparkles,
  Filter,
  Check,
  UserX,
  FileSpreadsheet,
  ArrowRight,
  X,
  Layers,
  LayoutGrid,
  Table as TableIcon
} from "lucide-react";

const monthNamesEn = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const monthNamesBn = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
];
const dayNamesEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const dayNamesBn = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি"];

export default function MealSheetPage() {
  const { t, lang } = useTranslation();
  const isBn = lang === "bn";

  const { data: session, isPending: isAuthPending } = authClient.useSession();
  const userId = session?.user?.id;

  const bdNow = useMemo(() => getBDNow(), []);
  const [selectedMonth, setSelectedMonth] = useState(() => bdNow.month);
  const [selectedYear, setSelectedYear] = useState(() => bdNow.year);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sheetData, setSheetData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'past'
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'cards'
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Selected cell modal for details
  const [cellModal, setCellModal] = useState(null);

  // Fetch meal sheet data
  const fetchSheetData = useCallback(async (isSilent = false) => {
    if (!userId) return;
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setErrorMessage(null);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(
        `${apiBase}/api/meal/sheet?userId=${userId}&month=${selectedMonth}&year=${selectedYear}`,
        { cache: "no-store" }
      );
      const data = await res.json();

      if (data.success) {
        setSheetData(data);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(
            `mess_meal_sheet_${userId}_${selectedMonth}_${selectedYear}`,
            JSON.stringify(data)
          );
        }
      } else {
        setErrorMessage(data.message || "Failed to load meal sheet");
      }
    } catch (err) {
      console.error("Meal Sheet fetch error:", err);
      setErrorMessage(
        isBn
          ? "মিল খাতার ডেটা লোড করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।"
          : "Failed to connect to server. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, selectedMonth, selectedYear, isBn]);

  // Initial load or cached read
  useEffect(() => {
    if (!userId) return;

    if (typeof window !== "undefined") {
      const cacheKey = `mess_meal_sheet_${userId}_${selectedMonth}_${selectedYear}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setSheetData(parsed);
          setLoading(false);
        } catch (e) {}
      }
    }

    fetchSheetData();
  }, [userId, selectedMonth, selectedYear, fetchSheetData]);

  // Month navigation
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleCurrentMonth = () => {
    setSelectedMonth(bdNow.month);
    setSelectedYear(bdNow.year);
  };

  // Filtered members list
  const filteredMembers = useMemo(() => {
    if (!sheetData?.members) return [];
    return sheetData.members.filter((m) => {
      // Search by name
      const matchesSearch = searchQuery.trim() === "" ||
        (m.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.email || "").toLowerCase().includes(searchQuery.toLowerCase());

      // Filter by active/past status
      let matchesStatus = true;
      if (statusFilter === "active") matchesStatus = m.isActive === true;
      if (statusFilter === "past") matchesStatus = m.isActive === false;

      return matchesSearch && matchesStatus;
    });
  }, [sheetData, searchQuery, statusFilter]);

  // Check if current view is current BD month
  const isCurrentMonth = selectedMonth === bdNow.month && selectedYear === bdNow.year;

  // CSV Export handler
  const handleExportCSV = () => {
    if (!sheetData || !sheetData.members) return;

    const daysCount = sheetData.daysInMonth;
    const headers = [
      "Member Name",
      "Status",
      "Meal Type",
      ...Array.from({ length: daysCount }, (_, i) => `Day ${i + 1}`),
      "Total"
    ];

    const rows = [];

    sheetData.members.forEach((m) => {
      const memberName = `"${(m.name || "Member").replace(/"/g, '""')}"`;
      const status = m.isActive ? "Active" : "Left Mess";

      // Breakfast row
      const bRow = [
        memberName,
        status,
        "Breakfast",
        ...m.days.map((d) => d.breakfast),
        m.totals.breakfast
      ];
      // Lunch row
      const lRow = [
        memberName,
        status,
        "Lunch",
        ...m.days.map((d) => d.lunch),
        m.totals.lunch
      ];
      // Dinner row
      const dRow = [
        memberName,
        status,
        "Dinner",
        ...m.days.map((d) => d.dinner),
        m.totals.dinner
      ];

      rows.push(bRow.join(","));
      rows.push(lRow.join(","));
      rows.push(dRow.join(","));
    });

    // Daily totals
    if (sheetData.dailyTotals) {
      const bTotals = [
        `"DAILY MESS TOTAL"`,
        `""`,
        "Breakfast",
        ...sheetData.dailyTotals.map((dt) => dt.breakfast),
        sheetData.grandTotal?.breakfast || 0
      ];
      const lTotals = [
        `"DAILY MESS TOTAL"`,
        `""`,
        "Lunch",
        ...sheetData.dailyTotals.map((dt) => dt.lunch),
        sheetData.grandTotal?.lunch || 0
      ];
      const dTotals = [
        `"DAILY MESS TOTAL"`,
        `""`,
        "Dinner",
        ...sheetData.dailyTotals.map((dt) => dt.dinner),
        sheetData.grandTotal?.dinner || 0
      ];
      const allDailyTotals = [
        `"DAILY GRAND TOTAL"`,
        `""`,
        "All Meals",
        ...sheetData.dailyTotals.map((dt) => dt.totalRaw),
        sheetData.grandTotal?.raw || 0
      ];

      rows.push(bTotals.join(","));
      rows.push(lTotals.join(","));
      rows.push(dTotals.join(","));
      rows.push(allDailyTotals.join(","));
    }

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EasyMess_Meal_Sheet_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(isBn ? "সিএসভি ফাইল ডাউনলোড হয়েছে" : "CSV exported successfully");
  };

  // If user is not logged in
  if (!isAuthPending && !userId) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl">
          <div className="w-16 h-16 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
            {isBn ? "লগইন প্রয়োজন" : "Authentication Required"}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
            {isBn
              ? "মেসের মিল খাতা দেখতে দয়া করে প্রথমে আপনার অ্যাকাউন্টে লগইন করুন।"
              : "Please sign in to view your mess meal sheet."}
          </p>
          <Link
            href="/signin"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-xl shadow-lg shadow-orange-500/25 hover:opacity-95 transition-all"
          >
            {isBn ? "লগইন করুন" : "Sign In"}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // If user has no mess
  if (!loading && errorMessage && errorMessage.includes("not associated with any mess")) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
            {isBn ? "কোনো মেসে যুক্ত নেই" : "No Mess Found"}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
            {isBn
              ? "আপনি বর্তমানে কোনো মেসে যুক্ত নেই। মিল খাতা দেখতে একটি মেসে জয়েন করুন অথবা নতুন মেস তৈরি করুন।"
              : "You are not a member of any mess. Join a mess or create one to view the meal sheet."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/join-mess"
              className="px-5 py-2.5 bg-orange-500 text-white font-medium rounded-xl shadow-md hover:bg-orange-600 transition-colors"
            >
              {isBn ? "মেসে যুক্ত হোন" : "Join a Mess"}
            </Link>
            <Link
              href="/create-mess"
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {isBn ? "নতুন মেস তৈরি করুন" : "Create Mess"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`transition-all duration-300 ${
        isFullscreen
          ? "fixed inset-0 z-50 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-3 sm:p-6"
          : "max-w-[1600px] mx-auto px-3 sm:px-6 py-6 pb-24"
      }`}
    >
      {/* Print-Only Header */}
      <div className="hidden print:block mb-6 text-center">
        <h1 className="text-2xl font-bold text-black">
          {sheetData?.mess?.name || "EasyMess"} - {isBn ? "মাসিক মিল খাতা" : "Monthly Meal Sheet"}
        </h1>
        <p className="text-sm text-gray-700 mt-1">
          {isBn ? monthNamesBn[selectedMonth - 1] : monthNamesEn[selectedMonth - 1]} {selectedYear} |{" "}
          {isBn ? "সর্বমোট মিল:" : "Total Meals:"} {sheetData?.grandTotal?.raw || 0}
        </p>
      </div>

      {/* Main Top Header Controls (Hidden during print) */}
      <div className="print:hidden flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2.5 bg-gradient-to-tr from-orange-500 to-amber-500 text-white rounded-2xl shadow-md shadow-orange-500/20">
              <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {isBn ? "মেস মিল খাতা" : "Mess Meal Sheet"}
                </h1>
                {sheetData?.mess?.name && (
                  <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20">
                    {sheetData.mess.name}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {isBn
                  ? "মেসের সকল মেম্বারের দৈনিক ও মাসিক মিলের সম্পূর্ণ স্বচ্ছ ডিজিটাল খাতা"
                  : "Transparent, real-time register of all member meals across the month"}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Month Navigator */}
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1 shadow-sm">
            <button
              onClick={handlePrevMonth}
              title={isBn ? "পূর্ববর্তী মাস" : "Previous Month"}
              className="p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="px-2.5 sm:px-3 text-center min-w-[120px]">
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white block whitespace-nowrap">
                {isBn ? monthNamesBn[selectedMonth - 1] : monthNamesEn[selectedMonth - 1]} {selectedYear}
              </span>
            </div>

            <button
              onClick={handleNextMonth}
              title={isBn ? "পরবর্তী মাস" : "Next Month"}
              className="p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {!isCurrentMonth && (
            <button
              onClick={handleCurrentMonth}
              className="px-3 py-2 text-xs font-semibold bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20 rounded-xl hover:bg-orange-100 transition-colors"
            >
              {isBn ? "চলতি মাস" : "This Month"}
            </button>
          )}

          {/* Refresh Button */}
          <button
            onClick={() => fetchSheetData(true)}
            disabled={refreshing}
            title={isBn ? "রিফ্রেশ করুন" : "Refresh Data"}
            className="p-2 sm:p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-orange-500" : ""}`} />
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            title={isBn ? "সিএসভি ফাইল ডাউনলোড করুন" : "Export CSV"}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline">{isBn ? "এক্সপোর্ট" : "Export"}</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? (isBn ? "স্বাভাবিক পর্দা" : "Exit Fullscreen") : (isBn ? "বড় পর্দা" : "Fullscreen")}
            className="p-2 sm:p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Filter and View-Mode Toggle Bar (Hidden in Print) */}
      <div className="print:hidden flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isBn ? "মেম্বারের নাম দিয়ে খুঁজুন..." : "Search member by name..."}
            className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Member Status Filter & View Toggle */}
        <div className="flex items-center gap-2">
          {/* Status Pills */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === "all"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {isBn ? "সবাই" : "All"} ({sheetData?.members?.length || 0})
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === "active"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {isBn ? "বর্তমান" : "Active"} (
              {sheetData?.members?.filter((m) => m.isActive).length || 0})
            </button>
            <button
              onClick={() => setStatusFilter("past")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === "past"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {isBn ? "প্রাক্তন (Left)" : "Ex-Members"} (
              {sheetData?.members?.filter((m) => !m.isActive).length || 0})
            </button>
          </div>

          {/* View mode toggle (Table vs Cards) */}
          <div className="sm:hidden flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
            <button
              onClick={() => setViewMode("table")}
              title={isBn ? "টেবিল ভিউ" : "Table View"}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "table"
                  ? "bg-white dark:bg-slate-800 text-orange-500 shadow-xs"
                  : "text-slate-400"
              }`}
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              title={isBn ? "কার্ড ভিউ" : "Cards View"}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "cards"
                  ? "bg-white dark:bg-slate-800 text-orange-500 shadow-xs"
                  : "text-slate-400"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && !sheetData && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-hidden animate-pulse">
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-xl"></div>
            ))}
          </div>
        </div>
      )}

      {/* Main Meal Khata Table View */}
      {(!loading || sheetData) && viewMode === "table" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto relative max-h-[75vh]">
            <table className="w-full text-xs text-center border-collapse">
              {/* Header */}
              <thead className="sticky top-0 z-30 bg-slate-100 dark:bg-slate-800/95 backdrop-blur text-slate-700 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-700 shadow-xs">
                <tr>
                  {/* Sticky Member Column */}
                  <th
                    className="sticky left-0 z-40 bg-slate-100 dark:bg-slate-800/95 px-1.5 py-2.5 text-left border-r border-slate-200 dark:border-slate-700 w-[88px] min-w-[88px] max-w-[88px] sm:w-[115px] sm:min-w-[115px] sm:max-w-[115px] text-[11px] sm:text-xs"
                  >
                    {isBn ? "মেম্বার" : "Member"}
                  </th>

                  {/* Sticky Meal Type Column */}
                  <th
                    className="sticky left-[88px] sm:left-[115px] z-40 bg-slate-100 dark:bg-slate-800/95 px-1 py-2.5 text-center border-r border-slate-200 dark:border-slate-700 w-[34px] min-w-[34px] max-w-[34px] sm:w-[44px] sm:min-w-[44px] sm:max-w-[44px] text-[10px] sm:text-xs"
                  >
                    {isBn ? "মিল" : "Type"}
                  </th>

                  {/* Date Columns (1..daysInMonth) */}
                  {Array.from({ length: sheetData?.daysInMonth || 31 }, (_, idx) => {
                    const dayNum = idx + 1;
                    const isToday = isCurrentMonth && dayNum === bdNow.day;
                    const isFuture = isCurrentMonth && dayNum > bdNow.day;
                    const dateObj = new Date(Date.UTC(selectedYear, selectedMonth - 1, dayNum));
                    const dayOfWeek = dateObj.getUTCDay();

                    return (
                      <th
                        key={dayNum}
                        className={`py-1.5 px-0.5 border-r border-slate-200/80 dark:border-slate-700/80 font-mono transition-colors w-7 sm:w-8 min-w-[28px] sm:min-w-[32px] text-center ${
                          isToday
                            ? "bg-orange-500/15 text-orange-600 dark:text-orange-400 font-bold border-orange-500/30"
                            : isFuture
                            ? "opacity-40 bg-slate-50/50 dark:bg-slate-900/50 text-slate-400"
                            : ""
                        }`}
                      >
                        <div className="text-[10px] sm:text-[11px] leading-tight">{dayNum}</div>
                        <div
                          className={`text-[8px] sm:text-[9px] font-normal ${
                            dayOfWeek === 5 ? "text-rose-500 font-semibold" : "text-slate-400 dark:text-slate-400"
                          }`}
                        >
                          {isBn ? dayNamesBn[dayOfWeek] : dayNamesEn[dayOfWeek]}
                        </div>
                      </th>
                    );
                  })}

                  {/* Total Column (Sticky on desktop only so mobile dates are never covered) */}
                  <th
                    className="md:sticky md:right-0 z-30 bg-slate-100 dark:bg-slate-800/95 px-1.5 py-2.5 text-center border-l-2 border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white w-12 sm:w-16 min-w-[46px] sm:min-w-[60px] text-[11px] sm:text-xs"
                  >
                    {isBn ? "মোট" : "Total"}
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={(sheetData?.daysInMonth || 31) + 3}
                      className="py-12 text-center text-slate-400 dark:text-slate-400"
                    >
                      <UserX className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      {isBn ? "কোনো মেম্বারের তথ্য পাওয়া যায়নি" : "No members found"}
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member, memberIdx) => {
                    const isMe = String(member.userId) === String(userId);
                    const isEven = memberIdx % 2 === 0;
                    const bgClass = isMe
                      ? "bg-orange-50/80 dark:bg-orange-950/25"
                      : isEven
                      ? "bg-white dark:bg-slate-900"
                      : "bg-slate-50/60 dark:bg-slate-800/30";

                    return (
                      <React.Fragment key={member.userId}>
                        {/* Row 1: Breakfast + Spanned Clean Member Name */}
                        <tr className={`${bgClass} hover:bg-orange-500/10 transition-colors group`}>
                          {/* Clean Member Info Cell - Fixed Width, Scaled Text, Highlight for logged-in user */}
                          <td
                            rowSpan={3}
                            className={`sticky left-0 z-20 ${bgClass} px-1.5 py-1.5 text-left border-r border-slate-200 dark:border-slate-700 align-middle w-[88px] min-w-[88px] max-w-[88px] sm:w-[115px] sm:min-w-[115px] sm:max-w-[115px] shadow-xs ${
                              isMe ? "border-l-4 border-l-orange-500" : ""
                            }`}
                          >
                            <div className="flex flex-col justify-center overflow-hidden">
                              <div className="flex items-center gap-1 flex-wrap">
                                <p
                                  className={`font-bold break-words leading-tight ${
                                    isMe
                                      ? "text-orange-600 dark:text-orange-400 font-extrabold"
                                      : "text-slate-800 dark:text-white"
                                  } ${
                                    (member.name || "").length > 15
                                      ? "text-[9px]"
                                      : (member.name || "").length > 9
                                      ? "text-[10px]"
                                      : "text-[11px] sm:text-xs"
                                  }`}
                                  title={member.name}
                                >
                                  {member.name}
                                </p>
                                {isMe && (
                                  <span className="text-[7.5px] font-extrabold px-1 py-0.2 rounded bg-orange-500 text-white leading-none shrink-0">
                                    {isBn ? "আপনি" : "You"}
                                  </span>
                                )}
                              </div>
                              {!member.isActive && (
                                <span className="text-[7.5px] text-rose-500 font-semibold leading-none mt-0.5">
                                  {isBn ? "(ত্যাগ)" : "(Left)"}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Breakfast Label - Compact */}
                          <td
                            className={`sticky left-[88px] sm:left-[115px] z-20 ${bgClass} px-0.5 py-1 text-center border-r border-slate-200 dark:border-slate-700 w-[34px] min-w-[34px] max-w-[34px] sm:w-[44px] sm:min-w-[44px] sm:max-w-[44px] shadow-xs`}
                          >
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                              {isBn ? "সকাল" : "B"}
                            </span>
                          </td>

                          {/* Breakfast Daily Cells */}
                          {member.days.map((dayData) => {
                            const isToday = isCurrentMonth && dayData.day === bdNow.day;
                            const hasMeal = dayData.breakfast > 0;
                            const hasGuest = dayData.guestBreakfast > 0;

                            return (
                              <td
                                key={`b-${dayData.day}`}
                                onClick={() =>
                                  setCellModal({
                                    member,
                                    dayData,
                                    dayNum: dayData.day,
                                    mealSlot: "breakfast"
                                  })
                                }
                                className={`px-0.5 py-1 border-r border-slate-200/60 dark:border-slate-800/60 font-mono cursor-pointer transition-colors ${
                                  dayData.isFuture
                                    ? "opacity-35 bg-slate-50/40 dark:bg-slate-900/40 cursor-default"
                                    : "hover:bg-amber-500/20"
                                } ${isToday ? "bg-orange-500/10 font-bold" : ""}`}
                              >
                                {hasMeal ? (
                                  <span
                                    className={`inline-flex items-center justify-center min-w-[18px] px-1 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold ${
                                      hasGuest
                                        ? "bg-amber-100 dark:bg-amber-500/30 text-amber-800 dark:text-amber-300"
                                        : "text-slate-800 dark:text-slate-200"
                                    }`}
                                  >
                                    {dayData.breakfast}
                                    {hasGuest && <span className="text-[7px] text-amber-600 ml-0.5">*</span>}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-700 text-[10px]">-</span>
                                )}
                              </td>
                            );
                          })}

                          {/* Member Total - Spans all 3 rows (B, L, D) so all rows have 100% equal height */}
                          <td
                            rowSpan={3}
                            className={`md:sticky md:right-0 z-10 ${bgClass} px-1.5 py-1 border-l-2 border-slate-300 dark:border-slate-700 font-mono text-center align-middle w-12 sm:w-16 min-w-[46px] sm:min-w-[60px] shadow-xs`}
                          >
                            <div className="flex flex-col items-center justify-center gap-1">
                              <div className="bg-orange-500/15 text-orange-600 dark:text-orange-400 font-black text-xs sm:text-sm px-1.5 py-0.5 rounded-md leading-tight">
                                {member.totals.totalRaw}
                              </div>
                              <div className="text-[8.5px] font-semibold text-slate-500 dark:text-slate-400 leading-none flex items-center justify-center gap-0.5 whitespace-nowrap">
                                <span className="text-amber-600 dark:text-amber-400" title={isBn ? "সকাল" : "Breakfast"}>
                                  {member.totals.breakfast}
                                </span>
                                <span className="text-slate-300 dark:text-slate-600">/</span>
                                <span className="text-sky-600 dark:text-sky-400" title={isBn ? "দুপুর" : "Lunch"}>
                                  {member.totals.lunch}
                                </span>
                                <span className="text-slate-300 dark:text-slate-600">/</span>
                                <span className="text-indigo-600 dark:text-indigo-400" title={isBn ? "রাত" : "Dinner"}>
                                  {member.totals.dinner}
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>

                        {/* Row 2: Lunch */}
                        <tr className={`${bgClass} hover:bg-orange-500/5 transition-colors group`}>
                          {/* Lunch Label - Compact */}
                          <td
                            className={`sticky left-[88px] sm:left-[115px] z-20 ${bgClass} px-0.5 py-1 text-center border-r border-slate-200 dark:border-slate-700 w-[34px] min-w-[34px] max-w-[34px] sm:w-[44px] sm:min-w-[44px] sm:max-w-[44px] shadow-xs`}
                          >
                            <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">
                              {isBn ? "দুপুর" : "L"}
                            </span>
                          </td>

                          {/* Lunch Daily Cells */}
                          {member.days.map((dayData) => {
                            const isToday = isCurrentMonth && dayData.day === bdNow.day;
                            const hasMeal = dayData.lunch > 0;
                            const hasGuest = dayData.guestLunch > 0;

                            return (
                              <td
                                key={`l-${dayData.day}`}
                                onClick={() =>
                                  setCellModal({
                                    member,
                                    dayData,
                                    dayNum: dayData.day,
                                    mealSlot: "lunch"
                                  })
                                }
                                className={`px-0.5 py-1 border-r border-slate-200/60 dark:border-slate-800/60 font-mono cursor-pointer transition-colors ${
                                  dayData.isFuture
                                    ? "opacity-35 bg-slate-50/40 dark:bg-slate-900/40 cursor-default"
                                    : "hover:bg-sky-500/20"
                                } ${isToday ? "bg-orange-500/10 font-bold" : ""}`}
                              >
                                {hasMeal ? (
                                  <span
                                    className={`inline-flex items-center justify-center min-w-[18px] px-1 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold ${
                                      hasGuest
                                        ? "bg-sky-100 dark:bg-sky-500/30 text-sky-800 dark:text-sky-300"
                                        : "text-slate-800 dark:text-slate-200"
                                    }`}
                                  >
                                    {dayData.lunch}
                                    {hasGuest && <span className="text-[7px] text-sky-600 ml-0.5">*</span>}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-700 text-[10px]">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>

                        {/* Row 3: Dinner */}
                        <tr className={`${bgClass} hover:bg-orange-500/5 transition-colors border-b-2 border-slate-300/80 dark:border-slate-700/80 group`}>
                          {/* Dinner Label - Compact */}
                          <td
                            className={`sticky left-[88px] sm:left-[115px] z-20 ${bgClass} px-0.5 py-1 text-center border-r border-slate-200 dark:border-slate-700 w-[34px] min-w-[34px] max-w-[34px] sm:w-[44px] sm:min-w-[44px] sm:max-w-[44px] shadow-xs`}
                          >
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                              {isBn ? "রাত" : "D"}
                            </span>
                          </td>

                          {/* Dinner Daily Cells */}
                          {member.days.map((dayData) => {
                            const isToday = isCurrentMonth && dayData.day === bdNow.day;
                            const hasMeal = dayData.dinner > 0;
                            const hasGuest = dayData.guestDinner > 0;

                            return (
                              <td
                                key={`d-${dayData.day}`}
                                onClick={() =>
                                  setCellModal({
                                    member,
                                    dayData,
                                    dayNum: dayData.day,
                                    mealSlot: "dinner"
                                  })
                                }
                                className={`px-0.5 py-1 border-r border-slate-200/60 dark:border-slate-800/60 font-mono cursor-pointer transition-colors ${
                                  dayData.isFuture
                                    ? "opacity-35 bg-slate-50/40 dark:bg-slate-900/40 cursor-default"
                                    : "hover:bg-indigo-500/20"
                                } ${isToday ? "bg-orange-500/10 font-bold" : ""}`}
                              >
                                {hasMeal ? (
                                  <span
                                    className={`inline-flex items-center justify-center min-w-[18px] px-1 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold ${
                                      hasGuest
                                        ? "bg-indigo-100 dark:bg-indigo-500/30 text-indigo-800 dark:text-indigo-300"
                                        : "text-slate-800 dark:text-slate-200"
                                    }`}
                                  >
                                    {dayData.dinner}
                                    {hasGuest && <span className="text-[7px] text-indigo-600 ml-0.5">*</span>}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-700 text-[10px]">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>

              {/* Bottom Daily Totals Footer */}
              {sheetData?.dailyTotals && (
                <tfoot className="sticky bottom-0 z-30 bg-slate-100 dark:bg-slate-800/95 backdrop-blur font-semibold border-t-2 border-slate-300 dark:border-slate-600 shadow-lg text-slate-800 dark:text-slate-100">
                  {/* Breakfast Daily Total */}
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <td
                      colSpan={2}
                      className="sticky left-0 z-30 bg-slate-100 dark:bg-slate-800 px-2 py-1.5 text-left text-amber-600 dark:text-amber-400 font-bold text-[10px] sm:text-xs border-r border-slate-200 dark:border-slate-700"
                    >
                      {isBn ? "সকাল" : "B'fast"}
                    </td>
                    {sheetData.dailyTotals.map((dt) => (
                      <td
                        key={`tot-b-${dt.day}`}
                        className="px-0.5 py-1 border-r border-slate-200 dark:border-slate-700 font-mono text-amber-700 dark:text-amber-400 text-[10px] sm:text-xs"
                      >
                        {dt.breakfast > 0 ? dt.breakfast : "-"}
                      </td>
                    ))}
                    <td className="md:sticky md:right-0 z-20 bg-slate-100 dark:bg-slate-800 px-1 py-1 border-l-2 border-slate-300 dark:border-slate-700 font-mono text-amber-700 dark:text-amber-400 font-bold text-center text-xs">
                      {sheetData.grandTotal?.breakfast || 0}
                    </td>
                  </tr>

                  {/* Lunch Daily Total */}
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <td
                      colSpan={2}
                      className="sticky left-0 z-30 bg-slate-100 dark:bg-slate-800 px-2 py-1.5 text-left text-sky-600 dark:text-sky-400 font-bold text-[10px] sm:text-xs border-r border-slate-200 dark:border-slate-700"
                    >
                      {isBn ? "দুপুর" : "Lunch"}
                    </td>
                    {sheetData.dailyTotals.map((dt) => (
                      <td
                        key={`tot-l-${dt.day}`}
                        className="px-0.5 py-1 border-r border-slate-200 dark:border-slate-700 font-mono text-sky-700 dark:text-sky-400 text-[10px] sm:text-xs"
                      >
                        {dt.lunch > 0 ? dt.lunch : "-"}
                      </td>
                    ))}
                    <td className="md:sticky md:right-0 z-20 bg-slate-100 dark:bg-slate-800 px-1 py-1 border-l-2 border-slate-300 dark:border-slate-700 font-mono text-sky-700 dark:text-sky-400 font-bold text-center text-xs">
                      {sheetData.grandTotal?.lunch || 0}
                    </td>
                  </tr>

                  {/* Dinner Daily Total */}
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <td
                      colSpan={2}
                      className="sticky left-0 z-30 bg-slate-100 dark:bg-slate-800 px-2 py-1.5 text-left text-indigo-600 dark:text-indigo-400 font-bold text-[10px] sm:text-xs border-r border-slate-200 dark:border-slate-700"
                    >
                      {isBn ? "রাত" : "Dinner"}
                    </td>
                    {sheetData.dailyTotals.map((dt) => (
                      <td
                        key={`tot-d-${dt.day}`}
                        className="px-0.5 py-1 border-r border-slate-200 dark:border-slate-700 font-mono text-indigo-700 dark:text-indigo-400 text-[10px] sm:text-xs"
                      >
                        {dt.dinner > 0 ? dt.dinner : "-"}
                      </td>
                    ))}
                    <td className="md:sticky md:right-0 z-20 bg-slate-100 dark:bg-slate-800 px-1 py-1 border-l-2 border-slate-300 dark:border-slate-700 font-mono text-indigo-700 dark:text-indigo-400 font-bold text-center text-xs">
                      {sheetData.grandTotal?.dinner || 0}
                    </td>
                  </tr>

                  {/* Grand Daily Mess Total */}
                  <tr className="bg-orange-500/10 text-orange-950 dark:text-orange-200 font-bold">
                    <td
                      colSpan={2}
                      className="sticky left-0 z-30 bg-orange-500/15 dark:bg-slate-900 px-2 py-1.5 text-left text-orange-700 dark:text-orange-400 font-extrabold text-[10px] sm:text-xs border-r border-orange-500/20"
                    >
                      {isBn ? "সর্বমোট" : "Total"}
                    </td>
                    {sheetData.dailyTotals.map((dt) => (
                      <td
                        key={`tot-raw-${dt.day}`}
                        className="px-0.5 py-1.5 border-r border-orange-500/20 font-mono text-orange-700 dark:text-orange-400 font-bold text-[10px] sm:text-xs"
                      >
                        {dt.totalRaw > 0 ? dt.totalRaw : "-"}
                      </td>
                    ))}
                    <td className="md:sticky md:right-0 z-20 bg-orange-500/20 dark:bg-slate-900 px-1 py-1 border-l-2 border-orange-500/40 font-mono text-orange-600 dark:text-orange-400 font-black text-center text-xs sm:text-sm">
                      {sheetData.grandTotal?.raw || 0}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Cards View (Especially handy on small mobile screens) */}
      {(!loading || sheetData) && viewMode === "cards" && (
        <div className="space-y-4 sm:hidden">
          {filteredMembers.map((member) => (
            <div
              key={member.userId}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <div className="flex items-center gap-2.5">
                  {member.image ? (
                    <Image
                      src={member.image}
                      alt={member.name}
                      width={36}
                      height={36}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-400 to-amber-500 text-white font-bold text-sm flex items-center justify-center">
                      {(member.name || "M").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {member.name}
                    </h3>
                    {!member.isActive ? (
                      <span className="text-[10px] text-rose-500 font-semibold">
                        {isBn ? "মেস ত্যাগকারী (Ex-Member)" : "Left Mess"}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">
                        {member.role === "manager" ? "Manager" : "Member"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-lg font-bold text-orange-500 block leading-tight">
                    {member.totals.totalRaw}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {isBn ? "মোট মিল" : "Total Meals"}
                  </span>
                </div>
              </div>

              {/* Sub-totals breakdown */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs bg-slate-50 dark:bg-slate-800/40 rounded-xl p-2 mb-3">
                <div>
                  <span className="text-[10px] text-amber-500 block">{isBn ? "সকাল" : "B'fast"}</span>
                  <span className="font-bold">{member.totals.breakfast}</span>
                </div>
                <div>
                  <span className="text-[10px] text-sky-500 block">{isBn ? "দুপুর" : "Lunch"}</span>
                  <span className="font-bold">{member.totals.lunch}</span>
                </div>
                <div>
                  <span className="text-[10px] text-indigo-500 block">{isBn ? "রাত" : "Dinner"}</span>
                  <span className="font-bold">{member.totals.dinner}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-500 block">{isBn ? "গেস্ট" : "Guest"}</span>
                  <span className="font-bold">{member.totals.guest}</span>
                </div>
              </div>

              {/* Days Mini Grid */}
              <div className="text-[11px] font-medium text-slate-500 mb-1.5">
                {isBn ? "দৈনিক মিল (১ - ৩১ তারিখ):" : "Daily Meals (Day 1 - 31):"}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px]">
                {member.days.map((d) => {
                  const isToday = isCurrentMonth && d.day === bdNow.day;
                  return (
                    <div
                      key={d.day}
                      onClick={() =>
                        setCellModal({
                          member,
                          dayData: d,
                          dayNum: d.day,
                          mealSlot: "all"
                        })
                      }
                      className={`p-1 rounded cursor-pointer transition-colors ${
                        isToday
                          ? "ring-1 ring-orange-500 font-bold bg-orange-500/10"
                          : d.totalRaw > 0
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                          : "text-slate-300 dark:text-slate-700"
                      }`}
                    >
                      <div className="text-[8px] text-slate-400">{d.day}</div>
                      <div>{d.totalRaw > 0 ? d.totalRaw : "-"}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Interactive Cell Detail Modal */}
      {cellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative">
            <button
              onClick={() => setCellModal(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-orange-500/10 text-orange-500 rounded-2xl">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {cellModal.member.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {cellModal.dayNum}{" "}
                  {isBn ? monthNamesBn[selectedMonth - 1] : monthNamesEn[selectedMonth - 1]}{" "}
                  {selectedYear}
                </p>
              </div>
            </div>

            {cellModal.dayData.isFuture && (
              <div className="mb-4 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs text-center border border-slate-200 dark:border-slate-700">
                {isBn
                  ? "⚠️ এটি ভবিষ্যতের তারিখ—এই দিনের হিসাব এখনো মোট হিসেবে যুক্ত করা হয়নি।"
                  : "⚠️ This is a future date—not counted into totals yet."}
              </div>
            )}

            <div className="space-y-2.5 mb-6 text-sm">
              {/* Breakfast Breakdown */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 text-amber-900 dark:text-amber-200">
                <span className="flex items-center gap-2 text-xs font-semibold">
                  <Coffee className="w-4 h-4 text-amber-500" />
                  {isBn ? "সকালের নাস্তা" : "Breakfast"}
                </span>
                <span className="font-mono font-bold">
                  {cellModal.dayData.breakfast}{" "}
                  {cellModal.dayData.guestBreakfast > 0 && (
                    <span className="text-xs text-amber-600 font-normal">
                      (গেস্ট: {cellModal.dayData.guestBreakfast})
                    </span>
                  )}
                </span>
              </div>

              {/* Lunch Breakdown */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-sky-500/10 text-sky-900 dark:text-sky-200">
                <span className="flex items-center gap-2 text-xs font-semibold">
                  <Sun className="w-4 h-4 text-sky-500" />
                  {isBn ? "দুপুরের খাবার" : "Lunch"}
                </span>
                <span className="font-mono font-bold">
                  {cellModal.dayData.lunch}{" "}
                  {cellModal.dayData.guestLunch > 0 && (
                    <span className="text-xs text-sky-600 font-normal">
                      (গেস্ট: {cellModal.dayData.guestLunch})
                    </span>
                  )}
                </span>
              </div>

              {/* Dinner Breakdown */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-500/10 text-indigo-900 dark:text-indigo-200">
                <span className="flex items-center gap-2 text-xs font-semibold">
                  <Moon className="w-4 h-4 text-indigo-500" />
                  {isBn ? "রাতের খাবার" : "Dinner"}
                </span>
                <span className="font-mono font-bold">
                  {cellModal.dayData.dinner}{" "}
                  {cellModal.dayData.guestDinner > 0 && (
                    <span className="text-xs text-indigo-600 font-normal">
                      (গেস্ট: {cellModal.dayData.guestDinner})
                    </span>
                  )}
                </span>
              </div>

              {/* Day Total */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold">
                <span>{isBn ? "দিনের সর্বমোট মিল:" : "Day Total Meals:"}</span>
                <span className="text-orange-500 text-base font-mono">
                  {cellModal.dayData.totalRaw}
                </span>
              </div>
            </div>

            <button
              onClick={() => setCellModal(null)}
              className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-colors text-xs"
            >
              {isBn ? "বন্ধ করুন" : "Close"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
