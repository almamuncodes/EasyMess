"use client";
import React, { useEffect, useState, useRef } from "react";
import { GetUser } from "@/components/action/action";
import { useTranslation } from "@/lib/useTranslation";
import { toast } from "sonner";
import {
  Send,
  Users,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Edit3,
  Eye,
  Settings,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  MessageSquare,
  QrCode,
  Smartphone,
  Phone,
  Copy,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Quote,
  List,
  Smile,
} from "lucide-react";

export default function AdminBulkWhatsAppPage() {
  const user = GetUser();
  const userId = user?.user?.id || user?.id;
  const { lang } = useTranslation();
  const isBn = lang === "bn";

  const [message, setMessage] = useState("");
  const [targetRole, setTargetRole] = useState("all"); // "all" | "manager" | "member"
  const [targetMess, setTargetMess] = useState("all");
  const [messes, setMesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userCount, setUserCount] = useState(null);
  const [whatsappUsers, setWhatsappUsers] = useState([]);
  const [fetchingCount, setFetchingCount] = useState(true);
  const [activeTab, setActiveTab] = useState("compose"); // "compose" | "dispatcher"
  const [showConfirmBroadcastModal, setShowConfirmBroadcastModal] = useState(false);

  // UltraMsg Gateway Config
  const [gatewayConfig, setGatewayConfig] = useState({
    instanceId: "instance192477",
    token: "sxbvzx4j6nmk3ppc",
  });
  const [gatewayStatus, setGatewayStatus] = useState("checking"); // "authenticated" | "standby" | "qr" | "error"
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  // Broadcast Progress
  const [broadcastProgress, setBroadcastProgress] = useState(null); // { current, total, sent, failed }

  // Rich Text Selection & Formatting
  const textareaRef = useRef(null);
  const [selectionRange, setSelectionRange] = useState(null); // { start, end, text }

  const handleTextSelect = () => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (start !== end && end > start) {
      const selected = el.value.substring(start, end);
      if (selected.trim().length > 0) {
        setSelectionRange({ start, end, text: selected });
        return;
      }
    }
    setSelectionRange(null);
  };

  const applyFormat = (formatType) => {
    const el = textareaRef.current;
    if (!el) return;

    let start = el.selectionStart;
    let end = el.selectionEnd;

    if (selectionRange) {
      start = selectionRange.start;
      end = selectionRange.end;
    }

    const currentText = message;
    const selected = currentText.substring(start, end);

    // Extract leading & trailing whitespace so marks strictly hug the text (WhatsApp requirement)
    const leadingSpaces = selected.match(/^\s*/)?.[0] || "";
    const trailingSpaces = selected.match(/\s*$/)?.[0] || "";
    const coreText = selected.trim();

    let formatted = "";
    if (formatType === "bold") {
      if (coreText.startsWith("*") && coreText.endsWith("*") && coreText.length >= 2) {
        formatted = `${leadingSpaces}${coreText.slice(1, -1)}${trailingSpaces}`;
      } else {
        const textToWrap = coreText || (isBn ? "বোল্ড টেক্সট" : "bold text");
        formatted = `${leadingSpaces}*${textToWrap}*${trailingSpaces}`;
      }
    } else if (formatType === "italic") {
      if (coreText.startsWith("_") && coreText.endsWith("_") && coreText.length >= 2) {
        formatted = `${leadingSpaces}${coreText.slice(1, -1)}${trailingSpaces}`;
      } else {
        const textToWrap = coreText || (isBn ? "ইটালিক টেক্সট" : "italic text");
        formatted = `${leadingSpaces}_${textToWrap}_${trailingSpaces}`;
      }
    } else if (formatType === "strike") {
      if (coreText.startsWith("~") && coreText.endsWith("~") && coreText.length >= 2) {
        formatted = `${leadingSpaces}${coreText.slice(1, -1)}${trailingSpaces}`;
      } else {
        const textToWrap = coreText || (isBn ? "স্ট্রাইক টেক্সট" : "strikethrough text");
        formatted = `${leadingSpaces}~${textToWrap}~${trailingSpaces}`;
      }
    } else if (formatType === "code") {
      if (coreText.startsWith("```") && coreText.endsWith("```") && coreText.length >= 6) {
        formatted = `${leadingSpaces}${coreText.slice(3, -3)}${trailingSpaces}`;
      } else {
        const textToWrap = coreText || "code";
        formatted = `${leadingSpaces}\`\`\`${textToWrap}\`\`\`${trailingSpaces}`;
      }
    } else if (formatType === "quote") {
      formatted = selected
        .split("\n")
        .map((line) => (line.startsWith("> ") ? line.slice(2) : `> ${line}`))
        .join("\n");
      if (!selected) formatted = `> ${isBn ? "কোট টেক্সট" : "quote text"}`;
    } else if (formatType === "bullet") {
      formatted = selected
        .split("\n")
        .map((line) => (line.startsWith("• ") ? line.slice(2) : `• ${line}`))
        .join("\n");
      if (!selected) formatted = `• ${isBn ? "লিস্ট আইটেম" : "list item"}`;
    }

    const nextMessage = currentText.substring(0, start) + formatted + currentText.substring(end);
    setMessage(nextMessage);
    setSelectionRange(null);

    setTimeout(() => {
      if (el) {
        el.focus();
        const cursor = start + formatted.length;
        el.setSelectionRange(cursor, cursor);
      }
    }, 10);
  };

  const insertEmoji = (emoji) => {
    const el = textareaRef.current;
    if (!el) {
      setMessage((prev) => prev + emoji);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const nextMessage = message.substring(0, start) + emoji + message.substring(end);
    setMessage(nextMessage);
    setTimeout(() => {
      el.focus();
      const cursor = start + emoji.length;
      el.setSelectionRange(cursor, cursor);
    }, 10);
  };

  // 1. Fetch Users with WhatsApp
  useEffect(() => {
    async function fetchStats() {
      if (!userId) return;
      try {
        setFetchingCount(true);
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
        const res = await fetch(`${apiBase}/api/admin/users?userId=${userId}`);
        const data = await res.json();
        if (res.ok && data.success) {
          const list = data.data || [];
          const withWa = list.filter((u) => Boolean(u.whatsappNumber));
          setWhatsappUsers(withWa);
          setUserCount(withWa.length);
        }

        // Also fetch all messes for target selection
        const messRes = await fetch(`${apiBase}/api/admin/all-mess-details?userId=${userId}`);
        const messData = await messRes.json();
        if (messRes.ok && messData.success) {
          setMesses(messData.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch WhatsApp users or messes:", err);
      } finally {
        setFetchingCount(false);
      }
    }
    fetchStats();
  }, [userId]);

  // 2. Fetch UltraMsg Gateway Status
  const checkStatus = async () => {
    if (!userId) return;
    try {
      setGatewayStatus("checking");
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${apiBase}/api/admin/whatsapp-status?userId=${userId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setGatewayStatus(data.status || "ready");
      } else {
        setGatewayStatus("standby");
      }
    } catch {
      setGatewayStatus("standby");
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      checkStatus();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Filtered recipients count based on targetRole and targetMess
  const filteredCount = React.useMemo(() => {
    let filtered = whatsappUsers;
    
    if (targetMess !== "all") {
      filtered = filtered.filter(u => u.messInfo?.messId?.toString() === targetMess.toString());
    }
    
    if (targetRole !== "all") {
      filtered = filtered.filter((u) => u.role?.toLowerCase() === targetRole.toLowerCase());
    }
    
    return filtered.length;
  }, [whatsappUsers, targetRole, targetMess]);

  // Quick Message Templates
  const handleApplyTemplate = (type) => {
    if (type === "emergency") {
      setMessage(
        isBn
          ? `📢 *জরুরি মেস নোটিশ — EasyMess*\n\nপ্রিয় মেম্বার,\nআজকের মেসের জন্য একটি বিশেষ ঘোষণা রয়েছে। অনুগ্রহ করে অ্যাপে গিয়ে আপনার আজকের মিল ও নোটিশ বোর্ড চেক করুন।\n\nধন্যবাদ,\nমেস ম্যানেজমেন্ট`
          : `📢 *Urgent Mess Notice — EasyMess*\n\nDear Member,\nThere is an important announcement regarding your mess today. Please log in to the EasyMess app to check your meal status and notice board.\n\nThank you,\nMess Management`
      );
    } else if (type === "bazaar") {
      setMessage(
        isBn
          ? `🛒 *আজকের বাজার ও মিল আপডেট — EasyMess*\n\nপ্রিয় মেম্বার,\nআজকের বাজার সম্পন্ন হয়েছে এবং মিলের তালিকা আপডেট করা হয়েছে। আপনার কোনো মিল বন্ধ বা চালু করার প্রয়োজন থাকলে নির্ধারিত ডেডলাইনের আগে আপডেট করে নিন।\n\nঅ্যাপ লিঙ্ক: https://easymess.vercel.app`
          : `🛒 *Bazaar & Meal Status Update — EasyMess*\n\nDear Member,\nToday's bazaar has been finalized and meal records are updated. Please ensure your meal status is set correctly before the deadline.\n\nApp: https://easymess.vercel.app`
      );
    } else if (type === "bill") {
      setMessage(
        isBn
          ? `💳 *মিল বিল ও ডিপোজিট রিমাইন্ডার — EasyMess*\n\nপ্রিয় মেম্বার,\nচলতি মাসের মেস খরচের হিসাব ও মিল বিল প্রকাশিত হয়েছে। মেস সুষ্ঠুভাবে পরিচালনার সুবিধার্থে আপনার বকেয়া ডিপোজিট দ্রুত পরিশোধ করার অনুরোধ করা হচ্ছে।\n\nহিসাব দেখুন: https://easymess.vercel.app/dashboard`
          : `💳 *Mess Bill & Deposit Reminder — EasyMess*\n\nDear Member,\nThe monthly mess expense and bill calculation has been published. Please clear any outstanding dues/deposit promptly for smooth mess operations.\n\nCheck Bill: https://easymess.vercel.app/dashboard`
      );
    } else if (type === "maintenance") {
      setMessage(
        isBn
          ? `🛠️ *সিস্টেম আপডেট নোটিশ — EasyMess*\n\nপ্রিয় ব্যবহারকারী,\nঅ্যাপের পারফরম্যান্স ও সার্ভার উন্নত করার জন্য আজ কিছুক্ষণ সিস্টেম রক্ষণাবেক্ষণ কাজ চলবে। সাময়িক অসুবিধার জন্য আমরা আন্তরিকভাবে দুঃখিত।\n\n— EasyMess টিম`
          : `🛠️ *System Maintenance Notice — EasyMess*\n\nDear User,\nWe are performing routine maintenance to improve your experience. Services may be briefly interrupted. Thank you for your patience.\n\n— EasyMess Team`
      );
    }
  };

  // 3. Handle Send Broadcast Form Submit
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error(isBn ? "মেসেজ লিখুন!" : "Please write a message!");
      return;
    }
    if (!userId) {
      toast.error(isBn ? "অ্যাডমিন সেশন ভ্যালিড নয়!" : "Admin session is invalid!");
      return;
    }
    if (filteredCount === 0) {
      toast.error(isBn ? "কোনো WhatsApp ইউজার পাওয়া যায়নি!" : "No WhatsApp users found!");
      return;
    }

    setShowConfirmBroadcastModal(true);
  };

  const executeBroadcast = async () => {
    setShowConfirmBroadcastModal(false);
    try {
      setLoading(true);
      setBroadcastProgress({ current: 0, total: filteredCount, sent: 0, failed: 0 });

      const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${apiBase}/api/admin/send-bulk-whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          message: message.trim(),
          targetRole,
          targetMess,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(
          isBn
            ? `সফলভাবে ${data.sentCount} জন ইউজারকে WhatsApp পাঠানো হয়েছে!`
            : `Successfully sent WhatsApp broadcast to ${data.sentCount} users!`
        );
        setMessage("");
      } else {
        toast.error(data.message || (isBn ? "মেসেজ পাঠাতে ব্যর্থ হয়েছে!" : "Failed to broadcast!"));
      }
    } catch (err) {
      console.error("WhatsApp Broadcast error:", err);
      toast.error(isBn ? "সার্ভারে সমস্যা হয়েছে!" : "Server error occurred!");
    } finally {
      setLoading(false);
      setBroadcastProgress(null);
    }
  };

  // 4. Save Gateway Config
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${apiBase}/api/admin/whatsapp-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          instanceId: gatewayConfig.instanceId.trim(),
          token: gatewayConfig.token.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(isBn ? "গেটওয়ে কনফিগারেশন সংরক্ষিত হয়েছে!" : "Gateway configured successfully!");
        setShowConfigModal(false);
        checkStatus();
      } else {
        toast.error(data.message || "Failed to save configuration");
      }
    } catch {
      toast.error("Failed to save configuration");
    } finally {
      setSavingConfig(false);
    }
  };

  // 5. Send Test WhatsApp
  const handleSendTest = async () => {
    if (!testPhone.trim()) {
      toast.error(isBn ? "টেস্ট মোবাইল নাম্বার দিন!" : "Enter test phone number!");
      return;
    }
    setSendingTest(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${apiBase}/api/admin/whatsapp-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          phone: testPhone.trim(),
          message: message.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(isBn ? "টেস্ট মেসেজ সফলভাবে পাঠানো হয়েছে!" : "Test message sent successfully!");
      } else {
        toast.error(data.message || "Failed to send test message");
      }
    } catch {
      toast.error("Test failed");
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Top Header Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 p-6 md:p-8 text-white shadow-xl">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 pointer-events-none">
            <svg className="w-72 h-72 fill-current" viewBox="0 0 24 24">
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm.01 1.67c4.54 0 8.24 3.7 8.24 8.24 0 2.2-.86 4.27-2.42 5.82a8.19 8.19 0 01-5.82 2.41c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 01-1.25-4.37c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.64c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.24-.75-.67-1.25-1.49-1.4-1.74-.14-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.11-.23-.17-.48-.3z" />
            </svg>
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-white mb-3">
                <Sparkles size={14} />
                {isBn ? "অ্যাডমিন WhatsApp ব্রডকাস্ট সিস্টেম" : "Admin WhatsApp Broadcast System"}
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {isBn ? "এক ক্লিকে সকল ইউজারকে WhatsApp নোটিশ পাঠান" : "Send One-Click WhatsApp Notice to All Users"}
              </h1>
              <p className="mt-1 text-orange-50 text-sm md:text-base max-w-xl">
                {isBn
                  ? "ইমেইল নয়, সবার ইনবক্সে সরাসরি হোয়াটসঅ্যাপ মেসেজ পাঠিয়ে ৯৮% ওপেন রেট নিশ্চিত করুন।"
                  : "Directly reach users on their WhatsApp inbox with instant delivery and maximum open rates."}
              </p>
            </div>

            {/* Quick Stats / Gateway Status Badge */}
            <div className="flex flex-col gap-2 shrink-0">
              <div className="bg-white/15 backdrop-blur-lg border border-white/25 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white text-orange-600 flex items-center justify-center font-black">
                  <Users size={20} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-orange-100 font-semibold">
                    {isBn ? "সংযুক্ত ইউজার" : "WhatsApp Users"}
                  </p>
                  <p className="text-xl font-extrabold">
                    {fetchingCount ? "..." : `${userCount ?? 0} জন`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowConfigModal(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 border border-white/25 text-xs font-bold transition cursor-pointer backdrop-blur-md"
              >
                <Settings size={14} />
                <span>{isBn ? "UltraMsg গেটওয়ে সেটিংস" : "UltraMsg Gateway Settings"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* View Switcher: Auto-Broadcast vs Manual PC Dispatcher */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("compose")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === "compose"
                  ? "bg-orange-500 text-white shadow-sm"
                  : "bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-800"
              }`}
            >
              <Send size={14} />
              <span>{isBn ? "অটো ব্রডকাস্ট কম্পোজার" : "Auto Broadcast"}</span>
            </button>
            <button
              onClick={() => setActiveTab("dispatcher")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === "dispatcher"
                  ? "bg-orange-500 text-white shadow-sm"
                  : "bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-800"
              }`}
            >
              <ExternalLink size={14} />
              <span>{isBn ? "পিসি ডেসপ্যাচার (WhatsApp Web)" : "PC Web Dispatcher"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
            <span>Instance: <b>instance192477</b></span>
          </div>
        </div>

        {/* MAIN COMPOSE VIEW */}
        {activeTab === "compose" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left Column: Form & Settings */}
            <div className="lg:col-span-7 space-y-6">

              {/* Target Audience Selector */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                  {isBn ? "১. কাদের কাছে পাঠাবেন?" : "1. Target Audience"}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "all", label: isBn ? "সকল ইউজার" : "All Users" },
                    { id: "manager", label: isBn ? "শুধুমাত্র ম্যানেজার" : "Only Managers" },
                    { id: "member", label: isBn ? "সাধারণ মেম্বার" : "Only Members" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTargetRole(t.id)}
                      className={`p-3 rounded-2xl border text-xs font-bold transition cursor-pointer text-center ${
                        targetRole === t.id
                          ? "border-orange-500 bg-orange-500/10 text-orange-700 dark:text-orange-400 ring-2 ring-orange-500/20"
                          : "border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Target Specific Mess Selector */}
                <div className="pt-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-2 block">
                    {isBn ? "নির্দিষ্ট কোনো মেসে পাঠাতে চান?" : "Target Specific Mess?"}
                  </label>
                  <select
                    value={targetMess}
                    onChange={(e) => setTargetMess(e.target.value)}
                    className="w-full p-3 rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 text-gray-900 dark:text-white text-sm font-semibold outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition cursor-pointer appearance-none"
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
                <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                  {isBn
                    ? `✓ মোট ${filteredCount} জন ইউজারের কাছে মেসেজ পাঠানো হবে`
                    : `✓ Will be sent to ${filteredCount} users with WhatsApp`}
                </p>
              </div>

              {/* Quick Template Buttons */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                  {isBn ? "২. দ্রুত মেসেজ টেমপ্লেট নির্বাচন" : "2. Quick Notice Templates"}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate("emergency")}
                    className="p-3 rounded-2xl border border-gray-200 dark:border-slate-800 hover:border-orange-500/50 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 transition cursor-pointer"
                  >
                    📢 {isBn ? "জরুরি মেস নোটিশ" : "Emergency Notice"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate("bazaar")}
                    className="p-3 rounded-2xl border border-gray-200 dark:border-slate-800 hover:border-emerald-500/50 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition cursor-pointer"
                  >
                    🛒 {isBn ? "বাজার ও মিল আপডেট" : "Bazaar & Meal Update"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate("bill")}
                    className="p-3 rounded-2xl border border-gray-200 dark:border-slate-800 hover:border-amber-500/50 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition cursor-pointer"
                  >
                    💳 {isBn ? "মিল বিল ও ডিপোজিট" : "Bill & Deposit Reminder"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate("maintenance")}
                    className="p-3 rounded-2xl border border-gray-200 dark:border-slate-800 hover:border-blue-500/50 text-left text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition cursor-pointer"
                  >
                    🛠️ {isBn ? "সিস্টেম রক্ষণাবেক্ষণ" : "System Maintenance"}
                  </button>
                </div>
              </div>

              {/* Message Composer */}
              <form onSubmit={handleFormSubmit} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm space-y-3 relative">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                    {isBn ? "৩. WhatsApp মেসেজ লিখুন" : "3. Write WhatsApp Message"}
                  </label>
                  <span className="text-xs font-mono text-gray-400">
                    {message.length} chars
                  </span>
                </div>

                {/* Rich Editor Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200/80 dark:border-slate-700/60">
                  {/* Format Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => applyFormat("bold")}
                      className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-black transition cursor-pointer"
                      title={isBn ? "বোল্ড (*টেক্সট*)" : "Bold (*text*)"}
                    >
                      <Bold size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormat("italic")}
                      className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 transition cursor-pointer"
                      title={isBn ? "ইটালিক (_টেক্সট_)" : "Italic (_text_)"}
                    >
                      <Italic size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormat("strike")}
                      className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 transition cursor-pointer"
                      title={isBn ? "স্ট্রাইক (~টেক্সট~)" : "Strikethrough (~text~)"}
                    >
                      <Strikethrough size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormat("code")}
                      className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 transition cursor-pointer font-mono text-xs"
                      title={isBn ? "কোড ব্লক (```code```)" : "Code Block (```code```)"}
                    >
                      <Code size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormat("quote")}
                      className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 transition cursor-pointer"
                      title={isBn ? "উদ্ধৃতি (> টেক্সট)" : "Quote (> text)"}
                    >
                      <Quote size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormat("bullet")}
                      className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 transition cursor-pointer"
                      title={isBn ? "বুলেট লিস্ট (• টেক্সট)" : "Bullet List (• text)"}
                    >
                      <List size={15} />
                    </button>
                  </div>

                  {/* Quick Emoji Shortcuts */}
                  <div className="flex items-center gap-1">
                    {["📢", "🛒", "💳", "⚠️", "✅", "❌", "📅", "📞", "🍲"].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => insertEmoji(emoji)}
                        className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-xs transition cursor-pointer"
                        title={`Insert ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Textarea Container with Floating Popup */}
                <div className="relative">
                  {/* Floating Selection Popup Modal/Pill */}
                  {selectionRange && (
                    <div
                      className="absolute -top-12 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-slate-900/95 dark:bg-slate-800/95 text-white shadow-2xl border border-white/15 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 ring-4 ring-black/5"
                      onMouseDown={(e) => e.preventDefault()} // Keeps selection active!
                    >
                      <div className="flex items-center gap-1 pr-2 mr-1 border-r border-slate-700/80 text-[10px] uppercase font-bold text-orange-400">
                        <Sparkles size={12} />
                        <span>{isBn ? "ফরম্যাট" : "Format"}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => applyFormat("bold")}
                        className="px-2 py-1 rounded-lg hover:bg-white/20 active:scale-95 transition text-xs font-black cursor-pointer"
                        title="Bold (*text*)"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() => applyFormat("italic")}
                        className="px-2 py-1 rounded-lg hover:bg-white/20 active:scale-95 transition text-xs font-serif italic cursor-pointer"
                        title="Italic (_text_)"
                      >
                        I
                      </button>
                      <button
                        type="button"
                        onClick={() => applyFormat("strike")}
                        className="px-2 py-1 rounded-lg hover:bg-white/20 active:scale-95 transition text-xs line-through cursor-pointer"
                        title="Strikethrough (~text~)"
                      >
                        S
                      </button>
                      <button
                        type="button"
                        onClick={() => applyFormat("code")}
                        className="px-2 py-1 rounded-lg hover:bg-white/20 active:scale-95 transition text-[11px] font-mono cursor-pointer"
                        title="Code (```code```)"
                      >
                        &lt;/&gt;
                      </button>
                      <button
                        type="button"
                        onClick={() => applyFormat("quote")}
                        className="px-2 py-1 rounded-lg hover:bg-white/20 active:scale-95 transition text-xs cursor-pointer"
                        title="Quote (> text)"
                      >
                        &ldquo;
                      </button>
                      <button
                        type="button"
                        onClick={() => applyFormat("bullet")}
                        className="px-2 py-1 rounded-lg hover:bg-white/20 active:scale-95 transition text-xs cursor-pointer"
                        title="Bullet (• text)"
                      >
                        •
                      </button>
                    </div>
                  )}

                  <textarea
                    ref={textareaRef}
                    rows={8}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onSelect={handleTextSelect}
                    onKeyUp={handleTextSelect}
                    onMouseUp={handleTextSelect}
                    placeholder={
                      isBn
                        ? "এখানে আপনার মেসেজ লিখুন... যেমন:\n📢 জরুরি মেস নোটিশ:\nসবাইকে জানানো যাচ্ছে যে...\n(যেকোনো লেখা সিলেক্ট করলেই ফরম্যাটিং পপআপ চলে আসবে)"
                        : "Type your announcement here... (Select any text to see formatting popup)"
                    }
                    required
                    className="w-full p-4 rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40 text-gray-900 dark:text-white text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition resize-y font-meta"
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-2 flex gap-3">
                  <button
                    type="submit"
                    disabled={loading || !message.trim() || filteredCount === 0}
                    className="flex-1 py-3.5 px-6 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        <span>{isBn ? "মেসেজ পাঠানো হচ্ছে..." : "Broadcasting WhatsApp..."}</span>
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        <span>{isBn ? `এক ক্লিকে ${filteredCount} জনকে WhatsApp পাঠান` : `Send WhatsApp to ${filteredCount} Users`}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

            </div>

            {/* Right Column: Live WhatsApp Mobile Preview */}
            <div className="lg:col-span-5 space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 px-1">
                {isBn ? "মোবাইলে যেভাবে মেসেজটি দেখাবে" : "Live WhatsApp Preview"}
              </label>

              {/* Mock Mobile Phone Frame */}
              <div className="rounded-[40px] border-4 border-slate-800 bg-slate-900 p-3 shadow-2xl max-w-sm mx-auto">
                {/* Phone Speaker & Camera Notch */}
                <div className="h-4 w-32 bg-slate-800 rounded-full mx-auto mb-2" />

                {/* WhatsApp Screen */}
                <div className="rounded-[30px] overflow-hidden bg-[#EFEAE2] dark:bg-[#0b141a] text-slate-900 dark:text-slate-100 flex flex-col h-[520px]">
                  
                  {/* WhatsApp App Header */}
                  <div className="bg-[#075E54] dark:bg-[#202c33] text-white p-3 flex items-center gap-3 shadow-md shrink-0">
                    <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center font-bold text-xs shadow">
                      EM
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs truncate">EasyMess Official Notice</p>
                      <p className="text-[10px] text-emerald-200">Online</p>
                    </div>
                  </div>

                  {/* WhatsApp Chat Wallpaper / Messages Body */}
                  <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-[radial-gradient(#0000000a_1px,transparent_1px)] [background-size:16px_16px]">
                    <div className="text-center">
                      <span className="px-2.5 py-1 rounded-lg bg-white/70 dark:bg-slate-800/70 backdrop-blur-xs text-[10px] text-slate-500 font-medium uppercase shadow-2xs">
                        Today
                      </span>
                    </div>

                    {/* Chat Bubble */}
                    <div className="flex justify-start">
                      <div className="max-w-[88%] rounded-2xl rounded-tl-xs p-3.5 bg-white dark:bg-[#1f2c34] shadow-sm text-xs space-y-1.5 border border-black/5 dark:border-white/5">
                        <p className="font-bold text-[11px] text-emerald-600 dark:text-emerald-400">
                          EasyMess Notification
                        </p>
                        <div className="whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200 text-xs font-meta break-words">
                          {message || (isBn ? "মেসেজ লিখলে এখানে মোবাইল প্রিভিউ দেখতে পাবেন..." : "Type your message on the left to see live mobile preview...")}
                        </div>
                        <div className="flex items-center justify-end gap-1 pt-1 text-[10px] text-slate-400">
                          <span>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          <span className="text-blue-500 font-bold">✓✓</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mock Input Bar */}
                  <div className="p-2 bg-[#F0F2F5] dark:bg-[#202c33] border-t border-black/5 dark:border-white/5 flex items-center gap-2 text-xs text-slate-400 shrink-0">
                    <span className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 flex-1 text-[11px]">
                      Message
                    </span>
                    <div className="w-7 h-7 rounded-full bg-[#25D366] text-white flex items-center justify-center font-bold text-xs">
                      🎤
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* MANUAL PC DISPATCHER TAB (Direct 1-Click WhatsApp Web) */}
        {activeTab === "dispatcher" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">
                {isBn ? "পিসি ডেসপ্যাচার (সরাসরি WhatsApp Web দিয়ে পাঠানো)" : "PC Web Dispatcher"}
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                {isBn
                  ? "আপনার পিসিতে যদি WhatsApp Web খোলা থাকে, তবে নিচে প্রতি ইউজারের পাশে ক্লিক করেই মেসেজ পাঠিয়ে দিতে পারবেন।"
                  : "If you have WhatsApp Web logged in on this PC, you can click send per user with the message pre-filled."}
              </p>
            </div>

            {/* Recipient List with 1-click Dispatch */}
            <div className="divide-y divide-gray-100 dark:divide-slate-800 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden max-h-[500px] overflow-y-auto">
              {whatsappUsers.map((u, i) => {
                const rawNumber = u.whatsappNumber?.replace(/[^\d]/g, "") || "";
                const waLink = `https://wa.me/${rawNumber}?text=${encodeURIComponent(message || "EasyMess Notice")}`;
                return (
                  <div key={u._id || i} className="p-3.5 flex items-center justify-between gap-3 hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                        {u.name?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">{u.name}</p>
                        <p className="text-[11px] text-gray-400 font-mono">{u.whatsappNumber}</p>
                      </div>
                    </div>

                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold shadow-xs transition active:scale-95"
                    >
                      <ExternalLink size={12} />
                      <span>{isBn ? "পাঠান" : "Send"}</span>
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* UltraMsg Gateway Setup Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl max-w-md w-full border border-gray-100 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#25D366] text-white flex items-center justify-center font-bold">
                  <Settings size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                    UltraMsg Gateway Setup
                  </h3>
                  <p className="text-xs text-gray-400">WhatsApp Automation API</p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 hover:text-gray-800 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                  Instance ID
                </label>
                <input
                  type="text"
                  required
                  value={gatewayConfig.instanceId}
                  onChange={(e) => setGatewayConfig({ ...gatewayConfig, instanceId: e.target.value })}
                  placeholder="instance192477"
                  className="mt-1.5 w-full p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 text-gray-900 dark:text-white text-xs font-mono outline-none focus:border-[#25D366]"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                  Token
                </label>
                <input
                  type="text"
                  required
                  value={gatewayConfig.token}
                  onChange={(e) => setGatewayConfig({ ...gatewayConfig, token: e.target.value })}
                  placeholder="sxbvzx4j6nmk3ppc"
                  className="mt-1.5 w-full p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 text-gray-900 dark:text-white text-xs font-mono outline-none focus:border-[#25D366]"
                />
              </div>

              {/* Direct Link to UltraMsg */}
              <a
                href="https://user.ultramsg.com/app/instances/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 text-xs text-orange-700 dark:text-orange-400 font-semibold hover:underline"
              >
                <span>Open UltraMsg Instances Dashboard</span>
                <ExternalLink size={13} />
              </a>

              {/* Test Message Box */}
              <div className="pt-2 border-t border-gray-100 dark:border-slate-800 space-y-2">
                <label className="text-xs font-bold text-gray-600 dark:text-slate-300">
                  {isBn ? "পরীক্ষামূলক টেস্ট মেসেজ পাঠান:" : "Send Test Message:"}
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="01994810914"
                    className="flex-1 p-2.5 rounded-xl border border-gray-200 dark:border-slate-800 text-xs font-mono outline-none focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={handleSendTest}
                    disabled={sendingTest}
                    className="px-3.5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {sendingTest ? "..." : (isBn ? "টেস্ট করুন" : "Send Test")}
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="w-full py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition cursor-pointer"
                >
                  {savingConfig ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Broadcast Confirm Modal */}
      {showConfirmBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center mx-auto mb-4">
                <Send size={32} className="ml-1" />
              </div>
              <h3 className="text-xl font-black text-center text-gray-900 dark:text-white mb-2">
                {isBn ? "মেসেজ কনফার্মেশন" : "Confirm Broadcast"}
              </h3>
              <p className="text-center text-gray-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                {isBn 
                  ? (
                    <>
                      আপনি কি নিশ্চিত যে <strong>{filteredCount} জন</strong> ব্যবহারকারীর WhatsApp-এ এই মেসেজটি পাঠাতে চান?
                    </>
                  ) 
                  : (
                    <>
                      Are you sure you want to broadcast this WhatsApp message to <strong>{filteredCount} users</strong>?
                    </>
                  )
                }
              </p>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmBroadcastModal(false)}
                  className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-bold text-sm transition cursor-pointer"
                >
                  {isBn ? "বাতিল করুন" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={executeBroadcast}
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
