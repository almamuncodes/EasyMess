"use client";

import { useState, useEffect, useRef } from "react";

// ─── Feature Data ────────────────────────────────────────────────────────────
const features = {
  en: [
    {
      step: "01",
      icon: "🍽️",
      title: "Daily Meal Tracking",
      subtitle: "Breakfast · Lunch · Dinner",
      description:
        "Each member marks their own breakfast, lunch, and dinner daily before the manager-set deadline. No more paper charts — your phone does the work.",
      badge: "Core Feature",
      color: "orange",
    },
    {
      step: "02",
      icon: "🛒",
      title: "Bazaar Expense Log",
      subtitle: "Itemised daily grocery tracking",
      description:
        "Managers log daily bazaar entries with individual items and amounts. History is locked after month-end so your records stay tamper-proof.",
      badge: "Manager",
      color: "green",
    },
    {
      step: "03",
      icon: "💰",
      title: "Deposit Management",
      subtitle: "Cash · bKash · Nagad · Bank",
      description:
        "Track every member's deposits by payment method. The manager can add, edit, or delete entries, with a full history ledger per person.",
      badge: "Manager",
      color: "blue",
    },
    {
      step: "04",
      icon: "📊",
      title: "Automatic Bill Calculation",
      subtitle: "Meal rate × meals eaten = your bill",
      description:
        "EasyMess divides total bazaar cost by total meals consumed each month. Every member's bill, balance, and advance/due status is calculated automatically.",
      badge: "Auto",
      color: "purple",
    },
    {
      step: "05",
      icon: "📋",
      title: "Notice Board",
      subtitle: "Announcements with reactions & comments",
      description:
        "Post notices, pin important ones, and let members react with emojis or comment. Managers can see exactly who has read each notice.",
      badge: "Social",
      color: "pink",
    },
    {
      step: "06",
      icon: "🔔",
      title: "Real-time Notifications",
      subtitle: "Socket.io + Firebase Push",
      description:
        "Instant in-app alerts and push notifications when notices are posted, requests are approved, or payments are added — even when the app is closed.",
      badge: "Live",
      color: "yellow",
    },
    {
      step: "07",
      icon: "👥",
      title: "Role-based Access",
      subtitle: "Manager · Member",
      description:
        "Members see their own meals and bills. Managers get full control over meals, bazaar, deposits, and settings. The manager can change any member's role.",
      badge: "Security",
      color: "teal",
    },
    {
      step: "08",
      icon: "📄",
      title: "PDF Monthly Report",
      subtitle: "Download & share summaries",
      description:
        "Export a full monthly overview as a PDF — including member-wise meals, deposits, bills, and balances — ready to share or print.",
      badge: "Export",
      color: "indigo",
    },
    {
      step: "09",
      icon: "🌐",
      title: "Bilingual Interface",
      subtitle: "বাংলা ও English",
      description:
        "Switch the entire app between Bengali and English with a single tap. The language preference is saved and respected across all sessions.",
      badge: "i18n",
      color: "rose",
    },
    {
      step: "10",
      icon: "🌙",
      title: "Dark Mode",
      subtitle: "Easy on the eyes, day or night",
      description:
        "A fully supported dark mode across every page and dashboard. Your preference is saved so the app always opens in your chosen theme.",
      badge: "UX",
      color: "slate",
    },
    {
      step: "11",
      icon: "📬",
      title: "Join Request System",
      subtitle: "Approve or reject members",
      description:
        "Anyone can request to join your mess with your unique invite code. The manager reviews each request and approves or rejects with one tap.",
      badge: "Access",
      color: "amber",
    },
    {
      step: "12",
      icon: "⚙️",
      title: "Meal Deadline Settings",
      subtitle: "Flexible cutoff times per meal",
      description:
        "Set individual deadlines for breakfast, lunch, and dinner. After the cutoff, members cannot change that meal — keeping the data clean and fair.",
      badge: "Manager",
      color: "cyan",
    },
  ],
  bn: [
    {
      step: "০১",
      icon: "🍽️",
      title: "প্রতিদিনের মিল ট্র্যাকিং",
      subtitle: "সকাল · দুপুর · রাত",
      description:
        "প্রতিটি সদস্য ম্যানেজার-নির্ধারিত ডেডলাইনের আগে নিজের সকাল, দুপুর ও রাতের মিল চিহ্নিত করে নেয়। কাগজের চার্ট আর নয় — সব কাজ করে আপনার ফোন।",
      badge: "মূল ফিচার",
      color: "orange",
    },
    {
      step: "০২",
      icon: "🛒",
      title: "বাজারের হিসাব",
      subtitle: "প্রতিদিনের বাজারের আইটেমওয়াইজ হিসাব",
      description:
        "ম্যানেজার প্রতিদিনের বাজারের এন্ট্রি আইটেম ও পরিমাণ সহ লগ করেন। মাস শেষে রেকর্ড লক হয়ে যায় যাতে ডেটা অপরিবর্তিত থাকে।",
      badge: "ম্যানেজার",
      color: "green",
    },
    {
      step: "০৩",
      icon: "💰",
      title: "জমার হিসাব",
      subtitle: "ক্যাশ · বিকাশ · নগদ · ব্যাংক",
      description:
        "পেমেন্ট পদ্ধতি অনুযায়ী প্রতিটি সদস্যের জমা ট্র্যাক করুন। ম্যানেজার এন্ট্রি যোগ, সম্পাদনা বা মুছতে পারবেন এবং প্রতিজনের পূর্ণ লেজার দেখতে পাবেন।",
      badge: "ম্যানেজার",
      color: "blue",
    },
    {
      step: "০৪",
      icon: "📊",
      title: "স্বয়ংক্রিয় বিল হিসাব",
      subtitle: "মিল রেট × মিল সংখ্যা = আপনার বিল",
      description:
        "EasyMess মাসের মোট বাজার খরচকে মোট মিল দ্বারা ভাগ করে। প্রতিটি সদস্যের বিল, ব্যালেন্স ও অগ্রিম/বাকি স্থিতি স্বয়ংক্রিয়ভাবে হিসাব হয়।",
      badge: "স্বয়ংক্রিয়",
      color: "purple",
    },
    {
      step: "০৫",
      icon: "📋",
      title: "নোটিশ বোর্ড",
      subtitle: "রিয়্যাকশন ও মন্তব্যসহ ঘোষণা",
      description:
        "নোটিশ পোস্ট করুন, গুরুত্বপূর্ণগুলো পিন করুন, সদস্যরা ইমোজি দিয়ে রিয়্যাক্ট বা মন্তব্য করতে পারবেন। ম্যানেজার দেখতে পারবেন কে কে পড়েছে।",
      badge: "সামাজিক",
      color: "pink",
    },
    {
      step: "০৬",
      icon: "🔔",
      title: "রিয়েলটাইম নোটিফিকেশন",
      subtitle: "Socket.io + Firebase Push",
      description:
        "নোটিশ দেওয়া হলে, রিকোয়েস্ট অনুমোদন হলে বা পেমেন্ট যোগ হলে তাৎক্ষণিক ইন-অ্যাপ এবং পুশ নোটিফিকেশন পাবেন — অ্যাপ বন্ধ থাকলেও।",
      badge: "লাইভ",
      color: "yellow",
    },
    {
      step: "০৭",
      icon: "👥",
      title: "ভূমিকা-ভিত্তিক অ্যাক্সেস",
      subtitle: "ম্যানেজার · সদস্য",
      description:
        "সদস্যরা কেবল নিজের মিল ও বিল দেখতে পান। ম্যানেজার মিল, বাজার, জমা ও সেটিংস সম্পূর্ণ নিয়ন্ত্রণ করতে পারেন। যেকোনো সদস্যের ভূমিকা পরিবর্তনও করা যায়।",
      badge: "নিরাপত্তা",
      color: "teal",
    },
    {
      step: "০৮",
      icon: "📄",
      title: "মাসিক PDF রিপোর্ট",
      subtitle: "ডাউনলোড ও শেয়ার করুন",
      description:
        "সদস্যওয়াইজ মিল, জমা, বিল ও ব্যালেন্সসহ পূর্ণ মাসিক ওভারভিউ PDF হিসেবে এক্সপোর্ট করুন — শেয়ার বা প্রিন্টের জন্য প্রস্তুত।",
      badge: "এক্সপোর্ট",
      color: "indigo",
    },
    {
      step: "০৯",
      icon: "🌐",
      title: "দ্বিভাষিক ইন্টারফেস",
      subtitle: "বাংলা ও English",
      description:
        "এক ট্যাপেই পুরো অ্যাপ বাংলা ও ইংরেজিতে বদলে ফেলুন। ভাষার পছন্দ সেভ থাকে এবং সব সেশনে একই থাকে।",
      badge: "i18n",
      color: "rose",
    },
    {
      step: "১০",
      icon: "🌙",
      title: "ডার্ক মোড",
      subtitle: "দিন বা রাত, চোখে আরামদায়ক",
      description:
        "প্রতিটি পেজ ও ড্যাশবোর্ডে পূর্ণ ডার্ক মোড সাপোর্ট। আপনার পছন্দ সেভ হয় তাই অ্যাপ সবসময় আপনার বেছে নেওয়া থিমে খোলে।",
      badge: "UX",
      color: "slate",
    },
    {
      step: "১১",
      icon: "📬",
      title: "জয়েন রিকোয়েস্ট সিস্টেম",
      subtitle: "সদস্য অনুমোদন বা প্রত্যাখ্যান",
      description:
        "যেকেউ আপনার ইনভাইট কোড দিয়ে মেসে জয়েন করার আবেদন করতে পারে। ম্যানেজার প্রতিটি আবেদন পর্যালোচনা করে এক ট্যাপেই অনুমোদন বা বাতিল করতে পারেন।",
      badge: "অ্যাক্সেস",
      color: "amber",
    },
    {
      step: "১২",
      icon: "⚙️",
      title: "মিল ডেডলাইন সেটিংস",
      subtitle: "প্রতিটি মিলের জন্য আলাদা কাটঅফ সময়",
      description:
        "সকাল, দুপুর ও রাতের মিলের জন্য আলাদা ডেডলাইন সেট করুন। কাটঅফ পেরিয়ে গেলে সদস্যরা সেই মিল পরিবর্তন করতে পারবেন না — ডেটা নির্ভুল থাকে।",
      badge: "ম্যানেজার",
      color: "cyan",
    },
  ],
};

