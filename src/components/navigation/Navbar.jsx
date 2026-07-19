"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, Sun, Moon, Bell } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { useTheme } from "next-themes";

import { useTranslation } from "@/lib/useTranslation";
import { useSocket } from "@/components/providers/SocketProvider";

export default function Navbar() {
  const { t } = useTranslation();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profileRef = useRef(null);
  const notificationRef = useRef(null);
  const mobileNotificationRef = useRef(null);

  const { notifications, unreadCount, markAllAsRead, markAsRead, deleteNotification, clearAllNotifications } = useSocket();

  const { data: session, isPending } = authClient.useSession();
  const isLoggedIn = !!session;

  const pathname = usePathname();

  const publicMenu = [
    { name: t("home"), href: "/" },
    { name: t("features"), href: "/features" },
    { name: t("pricing"), href: "/pricing" },
    { name: t("about"), href: "/about" },
  ];

  const loggedInMenu = [
    { name: t("home"), href: "/" },
    { name: t("notice"), href: "/notice" },
    { name: t("dashboard"), href: "/dashboard" },
  ];

  const navLinks = isLoggedIn ? loggedInMenu : publicMenu;

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target) &&
        (!mobileNotificationRef.current || !mobileNotificationRef.current.contains(e.target))
      ) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Navbar shadow on scroll
  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 4);
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [lang, setLang] = useState("en");
  const { theme, setTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);

  useEffect(() => {
    setThemeMounted(true);
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("lang") || "en";
      setLang(savedLang);
    }
  }, []);

  const toggleLanguage = () => {
    const newLang = lang === "en" ? "bn" : "en";
    setLang(newLang);
    localStorage.setItem("lang", newLang);
    document.cookie = `lang=${newLang}; path=/; max-age=31536000`;
    toast.success(newLang === "en" ? "Language switched to English" : "ভাষা বাংলায় পরিবর্তন করা হয়েছে");
    window.dispatchEvent(new Event("languageChange"));
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  return (
    <nav
      className={`w-full bg-white dark:bg-slate-900 sticky top-0 z-50 transition-shadow duration-200 ${
        scrolled ? "shadow-md border-b border-transparent dark:border-slate-800" : "border-b dark:border-slate-800"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center shrink-0">
          <Image
            src="/image/easymess.png"
            alt="EasyMess"
            width={150}
            height={40}
            className="dark:brightness-0 dark:invert transition-all duration-200"
          />
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`
      transition font-medium
      ${
        pathname === item.href
          ? "text-orange-500 border-b-2 border-orange-500 "
          : "text-gray-700 hover:text-orange-500"
      }
    `}
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-4">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center justify-center p-2 rounded-full border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 hover:border-orange-500 dark:hover:border-orange-400 hover:bg-orange-50/50 dark:hover:bg-slate-800 transition-all shadow-sm hover:cursor-pointer"
            aria-label="Toggle Theme"
          >
            {themeMounted && (theme === "dark" ? (
              <Sun size={16} className="text-orange-400" />
            ) : (
              <Moon size={16} className="text-slate-700" />
            ))}
            {!themeMounted && <div className="w-4 h-4" />}
          </button>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-gray-200 dark:border-slate-700 hover:border-orange-500 dark:hover:border-orange-400 hover:bg-orange-50/50 dark:hover:bg-slate-800 transition-all font-semibold text-xs tracking-wider shadow-sm text-gray-700 dark:text-gray-200 hover:text-orange-600 dark:hover:text-orange-400 hover:cursor-pointer mr-2"
          >
            {lang === "en" ? (
              <>
                <span className="text-sm">🇬🇧</span>
                <span>EN</span>
              </>
            ) : (
              <>
                <span className="text-sm">🇧🇩</span>
                <span>BD</span>
              </>
            )}
          </button>

          {!isPending && (
            <>
              {!isLoggedIn ? (
                <Link
                  href="/signin"
                  className="px-5 py-2 rounded-full bg-orange-500 text-white font-medium"
                >
                  {t("login")}
                </Link>
              ) : (
                <>
                  {/* Notification Bell Dropdown */}
                  <div className="relative mr-2" ref={notificationRef}>
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="relative p-2 rounded-full border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 hover:border-orange-500 dark:hover:border-orange-400 hover:bg-orange-50/50 dark:hover:bg-slate-800 transition-all shadow-sm hover:cursor-pointer flex items-center justify-center"
                      aria-label="Notifications"
                    >
                      <Bell size={16} />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                    {showNotifications && (
                      <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden z-50">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
                          <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200">{t("notifications")}</h3>
                          <div className="flex items-center gap-3">
                            {unreadCount > 0 && (
                              <button
                                onClick={() => {
                                  markAllAsRead();
                                }}
                                className="text-xs font-semibold text-orange-500 hover:text-orange-655 dark:hover:text-orange-400 transition hover:cursor-pointer bg-transparent border-0"
                              >
                                {t("markAllAsRead")}
                              </button>
                            )}
                            {notifications.length > 0 && (
                              <button
                                onClick={() => {
                                  clearAllNotifications();
                                }}
                                className="text-xs font-semibold text-red-500 hover:text-red-600 dark:hover:text-red-400 transition hover:cursor-pointer bg-transparent border-0"
                              >
                                {lang === "bn" ? "সব মুছুন" : "Clear All"}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="max-h-72 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
                              {t("noNotifications")}
                            </div>
                          ) : (
                            notifications.map((notif) => (
                              <div
                                key={notif._id}
                                className={`group px-4 py-3 hover:bg-orange-50/30 dark:hover:bg-slate-700/30 transition border-b border-gray-55 dark:border-slate-700/50 cursor-pointer flex gap-3 relative ${
                                  !notif.isRead ? "bg-orange-50/10 dark:bg-orange-500/5" : ""
                                }`}
                              >
                                <div
                                  onClick={async () => {
                                    if (!notif.isRead) {
                                      await markAsRead(notif._id);
                                    }
                                    setShowNotifications(false);
                                    window.location.href = "/notice";
                                  }}
                                  className="flex flex-1 gap-3 min-w-0"
                                >
                                  <div className="shrink-0 mt-0.5">
                                    <div className={`w-2 h-2 rounded-full ${!notif.isRead ? "bg-orange-500 animate-pulse" : "bg-transparent"}`} />
                                  </div>
                                  <div className="flex-1 min-w-0 text-left pr-4">
                                    <p className={`text-xs line-clamp-2 ${!notif.isRead ? "font-semibold text-gray-900 dark:text-white" : "font-normal text-gray-600 dark:text-gray-300"}`}>
                                      {notif.message}
                                    </p>
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 block mt-1">
                                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notif._id);
                                  }}
                                  className="absolute right-2 top-3.5 p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-slate-750 transition md:opacity-0 md:group-hover:opacity-100 hover:cursor-pointer z-10"
                                  aria-label="Delete Notification"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Profile Dropdown */}
                  <div className="relative" ref={profileRef}>
                    <button
                      onClick={() => setShowProfile(!showProfile)}
                      className="w-10 h-10 rounded-full overflow-hidden bg-orange-500 text-white font-bold flex items-center justify-center hover:cursor-pointer"
                    >
                      {session?.user?.image ? (
                        <Image
                          src={session.user.image}
                          alt={session.user.name || "User"}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        session?.user?.name?.charAt(0)?.toUpperCase() || "U"
                      )}
                    </button>
                    {showProfile && (
                      <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden">
                        <Link
                          href="/profile"
                          onClick={() => setShowProfile(false)}
                          className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200"
                        >
                          {t("profile")}
                        </Link>
                        <button
                          onClick={() => {
                            authClient.signOut();
                            toast.success(lang === "en" ? "Logged out successfully" : "সফলভাবে লগআউট করা হয়েছে");
                          }}
                          className="w-full text-left px-4 py-3 text-red-500 hover:cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-750"
                        >
                          {t("logout")}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {isLoggedIn && (
            <div className="relative" ref={mobileNotificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 hover:bg-orange-50/50 dark:hover:bg-slate-800 transition-all shadow-sm flex items-center justify-center"
                aria-label="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
                    <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200">{t("notifications")}</h3>
                    <div className="flex items-center gap-3">
                      {unreadCount > 0 && (
                        <button
                          onClick={() => {
                            markAllAsRead();
                          }}
                          className="text-xs font-semibold text-orange-500 hover:text-orange-655 dark:hover:text-orange-400 transition bg-transparent border-0"
                        >
                          {t("markAllAsRead")}
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          onClick={() => {
                            clearAllNotifications();
                          }}
                          className="text-xs font-semibold text-red-500 hover:text-red-650 transition bg-transparent border-0"
                        >
                          {lang === "bn" ? "সব মুছুন" : "Clear All"}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
                        {t("noNotifications")}
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif._id}
                          className={`group px-4 py-3 hover:bg-orange-50/30 dark:hover:bg-slate-700/30 transition border-b border-gray-55 dark:border-slate-700/50 cursor-pointer flex gap-3 relative ${
                            !notif.isRead ? "bg-orange-50/10 dark:bg-orange-500/5" : ""
                          }`}
                        >
                          <div
                            onClick={async () => {
                              if (!notif.isRead) {
                                await markAsRead(notif._id);
                              }
                              setShowNotifications(false);
                              window.location.href = "/notice";
                            }}
                            className="flex flex-1 gap-3 min-w-0"
                          >
                            <div className="shrink-0 mt-0.5">
                              <div className={`w-2 h-2 rounded-full ${!notif.isRead ? "bg-orange-500 animate-pulse" : "bg-transparent"}`} />
                            </div>
                            <div className="flex-1 min-w-0 text-left pr-4">
                              <p className={`text-xs line-clamp-2 ${!notif.isRead ? "font-semibold text-gray-900 dark:text-white" : "font-normal text-gray-600 dark:text-gray-300"}`}>
                                {notif.message}
                              </p>
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 block mt-1">
                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notif._id);
                            }}
                            className="absolute right-2 top-3.5 p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-105 dark:hover:bg-slate-750 transition hover:cursor-pointer z-10"
                            aria-label="Delete Notification"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <button
            className="p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu with smooth open/close */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-white border-b border-gray-100 p-6 flex flex-col gap-4">
          {navLinks.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`
  font-medium
  ${
    pathname === item.href
      ? "text-orange-500"
      : "text-gray-700 hover:text-orange-500"
  }
`}
            >
              {item.name}
            </Link>
          ))}

          {/* Theme & Language Toggle for Mobile */}
          <div className="pt-4 border-t flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{lang === "en" ? "Theme" : "থিম"}</span>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center justify-center p-2 rounded-full border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 hover:border-orange-500 dark:hover:border-orange-400 hover:bg-orange-50/50 dark:hover:bg-slate-800 transition-all shadow-sm hover:cursor-pointer"
              aria-label="Toggle Theme"
            >
              {themeMounted && (theme === "dark" ? (
                <Sun size={16} className="text-orange-400" />
              ) : (
                <Moon size={16} className="text-slate-700" />
              ))}
              {!themeMounted && <div className="w-4 h-4" />}
            </button>
          </div>

          <div className="pt-4 border-t flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Language / ভাষা</span>
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 dark:border-slate-700 hover:border-orange-500 dark:hover:border-orange-400 hover:bg-orange-50/50 dark:hover:bg-slate-800 transition-all font-semibold text-xs tracking-wider shadow-sm text-gray-700 dark:text-gray-200 hover:text-orange-600 dark:hover:text-orange-400 hover:cursor-pointer"
            >
              {lang === "en" ? (
                <>
                  <span className="text-sm">🇬🇧</span>
                  <span>EN</span>
                </>
              ) : (
                <>
                  <span className="text-sm">🇧🇩</span>
                  <span>BD</span>
                </>
              )}
            </button>
          </div>

          {/* Mobile Menu for Login/Signup/Profile */}
          {!isPending && (
            <div className="pt-4 border-t flex flex-col gap-3">
              {!isLoggedIn ? (
                <>
                  <Link
                    href="/signin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="bg-orange-500 text-white px-5 py-2 rounded-full text-center"
                  >
                    {t("login")}
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-700"
                  >
                    {t("profile")}
                  </Link>
                  <button
                    onClick={() => {
                      authClient.signOut();
                      toast.success(lang === "en" ? "Logged out successfully" : "সফলভাবে লগআউট করা হয়েছে");
                    }}
                    className="text-red-500 text-left hover:cursor-pointer"
                  >
                    {t("logout")}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}