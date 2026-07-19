"use client";

import { useState, useEffect, useRef } from "react";

function useReveal(delay = 0) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);
  return [ref, visible];
}

const plans = {
  en: [
    {
      name: "Free Forever",
      badge: "Current Plan",
      price: "৳0",
      period: "/month",
      highlight: true,
      description: "Everything you need to run a mess — completely free, forever.",
      cta: "Get Started",
      ctaHref: "/signup",
      features: [
        { ok: true, text: "Unlimited members" },
        { ok: true, text: "Daily meal tracking (B + L + D)" },
        { ok: true, text: "Bazaar expense log with items" },
        { ok: true, text: "Deposit management (4 payment methods)" },
        { ok: true, text: "Automatic monthly bill calculation" },
        { ok: true, text: "Notice board with reactions & comments" },
        { ok: true, text: "Real-time notifications (Socket + Push)" },
        { ok: true, text: "PDF monthly report export" },
        { ok: true, text: "Dark mode + Bengali/English" },
        { ok: true, text: "Role-based access (Manager / Member)" },
        { ok: true, text: "Meal deadline settings" },
        { ok: true, text: "Join request approval system" },
      ],
    },
    {
      name: "Pro",
      badge: "Coming Soon",
      price: "৳99",
      period: "/month",
      highlight: false,
      description: "Advanced analytics and Excel export for power users.",
      cta: "Notify Me",
      ctaHref: "#",
      features: [
        { ok: true, text: "Everything in Free" },
        { ok: true, text: "Excel (.xlsx) monthly export" },
        { ok: true, text: "Advanced member analytics" },
        { ok: true, text: "Custom meal rate override" },
        { ok: true, text: "Priority support" },
        { ok: false, text: "Multi-mess management (soon)" },
      ],
    },
  ],
  bn: [
    {
      name: "সম্পূর্ণ বিনামূল্যে",
      badge: "বর্তমান প্ল্যান",
      price: "৳০",
      period: "/মাস",
      highlight: true,
      description: "মেস পরিচালনার জন্য যা দরকার সব — চিরতরে বিনামূল্যে।",
      cta: "শুরু করুন",
      ctaHref: "/signup",
      features: [
        { ok: true, text: "অসীম সদস্য সংখ্যা" },
        { ok: true, text: "প্রতিদিনের মিল ট্র্যাকিং (সকাল + দুপুর + রাত)" },
        { ok: true, text: "আইটেমসহ বাজারের হিসাব" },
        { ok: true, text: "জমা ব্যবস্থাপনা (৪টি পেমেন্ট পদ্ধতি)" },
        { ok: true, text: "স্বয়ংক্রিয় মাসিক বিল হিসাব" },
        { ok: true, text: "রিয়্যাকশন ও মন্তব্যসহ নোটিশ বোর্ড" },
        { ok: true, text: "রিয়েলটাইম নোটিফিকেশন (Socket + Push)" },
        { ok: true, text: "মাসিক PDF রিপোর্ট এক্সপোর্ট" },
        { ok: true, text: "ডার্ক মোড + বাংলা/ইংরেজি" },
        { ok: true, text: "ভূমিকা-ভিত্তিক অ্যাক্সেস (ম্যানেজার / সদস্য)" },
        { ok: true, text: "মিল ডেডলাইন সেটিংস" },
        { ok: true, text: "জয়েন রিকোয়েস্ট অনুমোদন সিস্টেম" },
      ],
    },
    {
      name: "প্রো",
      badge: "শীঘ্রই আসছে",
      price: "৳৯৯",
      period: "/মাস",
      highlight: false,
      description: "পাওয়ার ইউজারদের জন্য উন্নত বিশ্লেষণ ও এক্সেল এক্সপোর্ট।",
      cta: "নোটিফিকেশন পাই",
      ctaHref: "#",
      features: [
        { ok: true, text: "বিনামূল্যের সব সুবিধা" },
        { ok: true, text: "Excel (.xlsx) মাসিক এক্সপোর্ট" },
        { ok: true, text: "উন্নত সদস্য বিশ্লেষণ" },
        { ok: true, text: "কাস্টম মিল রেট পরিবর্তন" },
        { ok: true, text: "অগ্রাধিকার সাপোর্ট" },
        { ok: false, text: "মাল্টি-মেস ম্যানেজমেন্ট (শীঘ্রই)" },
      ],
    },
  ],
};

