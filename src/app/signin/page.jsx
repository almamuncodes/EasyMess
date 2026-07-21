"use client";
import React, { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, Mail, Lock, Loader2, ArrowLeft, ShieldCheck, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import Image from "next/image";
import { trackEvent } from "@/lib/analytics";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/useTranslation";

export default function SigninPage() {
  const router = useRouter();
  const { lang } = useTranslation();
  
  // Localized dictionary matching main language settings
  const t = (key) => {
    const localDict = {
      en: {
        loginTitle: "LOGIN YOUR ACCOUNT",
        emailAddress: "Email Address",
        password: "Password",
        forgotPassword: "Forgot Password?",
        logInButton: "Log In",
        orLogInWith: "Or Log In with",
        logInGoogle: "Log in with Google",
        noAccount: "Don't have an account?",
        signUpLink: "Sign Up",
        verifyEmailTitle: "Verify Email",
        codeSentTo: "Code is sent to",
        verifyButtonSignup: "Verify and Create Account",
        verifyButtonReset: "Verify OTP",
        didNotReceive: "Didn't receive code?",
        requestAgain: "Request again",
        resendCooldownText: "Resend Verification OTP",
        backToLogin: "Back to Login",
        forgotPasswordTitle: "Forgot Password",
        forgotPasswordDesc: "Enter your registered email address to receive a 6-digit OTP code.",
        sendOtp: "Send OTP",
        resetPasswordTitle: "Reset Password",
        resetPasswordDesc: "This will change the password for the account",
        newPasswordPlaceholder: "New Password",
        confirmPasswordPlaceholder: "Confirm Password",
        changePasswordButton: "Change password",
        passwordRequirement: "6 characters minimum, at least 1 uppercase letter and 1 number.",
        alreadyHaveAccount: "Already have an account? Sign in"
      },
      bn: {
        loginTitle: "অ্যাকাউন্টে লগইন করুন",
        emailAddress: "ইমেল ঠিকানা",
        password: "পাসওয়ার্ড",
        forgotPassword: "পাসওয়ার্ড ভুলে গেছেন?",
        logInButton: "লগইন করুন",
        orLogInWith: "অথবা লগইন করুন",
        logInGoogle: "গুগল দিয়ে লগইন করুন",
        noAccount: "কোনো অ্যাকাউন্ট নেই?",
        signUpLink: "রেজিস্টার করুন",
        verifyEmailTitle: "ইমেল ভেরিফিকেশন",
        codeSentTo: "কোডটি পাঠানো হয়েছে",
        verifyButtonSignup: "ভেরিফাই ও অ্যাকাউন্ট সচল করুন",
        verifyButtonReset: "ওটিপি ভেরিফাই করুন",
        didNotReceive: "কোডটি পাননি?",
        requestAgain: "আবার পাঠান",
        resendCooldownText: "ভেরিফিকেশন ওটিপি আবার পাঠান",
        backToLogin: "লগইনে ফিরে যান",
        forgotPasswordTitle: "পাসওয়ার্ড ভুলে গেছেন",
        forgotPasswordDesc: "আপনার রেজিস্টার্ড ইমেলটি লিখুন। পাসওয়ার্ড পরিবর্তন করতে আমরা ওটিপি পাঠাব।",
        sendOtp: "ওটিপি পাঠান",
        resetPasswordTitle: "পাসওয়ার্ড রিসেট করুন",
        resetPasswordDesc: "এটি নিচের অ্যাকাউন্টের পাসওয়ার্ড পরিবর্তন করবে",
        newPasswordPlaceholder: "নতুন পাসওয়ার্ড",
        confirmPasswordPlaceholder: "পাসওয়ার্ড নিশ্চিত করুন",
        changePasswordButton: "পাসওয়ার্ড পরিবর্তন করুন",
        passwordRequirement: "সর্বনিম্ন ৬টি অক্ষর, অন্তত ১টি বড় হাতের অক্ষর এবং ১টি সংখ্যা থাকতে হবে।",
        alreadyHaveAccount: "ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন করুন"
      }
    };
    return localDict[lang]?.[key] || localDict["en"]?.[key] || key;
  };

  const [mode, setMode] = useState("login"); // login | verify-signup | forgot-email | forgot-otp | forgot-reset
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Data states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpArray, setOtpArray] = useState(new Array(6).fill(""));
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Verification / Resend Cooldown
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);

  // Inputs Ref for 6-digit OTP
  const otpRefs = useRef([]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Clean OTP array when switching modes
  useEffect(() => {
    setOtpArray(new Array(6).fill(""));
    setOtpCode("");
  }, [mode]);

  const triggerResendOtp = async (targetEmail, type) => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, type }),
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

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await authClient.signIn.email({
        email: email.trim(),
        password: password,
        rememberMe: true,
        callbackURL: "/",
      });

      if (error) {
        const isUnverified = error.message.toLowerCase().includes("verified") || error.message.toLowerCase().includes("verification");
        if (isUnverified) {
          toast.error(lang === "bn" ? "আপনার Email এখনও Verify করা হয়নি। অনুগ্রহ করে Email Verify করুন।" : "Your email is not verified yet. Please verify your email.");
          setMode("verify-signup");
          triggerResendOtp(email.trim(), "signup");
        } else {
          toast.error(error.message);
        }
        setIsLoading(false);
        return;
      }

      if (data?.user) {
        if (!data.user.emailVerified) {
          await authClient.signOut();
          toast.error(lang === "bn" ? "আপনার Email এখনও Verify করা হয়নি। অনুগ্রহ করে Email Verify করুন।" : "Your email is not verified yet. Please verify your email.");
          setMode("verify-signup");
          triggerResendOtp(email.trim(), "signup");
        } else {
          trackEvent("login", { method: "email" });
          toast.success("Account logged in successfully");
          router.push("/");
        }
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySignupOtp = async (e) => {
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
        setMode("login");
        setOtpCode("");
        setPassword("");
      } else {
        toast.error(data.message || "Invalid OTP");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotEmailSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), type: "reset-password" }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("OTP Sent Successfully");
        setMode("forgot-otp");
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

  const handleVerifyForgotOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otpCode, type: "reset-password" }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("OTP Verified Successfully");
        setMode("forgot-reset");
      } else {
        toast.error(data.message || "Invalid OTP");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/otp/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), newPassword }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("Password Changed Successfully");
        setMode("login");
        setOtpCode("");
        setPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.message || "Failed to reset password");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    trackEvent("login", { method: "google" });
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 p-4 pb-20 md:pb-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 text-gray-800 dark:text-white">
        
        {/* LOGIN MODE */}
        {mode === "login" && (
          <>
            <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6 uppercase tracking-wider">
              {t("loginTitle")}
            </h2>
            <form className="space-y-4" onSubmit={handleLoginSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-750 dark:text-gray-300 mb-1">
                  {t("emailAddress")}
                </label>
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
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-750 dark:text-gray-300">
                    {t("password")}
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode("forgot-email")}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    {t("forgotPassword")}
                  </button>
                </div>
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

              <button
                disabled={isLoading}
                className="w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition disabled:bg-orange-400 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : t("logInButton")}
              </button>
            </form>

            <div className="relative my-6 ">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-900 text-gray-500">{t("orLogInWith")}</span>
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
              <span className="font-medium">{t("logInGoogle")}</span>
            </button>

            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
              {t("noAccount")}{" "}
              <Link href="/signup" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                {t("signUpLink")}
              </Link>
            </p>
          </>
        )}

        {/* VERIFY SIGNUP OTP MODE */}
        {mode === "verify-signup" && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => setMode("login")}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4 cursor-pointer"
            >
              <ArrowLeft size={16} /> {t("backToLogin")}
            </button>
            <ShieldCheck className="mx-auto text-orange-500 mb-2" size={48} />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{t("verifyEmailTitle")}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {t("codeSentTo")} <strong className="text-gray-800 dark:text-gray-200">{email}</strong>
            </p>

            <form onSubmit={handleVerifySignupOtp} className="space-y-6">
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
                  onClick={() => triggerResendOtp(email, "signup")}
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

        {/* FORGOT PASSWORD - EMAIL SUBMIT */}
        {mode === "forgot-email" && (
          <div>
            <button
              onClick={() => setMode("login")}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6 transition cursor-pointer"
            >
              <ArrowLeft size={16} /> {t("backToLogin")}
            </button>
            <h2 className="text-3xl font-extrabold text-gray-850 dark:text-white mb-2 leading-tight">Enter your email</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
              You will receive a 6 digit code for email verification.
            </p>

            <form onSubmit={handleForgotEmailSubmit} className="space-y-4">
              <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 flex items-center gap-3 shadow-inner focus-within:ring-2 focus-within:ring-orange-500 transition-all">
                <Mail className="text-gray-400 shrink-0" size={20} />
                <input
                  type="email"
                  required
                  disabled={isLoading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 w-full text-base font-medium"
                  placeholder="Email address"
                />
              </div>

              <button
                disabled={isLoading}
                className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold hover:bg-orange-600 transition shadow-md text-base mt-6 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : (lang === "bn" ? "চালিয়ে যান →" : "Continue →")}
              </button>
            </form>
          </div>
        )}

        {/* FORGOT PASSWORD - OTP VERIFY */}
        {mode === "forgot-otp" && (
          <div className="text-center">
            <button
              onClick={() => setMode("forgot-email")}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6 transition cursor-pointer text-left"
            >
              <ArrowLeft size={16} /> {t("forgotPasswordTitle")}
            </button>
            <KeyRound className="mx-auto text-orange-500 mb-4" size={48} />
            <h2 className="text-3xl font-extrabold text-gray-850 dark:text-white mb-2 leading-tight">Verify Email</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
              {t("codeSentTo")} <strong className="text-gray-800 dark:text-gray-200 font-bold">{email}</strong>
            </p>

            <form onSubmit={handleVerifyForgotOtp} className="space-y-6">
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
                    className="w-12 h-12 text-center text-xl font-bold bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-gray-900 dark:text-white"
                  />
                ))}
              </div>

              <button
                disabled={isLoading || otpCode.length < 6}
                className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold hover:bg-orange-600 transition shadow-md text-base mt-6 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : t("verifyButtonReset")}
              </button>
            </form>

            <div className="mt-6 flex flex-col items-center gap-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {t("didNotReceive")}{" "}
                <button
                  type="button"
                  disabled={isLoading || resendCooldown > 0}
                  onClick={() => triggerResendOtp(email, "reset-password")}
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

        {/* FORGOT PASSWORD - NEW PASSWORD RESET */}
        {mode === "forgot-reset" && (
          <div className="flex flex-col items-center">
            {/* Styled Logo Title at top centered */}
            <h1 className="text-3xl font-extrabold text-[#031b33] dark:text-orange-500 text-center tracking-tight mb-2">
              EasyMess
            </h1>
            
            <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-1 leading-relaxed">
              {t("resetPasswordDesc")}
            </p>
            <p className="text-gray-800 dark:text-white font-bold text-center text-sm mb-6 truncate max-w-full px-2">
              {email}
            </p>

            <form onSubmit={handleResetPasswordSubmit} className="w-full space-y-4">
              <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 flex items-center gap-3 shadow-inner focus-within:ring-2 focus-within:ring-orange-500 transition-all relative">
                <Lock className="text-gray-400 shrink-0" size={20} />
                <input
                  type={showResetNewPassword ? "text" : "password"}
                  required
                  disabled={isLoading}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-transparent border-none outline-none text-gray-900 dark:text-white w-full text-center font-semibold text-lg pr-8"
                  placeholder={t("newPasswordPlaceholder")}
                />
                <button
                  type="button"
                  onClick={() => setShowResetNewPassword(!showResetNewPassword)}
                  className="absolute right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                >
                  {showResetNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 flex items-center gap-3 shadow-inner focus-within:ring-2 focus-within:ring-orange-500 transition-all relative">
                <Lock className="text-gray-400 shrink-0" size={20} />
                <input
                  type={showResetConfirmPassword ? "text" : "password"}
                  required
                  disabled={isLoading}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-transparent border-none outline-none text-gray-900 dark:text-white w-full text-center font-semibold text-lg pr-8"
                  placeholder={t("confirmPasswordPlaceholder")}
                />
                <button
                  type="button"
                  onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                  className="absolute right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                >
                  {showResetConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-[280px] mx-auto leading-relaxed mt-4">
                {t("passwordRequirement")}
              </p>

              {/* Styled white rounded button matching Image 1 */}
              <button
                disabled={isLoading}
                className="w-full bg-orange-500 text-white py-3.5 rounded-full font-bold hover:bg-orange-600 transition shadow-md text-sm mt-6 cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : t("changePasswordButton")}
              </button>
            </form>
            
            <button
              onClick={() => {
                setMode("login");
                setEmail("");
                setPassword("");
              }}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline mt-6 cursor-pointer"
            >
              {t("alreadyHaveAccount")}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
