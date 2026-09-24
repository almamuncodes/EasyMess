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
  const [targetMess, setTargetMess] = useState("all");
  const [messes, setMesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [fetchingCount, setFetchingCount] = useState(true);
  const [activeTab, setActiveTab] = useState("compose"); // "compose" | "preview"

  useEffect(() => {
    async function fetchUserStats() {
      if (!userId) return;
      try {
        setFetchingCount(true);
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
        const res = await fetch(`${apiBase}/api/admin/users?userId=${userId}`);
        const data = await res.json();
        if (data.success && data.data) {
          // Filter to only include users with emails
          const withEmail = data.data.filter((u) => Boolean(u.email));
          setAllUsers(withEmail);
        }

        // Fetch messes for target selection
        const messRes = await fetch(`${apiBase}/api/admin/all-mess-details?userId=${userId}`);
        const messData = await messRes.json();
        if (messRes.ok && messData.success) {
          setMesses(messData.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setFetchingCount(false);
      }
    }
    fetchUserStats();
  }, [userId]);

  const filteredCount = React.useMemo(() => {
    if (targetMess === "all") return allUsers.length;
    return allUsers.filter(u => u.messInfo?.messId?.toString() === targetMess.toString()).length;
  }, [allUsers, targetMess]);

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const selectedMessName = React.useMemo(() => {
    if (targetMess === "all") return null;
    const found = messes.find((m) => m._id === targetMess);
    return found ? (found.messName || found.name) : null;
  }, [messes, targetMess]);

  const handleSendEmail = (e) => {
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

    setShowConfirmModal(true);
  };

  const executeSendEmail = async () => {
    setShowConfirmModal(false);

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
          targetMess: targetMess,
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
                    filteredCount
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
            
            {/* Target Specific Mess Selector */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                {isBn ? "নির্দিষ্ট কোনো মেসে পাঠাতে চান? (ঐচ্ছিক)" : "Target Specific Mess? (Optional)"}
              </label>
              <select
                value={targetMess}
                onChange={(e) => setTargetMess(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-sm cursor-pointer appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23f97316%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '0.65rem auto' }}
              >
                <option value="all">{isBn ? "সব মেস (All Messes)" : "All Messes"}</option>
                {messes.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.messName}
                  </option>
                ))}
              </select>
            </div>

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
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>{isBn ? "ইমেইল পাঠানো হচ্ছে..." : "Sending Email..."}</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>
                      {targetMess === "all"
                        ? isBn
                          ? "সকল ইউজারকে ইমেইল পাঠান"
                          : "Send Email to All Users"
                        : isBn
                        ? "টার্গেট মেসে ইমেইল পাঠান"
                        : "Send Email to Target Mess"}
                    </span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center mx-auto mb-4">
                <Mail size={32} />
              </div>
              <h3 className="text-xl font-black text-center text-gray-900 dark:text-white mb-2">
                {isBn ? "ইমেইল কনফার্মেশন" : "Confirm Email Broadcast"}
              </h3>
              <p className="text-center text-gray-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                {isBn ? (
                  <>
                    আপনি কি নিশ্চিত যে{" "}
                    {selectedMessName ? (
                      <span className="text-orange-600 font-bold">[{selectedMessName}]</span>
                    ) : (
                      "সকল"
                    )}{" "}
                    মেসের মোট <strong>{filteredCount} জন</strong> ব্যবহারকারীর ইমেইলে এই মেসেজটি পাঠাতে চান?
                  </>
                ) : (
                  <>
                    Are you sure you want to broadcast this email to{" "}
                    <strong>{filteredCount} users</strong>
                    {selectedMessName ? ` in [${selectedMessName}]` : ""}?
                  </>
                )}
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-bold text-sm transition cursor-pointer"
                >
                  {isBn ? "বাতিল করুন" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={executeSendEmail}
                  className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/30 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  <span>{isBn ? "হ্যাঁ, পাঠান" : "Yes, Send"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
