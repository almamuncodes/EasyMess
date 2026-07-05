"use client";

import React from "react";
import { UtensilsCrossed, Home, ArrowRight } from "lucide-react";
import Link from "next/link";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-orange-50 dark:bg-neutral-900 px-6 text-center overflow-hidden">
      
      <style>{`
        @keyframes fadeInDown {
          0% { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes bounceSlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulseSlow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        .anim-fade-in-down { animation: fadeInDown 0.6s ease-out both; }
        .anim-fade-in-up { animation: fadeInUp 0.6s ease-out both; }
        .anim-fade-in { animation: fadeIn 0.8s ease-out both; }
        .anim-bounce-slow { animation: bounceSlow 2.5s ease-in-out infinite; }
        .anim-pulse-slow { animation: pulseSlow 3s ease-in-out infinite; }
        .delay-150 { animation-delay: 0.15s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-500 { animation-delay: 0.5s; }
      `}</style>

      {/* 404 with icon */}
      <div className="relative mb-6 anim-fade-in-down">
        <h1 className="text-[120px] md:text-[160px] font-extrabold text-orange-500 leading-none select-none anim-pulse-slow">
          404
        </h1>
        <span className="absolute -top-2 right-0 anim-bounce-slow">
          <UtensilsCrossed size={56} className="text-orange-400" strokeWidth={2} />
        </span>
      </div>

      <h2 className="text-2xl md:text-3xl font-bold text-neutral-800 dark:text-white mb-3 anim-fade-in-up">
        Oops! This page isn't on the menu.
      </h2>

      <p className="text-neutral-500 dark:text-neutral-400 max-w-md mb-8 anim-fade-in-up delay-150">
        The page you're looking for might have been removed or the link is
        broken. Don't worry, let's get you back to something delicious.
      </p>

      <Link
        href="/"
        className="group inline-flex items-center gap-2 bg-orange-500 
                   text-white font-semibold px-6 py-3 rounded-full 
                   shadow-md transition-all duration-300 ease-in-out
                   hover:bg-orange-600 hover:shadow-xl hover:shadow-orange-300/50
                   hover:-translate-y-1 hover:scale-105
                   active:scale-95 active:translate-y-0
                   anim-fade-in-up delay-300"
      >
        <Home
          size={20}
          className="transition-transform duration-300 group-hover:-translate-x-1"
        />
        Back to Home
        <ArrowRight
          size={18}
          className="transition-transform duration-300 group-hover:translate-x-1"
        />
      </Link>

      <div className="mt-10 text-sm text-neutral-400 dark:text-neutral-500 anim-fade-in delay-500">
       EasyMess &copy; {new Date().getFullYear()}. All rights reserved.
      </div>
    </div>
  );
};

export default NotFound;