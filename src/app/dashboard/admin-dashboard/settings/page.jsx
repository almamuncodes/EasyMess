"use client";
import React, { useEffect, useRef, useState } from "react";
import { GetUser } from "@/components/action/action";
import { useTranslation } from "@/lib/useTranslation";
import { toast } from "sonner";
import {
  Settings,
  ShieldAlert,
  Save,
  Globe,
  Sliders,
  AlertTriangle,
  RefreshCcw,
} from "lucide-react";

// ─── Cache helpers ──────────────────────────────────────────────────────────
const CACHE_KEY = "em_admin_settings_cache";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) return null; // expired
    return data;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

function clearCache() {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {}
}
// ────────────────────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const user = GetUser();
  const adminUserId = user?.user?.id;
  const { lang } = useTranslation();
  const isBn = lang === "bn";

  // Form states — lazily initialized from cache
  const initialSettings = readCache();

  const [loading, setLoading] = useState(!initialSettings);
  const [saving, setSaving] = useState(false);
  // Subtle indicator when background revalidation is happening
  const [revalidating, setRevalidating] = useState(false);

  const [appName, setAppName] = useState(() => initialSettings?.appName || "");
  const [supportEmail, setSupportEmail] = useState(() => initialSettings?.supportEmail || "");
  const [helplineNumber, setHelplineNumber] = useState(() => initialSettings?.helplineNumber || "");
  const [fbGroupUrl, setFbGroupUrl] = useState(() => initialSettings?.fbGroupUrl || "");
  const [maxMessMembers, setMaxMessMembers] = useState(() => initialSettings?.maxMessMembers || 50);
  const [allowSignups, setAllowSignups] = useState(() => initialSettings?.allowSignups !== undefined ? initialSettings.allowSignups : true);
  const [maintenanceMode, setMaintenanceMode] = useState(() => initialSettings?.maintenanceMode !== undefined ? initialSettings.maintenanceMode : false);

  // Ref to avoid applying stale revalidation result after component unmounts
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  /** Apply a settings object to all form state fields */
  function applySettings(s) {
    setAppName(s.appName || "");
    setSupportEmail(s.supportEmail || "");
    setHelplineNumber(s.helplineNumber || "");
    setFbGroupUrl(s.fbGroupUrl || "");
    setMaxMessMembers(s.maxMessMembers || 50);
    setAllowSignups(s.allowSignups !== undefined ? s.allowSignups : true);
    setMaintenanceMode(s.maintenanceMode !== undefined ? s.maintenanceMode : false);
  }

  /** Fetch from server, update cache, and apply to form.
   *  If `silent` is true, skips the loading spinner (background revalidation). */
  const fetchFromServer = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRevalidating(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/system/settings`);
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        writeCache(data.data);
        if (isMounted.current) applySettings(data.data);
      }
    } catch (err) {
      console.error(err);
      if (!silent)
        toast.error(isBn ? "সেটিংস লোড করতে ব্যর্থ হয়েছে" : "Failed to load settings");
    } finally {
      if (isMounted.current) {
        if (!silent) setLoading(false);
        else setRevalidating(false);
      }
    }
  };

  /** Manual refresh — clears cache then fetches fresh */
  const handleRefresh = () => {
    clearCache();
    fetchFromServer(false);
  };

  useEffect(() => {
    if (!adminUserId) return;

    const cached = readCache();
    if (cached) {
      // Cache found — instantly visible via lazy useState initializers above.
      // Quietly revalidate in background to pick up any server-side changes.
      setTimeout(() => {
        fetchFromServer(true);
      }, 0);
    } else {
      // No cache — full load with spinner
      setTimeout(() => {
        fetchFromServer(false);
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminUserId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!adminUserId) return;
    setSaving(true);
    try {
      const payload = {
        adminUserId,
        appName,
        supportEmail,
        helplineNumber,
        fbGroupUrl,
        maxMessMembers,
        allowSignups,
        maintenanceMode,
      };
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Update cache immediately with the saved values
        writeCache({
          appName, supportEmail, helplineNumber, fbGroupUrl,
          maxMessMembers, allowSignups, maintenanceMode,
        });
        toast.success(isBn ? "সিস্টেম সেটিংস সফলভাবে আপডেট করা হয়েছে" : "System settings updated successfully");
      } else {
        toast.error(data.message || (isBn ? "আপডেট করতে ব্যর্থ" : "Failed to update"));
      }
    } catch (err) {
      console.error(err);
      toast.error(isBn ? "সার্ভার এরর" : "Server error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5 font-display">
            <Settings className="text-orange-500" size={24} />
            {isBn ? "সিস্টেম কনফিগারেশন" : "System Configuration"}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
            {isBn
              ? "গ্লোবাল প্যারামিটার, রেজিস্ট্রেশন লিমিট এবং সিস্টেম রক্ষণাবেক্ষণ পরিচালনা করুন"
              : "Manage global app parameters, system limits, and platform maintenance mode"}
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          title={isBn ? "রিফ্রেশ করুন" : "Force refresh"}
          className="p-2 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-xl text-gray-500 hover:bg-gray-50 transition cursor-pointer"
        >
          <RefreshCcw size={16} className={loading || revalidating ? "animate-spin" : ""} />
        </button>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          <p className="text-xs text-gray-400 mt-3">{isBn ? "সেটিংস লোড হচ্ছে..." : "Loading configuration settings..."}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Brand & Contact Settings */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 font-display">
              <Globe size={18} className="text-orange-500" />
              {isBn ? "ব্র্যান্ড ও সাপোর্ট ইনফরমেশন" : "Brand & Support Information"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  {isBn ? "অ্যাপের নাম (App Name)" : "Application Name"}
                </label>
                <input
                  type="text"
                  required
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  {isBn ? "সাপোর্ট ইমেইল (Support Email)" : "Support Contact Email"}
                </label>
                <input
                  type="email"
                  required
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  {isBn ? "হেল্পলাইন নাম্বার (Helpline Number)" : "Helpline Phone Number"}
                </label>
                <input
                  type="text"
                  required
                  value={helplineNumber}
                  onChange={(e) => setHelplineNumber(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  {isBn ? "ফেসবুক গ্রুপ লিংক (FB Group URL)" : "Facebook Group Link"}
                </label>
                <input
                  type="url"
                  required
                  value={fbGroupUrl}
                  onChange={(e) => setFbGroupUrl(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* System Limits & Rules */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 font-display">
              <Sliders size={18} className="text-orange-500" />
              {isBn ? "সিস্টেম লিমিট ও রেস্ট্রিকশন" : "System Limits & Restrictions"}
            </h2>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  {isBn ? "মেস প্রতি সর্বোচ্চ মেম্বার (Max Mess Members)" : "Maximum Members per Mess"}
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={maxMessMembers}
                  onChange={(e) => setMaxMessMembers(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-gray-50/50 dark:bg-slate-800/30 rounded-2xl border border-gray-100/50 dark:border-slate-800">
              <div className="space-y-0.5 max-w-[80%]">
                <h3 className="text-xs font-bold text-gray-900 dark:text-white">
                  {isBn ? "নতুন ইউজার রেজিস্ট্রেশন অনুমোদন করুন" : "Allow New User Registrations"}
                </h3>
                <p className="text-[10px] text-gray-400">
                  {isBn
                    ? "সিস্টেমে নতুন কোনো অ্যাকাউন্ট খোলা চালু বা বন্ধ রাখুন"
                    : "Toggle platform signups for new members"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAllowSignups(!allowSignups)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                  allowSignups ? "bg-orange-500" : "bg-gray-200 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    allowSignups ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Maintenance Mode */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-rose-100 dark:border-rose-950/20 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2 font-display">
              <ShieldAlert size={18} />
              {isBn ? "রক্ষণাবেক্ষণ মোড (Maintenance Mode)" : "System Maintenance Settings"}
            </h2>

            <div className="p-4 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100/50 dark:border-rose-950/30 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={18} />
              <div className="text-xs text-rose-700 dark:text-rose-300 space-y-1">
                <p className="font-bold">
                  {isBn ? "রক্ষণাবেক্ষণ মোড চালু করার সতর্কতা!" : "Critical Warning for Maintenance Mode"}
                </p>
                <p className="leading-relaxed">
                  {isBn
                    ? "রক্ষণাবেক্ষণ মোড চালু করলে প্ল্যাটফর্মের সাধারণ ইউজার ও মেস ম্যানেজারদের পেজে প্রবেশ সাময়িকভাবে ব্লক হয়ে যাবে। শুধুমাত্র সিস্টেম অ্যাডমিনরাই লগইন এবং অ্যাডমিন ড্যাশবোর্ড ব্যবহার করতে পারবেন।"
                    : "Enabling maintenance mode redirects all standard users and mess managers to a maintenance splash page. Only administrators will retain access to login and manage the admin console."}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-gray-50/50 dark:bg-slate-800/30 rounded-2xl border border-gray-100/50 dark:border-slate-800">
              <div className="space-y-0.5 max-w-[80%]">
                <h3 className="text-xs font-bold text-gray-900 dark:text-white">
                  {isBn ? "সিস্টেম রক্ষণাবেক্ষণ মোড চালু করুন" : "Enable Global Maintenance Mode"}
                </h3>
                <p className="text-[10px] text-gray-400">
                  {isBn ? "পুরো প্ল্যাটফর্মে রক্ষণাবেক্ষণ বার্তা দেখান" : "Set the entire website offline for maintenance"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                  maintenanceMode ? "bg-rose-500" : "bg-gray-200 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    maintenanceMode ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold rounded-2xl text-sm transition flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer font-display"
          >
            <Save size={16} />
            <span>{saving ? (isBn ? "সেভ হচ্ছে..." : "Saving Settings...") : (isBn ? "সিস্টেম কনফিগারেশন সেভ করুন" : "Save Configurations")}</span>
          </button>
        </form>
      )}
    </div>
  );
}