function PlanCard({ plan, index, lang }) {
  const [ref, visible] = useReveal(index * 120);
  const [hovered, setHovered] = useState(false);
  const isBn = lang === "bn";

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translateY(0) scale(1)"
          : "translateY(40px) scale(0.96)",
        transition: "all 0.65s cubic-bezier(0.22,1,0.36,1)",
      }}
      className={`
        relative flex flex-col rounded-3xl border p-8 shadow-sm
        transition-shadow duration-300
        ${plan.highlight
          ? "border-orange-300 dark:border-orange-700 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20 hover:shadow-xl hover:shadow-orange-100 dark:hover:shadow-orange-900/20"
          : "border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-xl hover:shadow-gray-100 dark:hover:shadow-slate-900/50"
        }
      `}
    >
      {/* Popular badge */}
      {plan.highlight && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1 rounded-full text-xs font-bold bg-orange-500 text-white shadow">
            ⭐ {isBn ? "সবচেয়ে জনপ্রিয়" : "Most Popular"}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className={`text-xl font-black ${plan.highlight ? "text-orange-600 dark:text-orange-400" : "text-gray-900 dark:text-slate-100"}`}>
            {plan.name}
          </h3>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${plan.highlight ? "bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-300" : "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400"}`}>
            {plan.badge}
          </span>
        </div>

        <div className="flex items-baseline gap-1 mb-3">
          <span className={`text-5xl font-black ${plan.highlight ? "text-orange-500" : "text-gray-400 dark:text-slate-500"}`}>
            {plan.price}
          </span>
          <span className="text-sm text-gray-400 dark:text-slate-500">{plan.period}</span>
        </div>

        <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{plan.description}</p>
      </div>

      {/* Features */}
      <ul className="flex flex-col gap-3 mb-8 flex-1">
        {plan.features.map((f) => (
          <li key={f.text} className="flex items-start gap-3">
            <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${f.ok ? "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400" : "bg-gray-100 text-gray-400 dark:bg-slate-800"}`}>
              {f.ok ? "✓" : "–"}
            </span>
            <span className={`text-sm ${f.ok ? "text-gray-700 dark:text-slate-300" : "text-gray-400 dark:text-slate-500"}`}>
              {f.text}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <a
        href={plan.ctaHref}
        style={{
          transform: hovered ? "scale(1.03)" : "scale(1)",
          transition: "transform 0.25s ease",
        }}
        className={`
          block text-center py-3.5 rounded-xl text-sm font-bold
          ${plan.highlight
            ? "bg-[#ff6900] text-white hover:bg-orange-600"
            : "border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800"
          } transition-colors
        `}
      >
        {plan.cta}
      </a>
    </div>
  );
}

function FaqItem({ q, a, delay }) {
  const [ref, visible] = useReveal(delay);
  const [open, setOpen] = useState(false);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "all 0.5s ease",
      }}
      className="border border-gray-100 dark:border-slate-800 rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">{q}</span>
        <span
          style={{
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease",
          }}
          className="text-lg text-orange-500 shrink-0 ml-4"
        >
          +
        </span>
      </button>
      <div
        style={{
          maxHeight: open ? "200px" : "0",
          opacity: open ? 1 : 0,
          transition: "max-height 0.4s ease, opacity 0.3s ease",
          overflow: "hidden",
        }}
      >
        <p className="px-6 pb-5 text-sm text-gray-500 dark:text-slate-400 leading-relaxed bg-white dark:bg-slate-900">
          {a}
        </p>
      </div>
    </div>
  );
}

