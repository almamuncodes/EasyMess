"use client";
import React, { useState } from "react";
import { Eye, EyeOff, User, Mail, Lock, Loader2 } from "lucide-react"; // Loader2 icon added
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";

export default function SignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // New state for loading

  const formhandler = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Start loading

    const formData = new FormData(e.currentTarget);
    const formdata = Object.fromEntries(formData.entries());

    try {
      const { data, error } = await authClient.signIn.email({
        email: formdata.email, // required
        password: formdata.password, // required
        rememberMe: true,
        callbackURL: "/",
      }); 

      if (error) {
        toast.error(error.message);
      } else if (data.user) {
        trackEvent("login", { method: "email" });
        toast.success("Account logged in successfully");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false); // Stop loading regardless of success/error
    }
  };
    // Google Sign In
    const handleGoogleSignIn = async () => {
        trackEvent("login", { method: "google" });
        const data = await authClient.signIn.social({
      provider: "google",
    });
   
  
    }


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          LOGIN YOUR ACCOUNT
        </h2>

        <form className="space-y-4" onSubmit={formhandler}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                name="email"
                type="email"
                required
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                disabled={isLoading}
                className="w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400"
              >
                {showPassword ? <EyeOff className='hover:cursor-pointer' size={18} /> : <Eye className='hover:cursor-pointer' size={18} />}
              </button>
            </div>
          </div>

          <button
            disabled={isLoading}
            className="w-full bg-orange-400 text-white py-2 rounded-lg font-semibold hover:bg-orange-500 transition disabled:bg-orange-400 flex items-center justify-center gap-2 hover:cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              "Sign Up"
            )}
          </button>
        </form>
        <div className="relative my-6 ">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or Sign Up with</span>
          </div>
        </div>

        <button onClick = {handleGoogleSignIn} className="w-full flex items-center justify-center gap-2 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition hover:cursor-pointer">
          <img
            src="https://www.google.com/favicon.ico"
            alt="Google"
            className="w-5 h-5"
          />
          <span className="font-medium text-gray-700">Sign up with Google</span>
        </button>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{" "}
          <Link href="/signup" className="text-blue-600 font-semibold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
