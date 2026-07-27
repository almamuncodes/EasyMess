"use client";
import React, { useEffect, useState } from "react";
import { GetUser } from "@/components/action/action";
import { useTranslation } from "@/lib/useTranslation";
import { toast } from "sonner";
import {
  Mail,
  Send,
  Users,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Edit3,
  Eye,
  Lock,
} from "lucide-react";

export default function AdminBulkEmailPage() {
  const user = GetUser();
  const userId = user?.user?.id || user?.id;
  const { lang } = useTranslation();
  const isBn = lang === "bn";

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [userCount, setUserCount] = useState(null);
  const [fetchingCount, setFetchingCount] = useState(true);
  const [activeTab, setActiveTab] = useState("compose"); // "compose" | "preview"

  useEffect(() => {
    async function fetchUserStats() {
      if (!userId) return;
      try {
        setFetchingCount(true);
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
        const res = await fetch(`${apiBase}/api/admin/overview?userId=${userId}`);
        const data = await res.json();
        if (data.success && data.summary) {
          setUserCount(data.summary.totalUsers || data.summary.totalMembersAcrossMesses || 0);
        }
      } catch (err) {
        console.error("Failed to fetch user stats:", err);
      } finally {
        setFetchingCount(false);
      }
    }
    fetchUserStats();
  }, [userId]);

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!subject.trim()) {
      toast.error(isBn ? "ইমেইলের সাবজেক্ট লিখুন!" : "Please enter email subject!");
      return;
    }
    if (!message.trim()) {
      toast.error(isBn ? "ইমেইলের মূল মেসেজটি লিখুন!" : "Please enter email message!");
      return;
    }

    if (!userId) {
      toast.error(isBn ? "অ্যাডমিন সেশন ভ্যালিড নয়!" : "Admin session is invalid!");
      return;
    }

    const confirmSend = window.confirm(
      isBn
        ? `আপনি কি নিশ্চিত যে সকল ইউজারকে এই ইমেইলটি পাঠাতে চান?`
        : `Are you sure you want to send this email to all users?`
    );

    if (!confirmSend) return;

    try {
      setLoading(true);
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${apiBase}/api/admin/send-bulk-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(
          isBn
            ? `সফলভাবে ${data.recipientCount} জন ইউজারকে ইমেইল পাঠানো হয়েছে!`
            : `Email successfully sent to ${data.recipientCount} users!`
        );
        setSubject("");
        setMessage("");
      } else {
        toast.error(data.message || (isBn ? "ইমেইল পাঠাতে ব্যর্থ হয়েছে!" : "Failed to send email!"));
      }
    } catch (err) {
      console.error("Send bulk email error:", err);
      toast.error(isBn ? "সার্ভারে সমস্যা হয়েছে!" : "Server error occurred!");
    } finally {
      setLoading(false);
    }
  };

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const formattedPreviewHtml = message
    ? message
        .split("\n")
        .map((line) => {
          const lineWithLinks = line.replace(
            urlRegex,
            (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #ea580c; font-weight: 600; text-decoration: underline; word-break: break-all;">${url}</a>`
          );
          return `<p style="margin-bottom: 12px; line-height: 1.6;">${lineWithLinks}</p>`;
        })
        .join("")
    : "<p style='color: #9ca3af; font-style: italic;'>Your email text will preview here...</p>";

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Top Header Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 p-6 md:p-8 text-white shadow-xl">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 pointer-events-none">
            <Mail size={220} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-white mb-3">
                <Sparkles size={14} />
                {isBn ? "অ্যাডমিন ব্রডকাস্ট প্যানেল" : "Admin Broadcast System"}
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {isBn ? "এক ক্লিকে সকল ইউজারকে ইমেইল পাঠান" : "Send One-Click Bulk Email to All Users"}
              </h1>
              <p className="mt-1 text-orange-100 text-sm md:text-base max-w-xl">
                {isBn
                  ? "সিস্টেমের সকল নিবন্ধিত ব্যবহারকারীদের এক ক্লিকে গুরুত্বপূর্ণ ঘোষণা, আপডেট বা নোটিশ মেইল করুন।"
                  : "Broadcast important announcements, updates, or notices to all registered system users at once."}
              </p>
            </div>

            {/* Total Users Badge */}
            <div className="shrink-0 bg-white/15 backdrop-blur-md border border-white/20 rounded-xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white">
                <Users size={24} />
              </div>
              <div>
                <p className="text-xs text-orange-100 font-medium">
                  {isBn ? "মোট টার্গেট ইউজার" : "Total Target Users"}
                </p>
                <p className="text-2xl font-black">
                  {fetchingCount ? (
                    <RefreshCw size={20} className="animate-spin" />
                  ) : (
                    userCount ?? "--"
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Privacy Banner */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3 text-amber-800 dark:text-amber-300 text-xs md:text-sm">
          <ShieldCheck className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" size={18} />
          <div>
            <span className="font-semibold">
              {isBn ? "প্রাইভেসি প্রোটেকশন সুরক্ষা (BCC Protection Active): " : "Privacy Protection Active (BCC): "}
            </span>
            {isBn
              ? "সকল ইউজারকে গোপন কার্বন কপি (BCC) ফিল্ডে রেখে মেইল পাঠানো হবে। ফলে কোনো ব্যবহারকারী অন্যদের ইমেইল এড্রেস দেখতে পারবে না।"
              : "Emails are transmitted using Blind Carbon Copy (BCC). No recipient can view other users' email addresses."}
          </div>
        </div>

        {/* Main Editor Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          
          {/* Tab Switcher */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2 bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab("compose")}
                className={`flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all ${
                  activeTab === "compose"
                    ? "bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Edit3 size={16} />
                {isBn ? "মেইল কম্পোজ করুন" : "Compose Email"}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all ${
                  activeTab === "preview"
                    ? "bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Eye size={16} />
                {isBn ? "প্রিভিউ দেখুন" : "Live Preview"}
              </button>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 hidden sm:flex">
              <Lock size={14} className="text-emerald-500" />
              {isBn ? "অ্যাডমিন ভেরিফাইড" : "Admin Verified"}
            </div>
          </div>

          <form onSubmit={handleSendEmail} className="p-6 md:p-8 space-y-6">
            
            {/* Subject Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                {isBn ? "ইমেইল সাবজেক্ট (Subject)" : "Email Subject"} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={
                  isBn
                    ? "যেমন: [EasyMess] সিস্টেম মেইনটেন্যান্স বা বিশেষ ঘোষণা..."
                    : "e.g., [EasyMess] Important System Announcement & Updates..."
                }
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-sm"
                required
              />
            </div>

            {/* Tab 1: Compose Editor */}
            {activeTab === "compose" ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {isBn ? "ইমেইলের মূল মেসেজ (Email Body)" : "Email Message"} <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-slate-400">
                    {message.length} {isBn ? "অক্ষর" : "chars"}
                  </span>
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={10}
                  placeholder={
                    isBn
                      ? "প্রিয় ইউজার,\n\nআমাদের EasyMess প্ল্যাটফর্মে আপনার জন্য কিছু নতুন আপডেট যুক্ত করা হয়েছে...\n\nধন্যবাদ,\nEasyMess টিম"
                      : "Dear Users,\n\nWe are pleased to announce new updates to EasyMess platform...\n\nBest Regards,\nEasyMess Team"
                  }
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-sm leading-relaxed"
                  required
                />
              </div>
            ) : (
              /* Tab 2: Preview Card */
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {isBn ? "ইউজাররা যেভাবে ইমেইলটি দেখতে পাবে:" : "How recipients will view this email:"}
                </label>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 bg-white dark:bg-slate-900 max-w-2xl mx-auto shadow-sm">
                  <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                    <h3 className="text-xl font-bold text-orange-500">EasyMess</h3>
                    <p className="text-xs text-slate-400">Smart Meal & Mess Management Platform</p>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-3 text-base">
                    {subject || (isBn ? "(কোনো সাবজেক্ট দেওয়া হয়নি)" : "(No Subject Provided)")}
                  </h4>
                  <div
                    className="text-sm text-slate-700 dark:text-slate-300 space-y-3 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formattedPreviewHtml }}
                  />
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6 text-center text-xs text-slate-400">
                    <p>This email was sent by EasyMess Admin Team to all active users.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Submit Button */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>{isBn ? "ইমেইল পাঠানো হচ্ছে..." : "Sending Email..."}</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>{isBn ? "সকল ইউজারকে ইমেইল পাঠান" : "Send Email to All Users"}</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