export default function PricingContent({ lang }) {
  const isBn = lang === "bn";
  const list = plans[isBn ? "bn" : "en"];

  const faqs = isBn
    ? [
        { q: "EasyMess কি সত্যিই বিনামূল্যে?", a: "হ্যাঁ, EasyMess-এর সমস্ত মূল ফিচার সম্পূর্ণ বিনামূল্যে ব্যবহার করা যাবে। কোনো লুকানো চার্জ নেই।" },
        { q: "কতজন সদস্য যোগ করা যাবে?", a: "বর্তমানে কোনো সদস্য সীমা নেই। যত ইচ্ছে সদস্য যোগ করতে পারবেন।" },
        { q: "প্রো প্ল্যান কখন আসবে?", a: "আমরা প্রো ফিচারগুলো নিয়ে কাজ করছি। শীঘ্রই একটি নোটিফিকেশন অপশন চালু হবে।" },
        { q: "ডেটা কি নিরাপদ?", a: "আপনার সমস্ত ডেটা সুরক্ষিতভাবে সংরক্ষিত। আমরা কোনো তৃতীয় পক্ষের সাথে ডেটা শেয়ার করি না।" },
      ]
    : [
        { q: "Is EasyMess really free?", a: "Yes, all core features of EasyMess are completely free to use. No hidden charges." },
        { q: "How many members can I add?", a: "There is currently no member limit. Add as many as you need." },
        { q: "When will the Pro plan launch?", a: "We are working on Pro features. A notification option will be available soon." },
        { q: "Is my data safe?", a: "All your data is stored securely. We do not share your data with any third parties." },
      ];

  const [heroRef, heroVisible] = useReveal(0);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b border-gray-100 dark:border-slate-800">
        <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-96 h-96 bg-orange-200/40 dark:bg-orange-900/10 rounded-full blur-3xl" />
        <div
          ref={heroRef}
          style={{
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.7s ease",
          }}
          className="relative max-w-3xl mx-auto px-6 py-20 sm:py-28 text-center"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300 mb-6 border border-orange-200 dark:border-orange-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            {isBn ? "প্রাইসিং" : "Pricing"}
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-slate-50 leading-tight mb-4">
            {isBn ? (
              <>সরল মূল্য,{" "}<span className="text-orange-500">কোনো চমক নেই</span></>
            ) : (
              <>Simple pricing,{" "}<span className="text-orange-500">no surprises</span></>
            )}
          </h1>
          <p className="text-lg text-gray-500 dark:text-slate-400 max-w-xl mx-auto">
            {isBn
              ? "সমস্ত মূল ফিচার সম্পূর্ণ বিনামূল্যে। Pro প্ল্যানে আরও শক্তিশালী ফিচার আসছে।"
              : "All core features are free forever. More power tools coming in the Pro plan."}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20 space-y-20">
        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {list.map((plan, i) => (
            <PlanCard key={plan.name} plan={plan} index={i} lang={lang} />
          ))}
        </div>

        {/* Free forever banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 to-amber-500 p-10 text-white text-center">
          <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="relative">
            <p className="text-4xl mb-3">🎉</p>
            <h2 className="text-2xl font-black mb-2">
              {isBn ? "চিরতরে বিনামূল্যে" : "Free forever"}
            </h2>
            <p className="text-orange-100 text-sm max-w-md mx-auto mb-6">
              {isBn
                ? "EasyMess আপনার মেসের হিসাব রাখার কাজটি সহজ করতে তৈরি। এর জন্য আপনাকে কোনো টাকা দিতে হবে না।"
                : "EasyMess is built to simplify your mess accounting — and for that, you don't need to pay a single taka."}
            </p>
            <a
              href="/signup"
              className="inline-block px-8 py-3 rounded-xl bg-white text-orange-600 font-bold hover:bg-orange-50 transition-colors"
            >
              {isBn ? "এখনই শুরু করুন" : "Start for free"}
            </a>
          </div>
        </div>

        {/* FAQ */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-2 text-center">
            {isBn ? "সাধারণ প্রশ্নোত্তর" : "FAQ"}
          </p>
          <h2 className="text-2xl font-black text-gray-900 dark:text-slate-100 text-center mb-10">
            {isBn ? "যা জানতে চান" : "Questions & Answers"}
          </h2>
          <div className="max-w-2xl mx-auto flex flex-col gap-3">
            {faqs.map((f, i) => (
              <FaqItem key={f.q} q={f.q} a={f.a} delay={i * 80} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
