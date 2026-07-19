"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

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

function StatCard({ number, label, delay }) {
  const [ref, visible] = useReveal(delay);
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "all 0.6s ease",
      }}
      className="text-center"
    >
      <p className="text-4xl font-black text-orange-500">{number}</p>
      <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 font-medium">{label}</p>
    </div>
  );
}

function TeamCard({ member, delay }) {
  const [ref, visible] = useReveal(delay);
  const [hovered, setHovered] = useState(false);

  return (
    <a
      ref={ref}
      href={member.link}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.95)",
        transition: "all 0.6s cubic-bezier(0.22,1,0.36,1)",
        textDecoration: "none",
      }}
      className="flex flex-col items-center text-center p-8 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-2xl hover:border-orange-200 dark:hover:border-orange-700 transition-all duration-300 cursor-pointer group"
    >
      {/* Profile Image */}
      <div
        style={{
          transform: hovered ? "scale(1.08)" : "scale(1)",
          transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        }}
        className="relative w-24 h-24 rounded-full mb-5 shadow-lg ring-4 ring-orange-100 dark:ring-orange-900/50 group-hover:ring-orange-300 dark:group-hover:ring-orange-600 transition-all duration-300 overflow-hidden"
      >
        <Image
          src={member.image}
          alt={member.name}
          fill
          sizes="96px"
          className="object-cover"
          unoptimized
        />
      </div>

      <h3 className="font-bold text-gray-900 dark:text-slate-100 text-lg group-hover:text-orange-500 transition-colors duration-200">
        {member.name}
      </h3>
      <p className="text-xs font-semibold text-orange-500 mt-1">{member.role}</p>
      <p className="text-sm text-gray-500 dark:text-slate-400 mt-3 leading-relaxed">{member.bio}</p>

      {/* Facebook link hint */}
      <div
        style={{
          opacity: hovered ? 1 : 0,
          transform: hovered ? "translateY(0)" : "translateY(6px)",
          transition: "all 0.25s ease",
        }}
        className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[#1877F2]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#1877F2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        View Facebook Profile
      </div>
    </a>
  );
}

function TimelineItem({ item, index }) {
  const [ref, visible] = useReveal(index * 100);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-24px)",
        transition: "all 0.55s ease",
      }}
      className="flex gap-5 items-start"
    >
      {/* Line + dot */}
      <div className="flex flex-col items-center">
        <div
          style={{
            transform: hovered ? "scale(1.3)" : "scale(1)",
            transition: "transform 0.3s ease",
          }}
          className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/40 border-2 border-orange-300 dark:border-orange-700 flex items-center justify-center text-lg shrink-0"
        >
          {item.icon}
        </div>
        {index < 3 && (
          <div className="w-0.5 h-12 bg-gradient-to-b from-orange-200 to-transparent dark:from-orange-800 mt-1" />
        )}
      </div>

      {/* Content */}
      <div className="pb-8">
        <span className="text-xs font-semibold text-orange-500 uppercase tracking-wider">{item.date}</span>
        <h4 className="font-bold text-gray-900 dark:text-slate-100 mt-1 text-base">{item.title}</h4>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
      </div>
    </div>
  );
}

