"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Wrench, Mail, Phone, ExternalLink } from "lucide-react";

export default function MaintenancePage() {
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState(null);
  const [dots, setDots] = useState(".");

  useEffect(() => {
    Promise.resolve().then(() => {
      setMounted(true);
    });

    // Animated dots
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "." : prev + "."));
    }, 600);

    // Fetch contact info from settings
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/system/settings`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) setSettings(data.data);
      })
      .catch(() => {});

    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0F1117] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-orange-600/8 blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
        {/* Animated icon */}
        <div className="flex justify-center">
          <div className="relative w-28 h-28">
            {/* Pulsing ring */}
            <span className="absolute inset-0 rounded-full bg-orange-500/20 animate-ping" />
            <span className="absolute inset-2 rounded-full bg-orange-500/15 animate-ping [animation-delay:200ms]" />
            <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-orange-500/30 to-orange-700/20 border border-orange-500/30 flex items-center justify-center shadow-xl shadow-orange-500/10">
              <Wrench className="w-12 h-12 text-orange-400" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/25 text-orange-400 text-xs font-semibold uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            রক্ষণাবেক্ষণ চলছে
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            সিস্টেম আপগ্রেড হচ্ছে
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-sm mx-auto">
            আমরা আপনার অভিজ্ঞতা আরও উন্নত করার জন্য কাজ করছি। অল্প সময়ের মধ্যে আমরা আবার চালু হব{dots}
          </p>
        </div>

        {/* Progress bar decoration */}
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"
            style={{
              width: "70%",
              animation: "progressAnim 3s ease-in-out infinite",
            }}
          />
        </div>

        {/* Contact info card */}
        {settings && (
          <div className="bg-slate-900/60 backdrop-blur border border-slate-700/50 rounded-2xl p-5 space-y-3 text-left">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              যোগাযোগ করুন
            </p>
            <div className="space-y-2.5">
              {settings.helplineNumber && (
                <a
                  href={`tel:${settings.helplineNumber}`}
                  className="flex items-center gap-3 text-slate-300 hover:text-orange-400 transition text-sm group"
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition">
                    <Phone size={14} className="text-orange-400" />
                  </div>
                  <span>{settings.helplineNumber}</span>
                </a>
              )}
              {settings.supportEmail && (
                <a
                  href={`mailto:${settings.supportEmail}`}
                  className="flex items-center gap-3 text-slate-300 hover:text-orange-400 transition text-sm group"
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition">
                    <Mail size={14} className="text-orange-400" />
                  </div>
                  <span>{settings.supportEmail}</span>
                </a>
              )}
              {settings.fbGroupUrl && (
                <a
                  href={settings.fbGroupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-slate-300 hover:text-orange-400 transition text-sm group"
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition">
                    <ExternalLink size={14} className="text-orange-400" />
                  </div>
                  <span>Facebook গ্রুপে যোগ দিন</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Admin login link */}
        <div className="pt-2">
          <Link
            href="/signin"
            className="text-xs text-slate-600 hover:text-slate-400 transition underline underline-offset-4"
          >
            Admin Login →
          </Link>
        </div>

        {/* Footer branding */}
        <p className="text-xs text-slate-700">
          © {new Date().getFullYear()} {settings?.appName || "EasyMess"} · সকল অধিকার সংরক্ষিত
        </p>
      </div>

      <style>{`
        @keyframes progressAnim {
          0%   { width: 30%; }
          50%  { width: 85%; }
          100% { width: 30%; }
        }
      `}</style>
    </div>
  );
}
