'use client';
import React, { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, User, Mail, Lock, Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { useTranslation } from "@/lib/useTranslation";

export default function SignupForm() {
  const router = useRouter();
  const { lang } = useTranslation();

  // Localized dictionary matching main language settings
  const t = (key) => {
    const localDict = {
      en: {
        createAccount: "CREATE YOUR ACCOUNT",
        fullName: "Full Name",
        emailAddress: "Email Address",
        password: "Password",
        confirmPassword: "Confirm Password",
        signUpButton: "Sign Up",
        orSignUpWith: "Or Sign Up with",
        signUpGoogle: "Sign up with Google",
        alreadyAccount: "Already have an account?",
        logInLink: "Log In",
        verifyEmailTitle: "Verify Email",
        codeSentTo: "Code is sent to",
        verifyButtonSignup: "Verify and Create Account",
        didNotReceive: "Didn't receive code?",
        requestAgain: "Request again",
        backToSignup: "Back to Sign Up"
      },
      bn: {
        createAccount: "নতুন অ্যাকাউন্ট তৈরি করুন",
        fullName: "আপনার নাম",
        emailAddress: "ইমেল ঠিকানা",
        password: "পাসওয়ার্ড",
        confirmPassword: "পাসওয়ার্ড নিশ্চিত করুন",
        signUpButton: "রেজিস্টার করুন",
        orSignUpWith: "অথবা সাইনআপ করুন",
        signUpGoogle: "গুগল দিয়ে সাইনআপ করুন",
        alreadyAccount: "ইতিমধ্যে অ্যাকাউন্ট আছে?",
        logInLink: "লগইন করুন",
        verifyEmailTitle: "ইমেল ভেরিফিকেশন",
        codeSentTo: "কোডটি পাঠানো হয়েছে",
        verifyButtonSignup: "ভেরিফাই ও অ্যাকাউন্ট সচল করুন",
        didNotReceive: "কোডটি পাননি?",
        requestAgain: "আবার পাঠান",
        backToSignup: "সাইনআপে ফিরে যান"
      }
    };
    return localDict[lang]?.[key] || localDict["en"]?.[key] || key;
  };

  const [mode, setMode] = useState("signup"); // signup | verify
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Data states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpArray, setOtpArray] = useState(new Array(6).fill(""));
  const [otpCode, setOtpCode] = useState("");
  
  // Cooldown state
  const [resendCooldown, setResendCooldown] = useState(0);

  // Inputs Ref for 6-digit OTP
  const otpRefs = useRef([]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Clean OTP when switching modes
  useEffect(() => {
    setOtpArray(new Array(6).fill(""));
    setOtpCode("");
  }, [mode]);

  const triggerSendOtp = async (targetEmail) => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, type: "signup" }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("OTP Sent Successfully");
        setResendCooldown(60);
      } else {
        toast.error(data.message || "Failed to send OTP");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const formhandler = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim(),
        password: password,
        image: 'https://i.pravatar.cc/300?img=50',
        role: "member"
      });

      if (error) {
        toast.error(error.message);
      } else if (data?.user) {
        trackEvent("sign_up", { method: "email" });
        await authClient.signOut();
        
        setMode("verify");
        await triggerSendOtp(email.trim());
        toast.success(lang === "bn" ? "অ্যাকাউন্ট তৈরি হয়েছে। অনুগ্রহ করে ওটিপি দিয়ে ভেরিফাই করুন।" : "Account created successfully. Please verify your email.");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otpCode, type: "signup" }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("Verification Successful");
        router.push("/signin");
      } else {
        toast.error(data.message || "Invalid OTP");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    trackEvent("sign_up", { method: "google" });
    await authClient.signIn.social({
      provider: "google",
    });
  };

  // 6-digit OTP Handlers
  const handleOtpChange = (val, index) => {
    if (isNaN(val)) return;
    const newOtp = [...otpArray];
    newOtp[index] = val;
    setOtpArray(newOtp);
    setOtpCode(newOtp.join(""));

    // Focus next input box
    if (val !== "" && index < 5) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (otpArray[index] === "" && index > 0) {
        otpRefs.current[index - 1].focus();
      }
    }
  };

  const handleOtpPaste = (e) => {
    const pasteData = e.clipboardData.getData("text").trim();
    if (pasteData.length === 6 && /^\d+$/.test(pasteData)) {
      const newOtp = pasteData.split("");
      setOtpArray(newOtp);
      setOtpCode(pasteData);
      otpRefs.current[5].focus();
    }
    e.preventDefault();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-955 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
        
        {/* SIGN UP FORM MODE */}
        {mode === "signup" && (
          <>
            <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6 uppercase tracking-wider">
              {t("createAccount")}
            </h2>

            <form className="space-y-4" onSubmit={formhandler}>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("fullName")}</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    type="text"
                    required
                    disabled={isLoading}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white outline-none"
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("emailAddress")}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    type="email"
                    required
                    disabled={isLoading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white outline-none"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("password")}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={isLoading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("confirmPassword")}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    disabled={isLoading}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button 
                disabled={isLoading} 
                className="w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition disabled:bg-orange-400 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : t("signUpButton")}
              </button>
            </form>

            <div className="relative my-6 ">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-900 text-gray-500">{t("orSignUpWith")}</span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 border border-gray-300 dark:border-slate-700 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition cursor-pointer dark:text-white"
            >
              <Image
                src="https://www.google.com/favicon.ico"
                alt="Google"
                width={20}
                height={20}
                className="w-5 h-5"
              />
              <span className="font-medium">{t("signUpGoogle")}</span>
            </button>

            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
              {t("alreadyAccount")}{" "}
              <Link href="/signin" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                {t("logInLink")}
              </Link>
            </p>
          </>
        )}

        {/* VERIFICATION CODE MODE */}
        {mode === "verify" && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => setMode("signup")}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4 cursor-pointer"
            >
              <ArrowLeft size={16} /> {t("backToSignup")}
            </button>
            <ShieldCheck className="mx-auto text-orange-500 mb-2" size={48} />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{t("verifyEmailTitle")}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {t("codeSentTo")} <strong className="text-gray-800 dark:text-gray-200">{email}</strong>
            </p>

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {/* 6 Individual Square Boxes */}
              <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                {otpArray.map((digit, idx) => (
                  <input
                    key={idx}
                    type="text"
                    maxLength={1}
                    value={digit}
                    ref={(el) => (otpRefs.current[idx] = el)}
                    onChange={(e) => handleOtpChange(e.target.value, idx)}
                    onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                    disabled={isLoading}
                    className="w-12 h-12 text-center text-xl font-bold bg-[#f4f3f0] dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all dark:text-white"
                  />
                ))}
              </div>

              <button
                disabled={isLoading || otpCode.length < 6}
                className="w-full bg-[#f9c23c] hover:bg-[#e2af30] dark:bg-orange-500 text-black dark:text-white py-3.5 rounded-xl font-bold transition shadow-sm text-sm mt-6 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : t("verifyButtonSignup")}
              </button>
            </form>

            <div className="mt-6 flex flex-col items-center gap-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {t("didNotReceive")}{" "}
                <button
                  type="button"
                  disabled={isLoading || resendCooldown > 0}
                  onClick={() => triggerSendOtp(email)}
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline disabled:text-gray-400 cursor-pointer"
                >
                  {resendCooldown > 0
                    ? `${t("requestAgain")} (${resendCooldown}s)`
                    : t("requestAgain")}
                </button>
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}