const colorMap = {
  orange: {
    bg: "bg-orange-50 dark:bg-orange-950/20",
    border: "border-orange-200 dark:border-orange-800/40",
    icon: "bg-orange-100 dark:bg-orange-900/40",
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
    accent: "text-orange-500",
    glow: "hover:shadow-orange-100 dark:hover:shadow-orange-900/20",
    step: "text-orange-300 dark:text-orange-700",
  },
  green: {
    bg: "bg-green-50 dark:bg-green-950/20",
    border: "border-green-200 dark:border-green-800/40",
    icon: "bg-green-100 dark:bg-green-900/40",
    badge: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
    accent: "text-green-500",
    glow: "hover:shadow-green-100 dark:hover:shadow-green-900/20",
    step: "text-green-300 dark:text-green-700",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-800/40",
    icon: "bg-blue-100 dark:bg-blue-900/40",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    accent: "text-blue-500",
    glow: "hover:shadow-blue-100 dark:hover:shadow-blue-900/20",
    step: "text-blue-300 dark:text-blue-700",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-950/20",
    border: "border-purple-200 dark:border-purple-800/40",
    icon: "bg-purple-100 dark:bg-purple-900/40",
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
    accent: "text-purple-500",
    glow: "hover:shadow-purple-100 dark:hover:shadow-purple-900/20",
    step: "text-purple-300 dark:text-purple-700",
  },
  pink: {
    bg: "bg-pink-50 dark:bg-pink-950/20",
    border: "border-pink-200 dark:border-pink-800/40",
    icon: "bg-pink-100 dark:bg-pink-900/40",
    badge: "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300",
    accent: "text-pink-500",
    glow: "hover:shadow-pink-100 dark:hover:shadow-pink-900/20",
    step: "text-pink-300 dark:text-pink-700",
  },
  yellow: {
    bg: "bg-yellow-50 dark:bg-yellow-950/20",
    border: "border-yellow-200 dark:border-yellow-800/40",
    icon: "bg-yellow-100 dark:bg-yellow-900/40",
    badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
    accent: "text-yellow-500",
    glow: "hover:shadow-yellow-100 dark:hover:shadow-yellow-900/20",
    step: "text-yellow-300 dark:text-yellow-700",
  },
  teal: {
    bg: "bg-teal-50 dark:bg-teal-950/20",
    border: "border-teal-200 dark:border-teal-800/40",
    icon: "bg-teal-100 dark:bg-teal-900/40",
    badge: "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300",
    accent: "text-teal-500",
    glow: "hover:shadow-teal-100 dark:hover:shadow-teal-900/20",
    step: "text-teal-300 dark:text-teal-700",
  },
  indigo: {
    bg: "bg-indigo-50 dark:bg-indigo-950/20",
    border: "border-indigo-200 dark:border-indigo-800/40",
    icon: "bg-indigo-100 dark:bg-indigo-900/40",
    badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
    accent: "text-indigo-500",
    glow: "hover:shadow-indigo-100 dark:hover:shadow-indigo-900/20",
    step: "text-indigo-300 dark:text-indigo-700",
  },
  rose: {
    bg: "bg-rose-50 dark:bg-rose-950/20",
    border: "border-rose-200 dark:border-rose-800/40",
    icon: "bg-rose-100 dark:bg-rose-900/40",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300",
    accent: "text-rose-500",
    glow: "hover:shadow-rose-100 dark:hover:shadow-rose-900/20",
    step: "text-rose-300 dark:text-rose-700",
  },
  slate: {
    bg: "bg-slate-50 dark:bg-slate-900/40",
    border: "border-slate-200 dark:border-slate-700/40",
    icon: "bg-slate-100 dark:bg-slate-800/60",
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    accent: "text-slate-500",
    glow: "hover:shadow-slate-100 dark:hover:shadow-slate-900/20",
    step: "text-slate-300 dark:text-slate-600",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-800/40",
    icon: "bg-amber-100 dark:bg-amber-900/40",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    accent: "text-amber-500",
    glow: "hover:shadow-amber-100 dark:hover:shadow-amber-900/20",
    step: "text-amber-300 dark:text-amber-700",
  },
  cyan: {
    bg: "bg-cyan-50 dark:bg-cyan-950/20",
    border: "border-cyan-200 dark:border-cyan-800/40",
    icon: "bg-cyan-100 dark:bg-cyan-900/40",
    badge: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300",
    accent: "text-cyan-500",
    glow: "hover:shadow-cyan-100 dark:hover:shadow-cyan-900/20",
    step: "text-cyan-300 dark:text-cyan-700",
  },
};