export default function AboutContent({ lang }) {
  const isBn = lang === "bn";

  const stats = isBn
    ? [
        { number: "2025", label: "প্রতিষ্ঠার বছর" },
        { number: "12+", label: "সক্রিয় ফিচার" },
        { number: "∞", label: "সম্ভাবনা" },
        { number: "100%", label: "বিনামূল্যে" },
      ]
    : [
        { number: "2025", label: "Founded" },
        { number: "12+", label: "Active features" },
        { number: "∞", label: "Potential" },
        { number: "100%", label: "Free to use" },
      ];

  const PROFILE_IMAGE = "https://res.cloudinary.com/mxsd2pov/image/upload/f_auto,q_auto/IMG_0398_rficpl";
  const FACEBOOK_LINK = "https://www.facebook.com/mdalmamun.islam.7564";

  const team = [
    {
      image: PROFILE_IMAGE,
      link: FACEBOOK_LINK,
      name: "Md Al-Mamun",
      role: "Founder & Full-stack Developer",
      bio: isBn
        ? "মেস জীবনের বাস্তব অভিজ্ঞতা থেকে EasyMess-এর জন্ম দেন। Next.js, Node.js, Express ও MongoDB-তে দক্ষ।"
        : "Built EasyMess from real-life mess experiences. Proficient in Next.js, Node.js, Express, and MongoDB.",
    },
  ];

  const timeline = isBn
    ? [
        {
          icon: "💡",
          date: "২০২৫ — ধারণা",
          title: "EasyMess-এর ভাবনা",
          desc: "মেসে থাকার সময় প্রতিদিনের মিল, বাজারের হিসাব এবং মাস শেষে বিল নিয়ে বারবার সমস্যার সম্মুখীন হওয়ার পর একটি সহজ সমাধান তৈরির চিন্তা থেকে EasyMess-এর ধারণার জন্ম হয়।",
        },
        {
          icon: "🛠️",
          date: "২০২৫ — ডেভেলপমেন্ট",
          title: "উন্নয়নের শুরু",
          desc: "Next.js, Node.js, Express এবং MongoDB ব্যবহার করে EasyMess-এর মূল ফিচার যেমন Meal Tracking, Bazaar Management, Monthly Billing এবং Member Management তৈরি করা শুরু হয়।",
        },
        {
          icon: "🚀",
          date: "২০২৬ — প্রথম রিলিজ",
          title: "প্রথম পাবলিক সংস্করণ",
          desc: "Authentication, Real-time Notification, Notice Board, PDF/Excel Export এবং Multi-language Support যুক্ত করে EasyMess-এর প্রথম পূর্ণাঙ্গ সংস্করণ প্রকাশ করা হয়।",
        },
        {
          icon: "🌱",
          date: "বর্তমান",
          title: "নিরন্তর উন্নয়ন",
          desc: "ব্যবহারকারীদের মতামতের ভিত্তিতে নতুন ফিচার, পারফরম্যান্স উন্নয়ন এবং আরও স্মার্ট মেস ম্যানেজমেন্ট অভিজ্ঞতা তৈরির কাজ চলমান রয়েছে।",
        },
      ]
    : [
        {
          icon: "💡",
          date: "2025 — Idea",
          title: "The idea was born",
          desc: "After repeatedly struggling with daily meal tracking, bazaar accounting, and end-of-month billing while living in a mess, the idea for a simple digital solution was born.",
        },
        {
          icon: "🛠️",
          date: "2025 — Development",
          title: "Development begins",
          desc: "Built core features — Meal Tracking, Bazaar Management, Monthly Billing, and Member Management — using Next.js, Node.js, Express, and MongoDB.",
        },
        {
          icon: "🚀",
          date: "2026 — First Release",
          title: "First public version",
          desc: "The first full version shipped with Authentication, Real-time Notifications, Notice Board, PDF/Excel Export, and Multi-language Support.",
        },
        {
          icon: "🌱",
          date: "Present",
          title: "Continuous improvement",
          desc: "Based on user feedback, new features, performance improvements, and smarter mess management experiences are continuously being developed.",
        },
      ];

  const [heroRef, heroVisible] = useReveal(0);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950 text-white">
        <div className="pointer-events-none absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
        <div
          ref={heroRef}
          style={{
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.7s ease",
          }}
          className="relative max-w-4xl mx-auto px-6 py-24 sm:py-32 text-center"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-white/10 border border-white/20 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            {isBn ? "আমাদের সম্পর্কে" : "About EasyMess"}
          </span>
          <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-5">
            {isBn ? (
              <>মেস জীবনকে{" "}<span className="text-orange-400">সহজ করতে</span> তৈরি</>
            ) : (
              <>Built to make{" "}<span className="text-orange-400">mess life easier</span></>
            )}
          </h1>
          <p className="max-w-xl mx-auto text-lg text-slate-300 leading-relaxed">
            {isBn
              ? "EasyMess হলো বাংলাদেশের হোস্টেল, ব্যাচেলর মেস ও শেয়ার্ড অ্যাপার্টমেন্টের জন্য তৈরি একটি স্মার্ট মেস ম্যানেজমেন্ট প্ল্যাটফর্ম।"
              : "EasyMess is a smart mess management platform built for hostels, bachelor messes, and shared apartments across Bangladesh."}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16 sm:py-20 space-y-20">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <StatCard key={s.label} number={s.number} label={s.label} delay={i * 80} />
          ))}
        </div>

        {/* Mission */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-2">
              {isBn ? "আমাদের লক্ষ্য" : "Our Mission"}
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-slate-100 mb-4 leading-snug">
              {isBn
                ? "হিসাবের ঝামেলা দূর করা, মেসে শান্তি আনা"
                : "Eliminate the hassle, bring peace to the mess"}
            </h2>
            <p className="text-gray-500 dark:text-slate-400 leading-relaxed text-sm">
              {isBn
                ? "প্রতি মাসে কে কত মিল খেয়েছে, বাজারে কত টাকা গেছে, কে কত জমা দিয়েছে — এই সব হিসাব হাতে করতে গিয়ে ভুল ও ঝগড়া হয়। EasyMess সবকিছু স্বয়ংক্রিয় করে দেয় যাতে আপনি শুধু মেস উপভোগ করতে পারেন।"
                : "Monthly meals eaten, bazaar spent, deposits made — manual calculations cause mistakes and arguments. EasyMess automates everything so you can just enjoy your mess."}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: "🎯", text: isBn ? "নির্ভুল হিসাব" : "Accurate accounting" },
              { icon: "⚡", text: isBn ? "তাৎক্ষণিক আপডেট" : "Instant updates" },
              { icon: "🤝", text: isBn ? "সবার জন্য স্বচ্ছতা" : "Full transparency" },
              { icon: "📱", text: isBn ? "যেকোনো ডিভাইসে" : "Any device, anywhere" },
            ].map((item, i) => (
              <div
                key={item.text}
                className="flex items-center gap-3 p-4 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-2">
            {isBn ? "যাত্রার গল্প" : "Our Journey"}
          </p>
          <h2 className="text-2xl font-black text-gray-900 dark:text-slate-100 mb-10">
            {isBn ? "কীভাবে EasyMess তৈরি হলো" : "How EasyMess was built"}
          </h2>
          <div className="max-w-lg">
            {timeline.map((item, i) => (
              <TimelineItem key={item.title} item={item} index={i} />
            ))}
          </div>
        </div>

        {/* Team */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-2">
            {isBn ? "টিম" : "Team"}
          </p>
          <h2 className="text-2xl font-black text-gray-900 dark:text-slate-100 mb-8">
            {isBn ? "যিনি বানিয়েছেন" : "Who built it"}
          </h2>
          <div className="max-w-sm">
            {team.map((m, i) => (
              <TeamCard key={m.name} member={m} delay={i * 100} />
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center border-t border-gray-100 dark:border-slate-800 pt-16">
          <p className="text-2xl font-black text-gray-900 dark:text-slate-100 mb-3">
            {isBn ? "আজই শুরু করুন 🚀" : "Ready to get started? 🚀"}
          </p>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-8">
            {isBn
              ? "সম্পূর্ণ বিনামূল্যে — কোনো ক্রেডিট কার্ড লাগবে না।"
              : "Completely free — no credit card required."}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="/signup"
              className="px-7 py-3 rounded-xl bg-[#ff6900] text-white font-semibold hover:bg-orange-600 transition-colors"
            >
              {isBn ? "একাউন্ট তৈরি করুন" : "Create Account"}
            </a>
            <a
              href="/features"
              className="px-7 py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              {isBn ? "ফিচার দেখুন" : "See Features"}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
