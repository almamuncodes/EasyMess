"use client";
import React, { useEffect, useState, useMemo } from "react";
import { GetUser } from "@/components/action/action";
import { useTranslation } from "@/lib/useTranslation";
import { toast } from "sonner";
import {
  Activity,
  Search,
  RefreshCcw,
  Clock,
  User,
  Shield,
  FileText,
} from "lucide-react";

export default function AdminAuditLogsPage() {
  const user = GetUser();
  const adminUserId = user?.user?.id;
  const { lang } = useTranslation();
  const isBn = lang === "bn";

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLogs = async () => {
    if (!adminUserId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/audit-logs?userId=${adminUserId}`
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setLogs(data.data || []);
      } else {
        toast.error(data.message || (isBn ? "অডিট লগ লোড করতে ব্যর্থ" : "Failed to load audit logs"));
      }
    } catch (err) {
      console.error(err);
      toast.error(isBn ? "সার্ভার এরর" : "Server error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchLogs();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminUserId]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      return (
        log.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [logs, searchQuery]);

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <Activity className="text-orange-500" size={26} />
            {isBn ? "সিস্টেম ওয়াইড অডিট লগ" : "Global Audit & Activity Logs"}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
            {isBn
              ? "সিস্টেমের সমস্ত মেসের অ্যাক্টিভিটি, ইউজার অ্যাকশন এবং অডিট ফিড।"
              : "Real-time timeline feed of all user actions and system changes across all messes."}
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="self-start sm:self-auto px-4 py-2 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-xl text-xs font-semibold hover:bg-orange-100 transition flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
          <span>{isBn ? "রিফ্রেশ" : "Refresh"}</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={isBn ? "অ্যাকশন বা ইউজারের নামে খুঁজুন..." : "Filter by user, action, or details..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>
        <span className="text-xs font-semibold text-gray-400 dark:text-slate-500">
          {filteredLogs.length} {isBn ? "লগ এন্ট্রি" : "Log Entries"}
        </span>
      </div>

      {/* Logs Feed */}
      {loading ? (
        <div className="p-12 flex justify-center bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-12 text-center text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800">
          {isBn ? "কোনো অডিট লগ পাওয়া যায়নি" : "No audit logs match your search"}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log._id}
                className="p-4 rounded-xl border border-gray-100 dark:border-slate-800/80 bg-gray-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                      {log.userName || "System User"}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                      {log.category || "General"}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                    {log.action}
                  </p>
                  {log.details && (
                    <p className="text-xs text-gray-500 dark:text-slate-400">{log.details}</p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 self-end sm:self-center whitespace-nowrap">
                  <Clock size={12} />
                  <span>{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