// ─── Intersection Observer hook for scroll-reveal ────────────────────────────
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
}

// ─── Single Feature Card ─────────────────────────────────────────────────────
function FeatureCard({ feature, index }) {
  const [ref, visible] = useReveal();
  const [hovered, setHovered] = useState(false);
  const c = colorMap[feature.color] || colorMap.orange;

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transitionDelay: `${(index % 3) * 60}ms`,
        transform: visible
          ? "translateY(0) scale(1)"
          : "translateY(32px) scale(0.97)",
        opacity: visible ? 1 : 0,
        transition:
          "transform 0.55s cubic-bezier(0.22,1,0.36,1), opacity 0.55s ease",
      }}
      className={`
        relative group flex flex-col gap-4 rounded-2xl border p-6 cursor-default
        bg-white dark:bg-slate-900
        ${c.border}
        shadow-sm hover:shadow-lg ${c.glow}
        transition-shadow duration-300
        overflow-hidden
      `}
    >
      {/* Animated background blob on hover */}
      <div
        style={{
          opacity: hovered ? 0.45 : 0,
          transform: hovered ? "scale(1)" : "scale(0.7)",
          transition: "opacity 0.4s ease, transform 0.5s ease",
        }}
        className={`absolute -top-6 -right-6 w-28 h-28 rounded-full blur-2xl pointer-events-none ${c.icon}`}
      />

      {/* Top row: step number (left) + badge (right) */}
      <div className="flex items-center justify-between">
        <span
          className={`text-2xl font-black tracking-tighter select-none leading-none ${c.step}`}
        >
          {feature.step}
        </span>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c.badge}`}
        >
          {feature.badge}
        </span>
      </div>

      {/* Icon */}
      <div
        style={{
          transform: hovered ? "scale(1.12) rotate(-4deg)" : "scale(1) rotate(0deg)",
          transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        }}
        className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${c.icon} shadow-sm`}
      >
        {feature.icon}
      </div>

      {/* Text */}
      <div className="flex flex-col gap-1.5">
        <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 leading-snug">
          {feature.title}
        </h3>
        <p className={`text-xs font-medium ${c.accent}`}>{feature.subtitle}</p>
        <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed mt-1">
          {feature.description}
        </p>
      </div>

      {/* Bottom line accent */}
      <div
        style={{
          transform: hovered ? "scaleX(1)" : "scaleX(0)",
          transition: "transform 0.4s ease",
          transformOrigin: "left",
        }}
        className={`absolute bottom-0 left-0 right-0 h-0.5 ${c.icon}`}
      />
    </div>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
function HeroSection({ lang }) {
  const isBn = lang === "bn";

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b border-gray-100 dark:border-slate-800">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 bg-orange-200/30 dark:bg-orange-900/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-10 right-0 w-64 h-64 bg-amber-200/30 dark:bg-amber-900/10 rounded-full blur-3xl" />

      <div className="relative max-w-5xl mx-auto px-6 py-20 sm:py-28 text-center">
        {/* Tag */}
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300 mb-6 border border-orange-200 dark:border-orange-800/50">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
          {isBn ? "EasyMess প্ল্যাটফর্ম" : "EasyMess Platform"}
        </span>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 dark:text-slate-50 leading-tight tracking-tight mb-5">
          {isBn ? (
            <>
              মেস পরিচালনা{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">
                এখন সহজ
              </span>
            </>
          ) : (
            <>
              Everything you need to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">
                run your mess
              </span>
            </>
          )}
        </h1>

        <p className="max-w-2xl mx-auto text-lg text-gray-500 dark:text-slate-400 leading-relaxed mb-10">
          {isBn
            ? "মিল ট্র্যাকিং থেকে শুরু করে স্বয়ংক্রিয় বিল হিসাব — EasyMess-এর ১২টি শক্তিশালী ফিচার আপনার মেস পরিচালনাকে সম্পূর্ণ ডিজিটাল করে তোলে।"
            : "From daily meal tracking to automatic billing — 12 powerful features that turn your mess into a well-run, paperless operation."}
        </p>

        {/* Stats row */}
        <div className="flex flex-wrap justify-center gap-8">
          {[
            { num: "12", label: isBn ? "ফিচার" : "Features" },
            { num: "3", label: isBn ? "মিল/দিন" : "Meals/day" },
            { num: "∞", label: isBn ? "সদস্য" : "Members" },
            { num: "100%", label: isBn ? "স্বয়ংক্রিয়" : "Automated" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-black text-orange-500">{s.num}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 font-medium">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function FeaturesContent({ lang }) {
  const isBn = lang === "bn";
  const list = features[isBn ? "bn" : "en"];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <HeroSection lang={lang} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        {/* Section label */}
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-2">
            {isBn ? "সব ফিচার" : "All Features"}
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-slate-100">
            {isBn
              ? "প্রতিটি ফিচার বিস্তারিত"
              : "Every feature, explained"}
          </h2>
          <p className="text-gray-500 dark:text-slate-400 mt-2 text-sm max-w-xl mx-auto">
            {isBn
              ? "EasyMess-এর প্রতিটি ফিচার আপনার মেস-জীবনকে সহজ ও ঝামেলামুক্ত করতে তৈরি।"
              : "Each feature of EasyMess is designed to make mess life simpler and stress-free."}
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {list.map((feature, i) => (
            <FeatureCard key={feature.step} feature={feature} index={i} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center">
          <div className="inline-block bg-gradient-to-br from-orange-50 to-amber-50 dark:from-slate-900 dark:to-slate-800 rounded-3xl border border-orange-100 dark:border-slate-700 px-10 py-10 max-w-xl mx-auto">
            <p className="text-3xl mb-3">🚀</p>
            <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">
              {isBn ? "আজই শুরু করুন" : "Get started today"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
              {isBn
                ? "একটি মেস তৈরি করুন অথবা ইনভাইট কোড দিয়ে জয়েন করুন।"
                : "Create a mess or join one with an invite code. Free to use."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/signup"
                className="px-6 py-2.5 rounded-xl bg-[#ff6900] text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
              >
                {isBn ? "একাউন্ট তৈরি করুন" : "Create Account"}
              </a>
              <a
                href="/"
                className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                {isBn ? "হোমে ফিরুন" : "Back to Home"}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
