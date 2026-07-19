"use client";
import React, { useEffect, useState } from "react";
import { useSocket } from "@/components/providers/SocketProvider";
import { authClient } from "@/lib/auth-client";
import { useTranslation } from "@/lib/useTranslation";
import { Plus, Search, Filter, AlertCircle, X, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import NoticeCard from "@/components/NoticeCard";

export default function NoticePage() {
  const { socket, messId } = useSocket();
  const { t, lang } = useTranslation();
  const { data: session, isPending } = authClient.useSession();
  const userId = session?.user?.id;

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");
  
  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [noticeToDelete, setNoticeToDelete] = useState(null);
  const [commentToDelete, setCommentToDelete] = useState(null);
  
  // Notice being edited
  const [editingNotice, setEditingNotice] = useState(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [expiryDate, setExpiryDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // all, pinned, recent, oldest, archived

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // Fetch role
  useEffect(() => {
    const fetchRole = async () => {
      if (!userId) return;
      try {
        const res = await fetch(`${API_BASE}/api/member/role/${userId}`);
        const data = await res.json();
        setRole(data.role);
      } catch (error) {
        console.error("Error fetching role:", error);
      }
    };

    fetchRole();
  }, [userId, API_BASE]);

  // Fetch notices list
  const fetchNotices = async () => {
    if (!messId) return;
    try {
      const url = new URL(`${API_BASE}/api/notices/${messId}`);
      if (searchQuery.trim() !== "") {
        url.searchParams.append("search", searchQuery);
      }
      url.searchParams.append("filter", activeFilter);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setNotices(data.data);
      }
    } catch (error) {
      console.error("Error fetching notices:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (messId) {
      fetchNotices();
    }
  }, [messId, activeFilter, searchQuery]);

  // Real-time notice list update listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewNotice = () => {
      fetchNotices();
    };

    const handleEditNotice = (data) => {
      setNotices((prev) =>
        prev.map((notice) =>
          notice._id.toString() === data.notice._id.toString()
            ? { ...notice, ...data.notice }
            : notice
        )
      );
    };

    const handleDeleteNotice = (data) => {
      setNotices((prev) =>
        prev.filter((notice) => notice._id.toString() !== data.noticeId.toString())
      );
    };

    socket.on("new-notice", handleNewNotice);
    socket.on("edit-notice", handleEditNotice);
    socket.on("delete-notice", handleDeleteNotice);

    return () => {
      socket.off("new-notice", handleNewNotice);
      socket.off("edit-notice", handleEditNotice);
      socket.off("delete-notice", handleDeleteNotice);
    };
  }, [socket, messId, activeFilter, searchQuery]);

  // Open Edit Modal
  const openEditModal = (notice) => {
    setEditingNotice(notice);
    setTitle(notice.title);
    setDescription(notice.description);
    setIsPinned(notice.isPinned);
    
    if (notice.expiryDate) {
      // Format to YYYY-MM-DD for date input
      const d = new Date(notice.expiryDate);
      const formattedDate = d.toISOString().split("T")[0];
      setExpiryDate(formattedDate);
    } else {
      setExpiryDate("");
    }
    setIsEditModalOpen(true);
  };

  // Handle Create Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error(lang === "bn" ? "শিরোনাম এবং বিবরণ আবশ্যক" : "Title and description are required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/notices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messId,
          title,
          description,
          createdBy: userId,
          isPinned,
          expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(
          lang === "bn" ? "নোটিশ সফলভাবে প্রকাশিত হয়েছে" : "Notice published successfully"
        );
        setIsCreateModalOpen(false);
        resetForm();
        fetchNotices(); // reload fallback
      } else {
        toast.error(data.message || (lang === "bn" ? "ব্যর্থ হয়েছে" : "Failed to publish notice"));
      }
    } catch (error) {
      console.error("Error creating notice:", error);
      toast.error(lang === "bn" ? "সার্ভার ত্রুটি" : "Server error, please try again");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !editingNotice) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/notices/${editingNotice._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          isPinned,
          expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
          userId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(
          lang === "bn" ? "নোটিশ সফলভাবে এডিট হয়েছে" : "Notice updated successfully"
        );
        setIsEditModalOpen(false);
        resetForm();
      } else {
        toast.error(data.message || "Failed to update notice");
      }
    } catch (error) {
      console.error("Error editing notice:", error);
      toast.error(lang === "bn" ? "সার্ভার ত্রুটি" : "Server error");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Notice Trigger
  const handleDeleteNotice = (noticeId) => {
    setNoticeToDelete(noticeId);
  };

  const executeDeleteNotice = async (noticeId) => {
    try {
      const res = await fetch(`${API_BASE}/api/notices/${noticeId}?userId=${userId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(lang === "bn" ? "নোটিশ ডিলিট করা হয়েছে" : "Notice deleted successfully");
        setNotices((prev) => prev.filter((n) => n._id !== noticeId));
      } else {
        toast.error(data.message || "Failed to delete notice");
      }
    } catch (error) {
      console.error("Error deleting notice:", error);
      toast.error(lang === "bn" ? "সার্ভার ত্রুটি" : "Server error");
    }
  };

  const executeDeleteComment = async (commentId) => {
    try {
      const res = await fetch(`${API_BASE}/api/comments/${commentId}?userId=${userId}`, {
        method: "DELETE",
        headers: {
          "x-user-id": userId,
        }
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(lang === "bn" ? "মন্তব্য ডিলিট করা হয়েছে" : "Comment deleted successfully");
      } else {
        toast.error(data.message || "Failed to delete comment");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error(lang === "bn" ? "সার্ভার ত্রুটি" : "Server error");
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setIsPinned(false);
    setExpiryDate("");
    setEditingNotice(null);
  };

  const filterTabs = [
    { key: "all", label: lang === "bn" ? "সব নোটিশ" : "All Notices" },
    { key: "pinned", label: lang === "bn" ? "পিনড নোটিশ" : "Pinned" },
    { key: "recent", label: lang === "bn" ? "সাম্প্রতিক" : "Recent" },
    { key: "oldest", label: lang === "bn" ? "পুরাতন" : "Oldest" },
    { key: "archived", label: lang === "bn" ? "আর্কাইভ" : "Archived" },
  ];

  if (isPending || (loading && messId && notices.length === 0)) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 w-full flex-grow">
        <div className="flex justify-between items-center mb-8 animate-pulse">
          <div>
            <div className="h-8 bg-gray-200 dark:bg-slate-700 w-48 rounded-lg mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-700 w-72 rounded-lg"></div>
          </div>
          <div className="h-10 bg-gray-200 dark:bg-slate-700 w-32 rounded-full"></div>
        </div>

        <div className="space-y-6">
          {[1, 2].map((n) => (
            <div key={n} className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-gray-155 dark:border-slate-700 space-y-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-full"></div>
                <div>
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 w-24 rounded"></div>
                  <div className="h-3 bg-gray-200 dark:bg-slate-700 w-32 rounded mt-1.5"></div>
                </div>
              </div>
              <div className="h-6 bg-gray-200 dark:bg-slate-700 w-2/3 rounded"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-slate-700 w-full rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-slate-700 w-5/6 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex justify-center items-center h-[60vh] w-full">
        <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 max-w-sm">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{lang === "bn" ? "লগইন প্রয়োজন" : "Login Required"}</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {lang === "bn" ? "নোটিশ দেখতে অনুগ্রহ করে লগইন করুন।" : "Please login to view notices."}
          </p>
        </div>
      </div>
    );
  }

  if (!messId) {
    return (
      <div className="flex justify-center items-center h-[60vh] w-full">
        <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 max-w-md">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{lang === "bn" ? "কোনো মেস পাওয়া যায়নি" : "No Mess Found"}</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {lang === "bn"
              ? "আপনি কোনো মেসের সদস্য নন। অনুগ্রহ করে একটি মেসে যোগ দিন বা নতুন মেস তৈরি করুন।"
              : "You are not a member of any mess. Please join or create a mess to access notices."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 w-full flex-grow">
      {/* Title Header */}
      <div className="flex justify-between items-start md:items-center gap-4 mb-8 flex-col md:flex-row">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span>📢</span> {lang === "bn" ? "কমিউনিটি নোটিশ ফিড" : "Community Notice Feed"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            {lang === "bn"
              ? "আপনার মেসের নোটিশ, আপডেট ও সদস্যদের ইন্টারঅ্যাকশনসমূহ"
              : "Interact and comment on announcements and notices published by your mess manager"}
          </p>
        </div>

        {role === "manager" && (
          <button
            onClick={() => {
              resetForm();
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-semibold shadow-md hover:shadow-lg transition-all hover:cursor-pointer text-sm shrink-0"
          >
            <Plus size={18} />
            <span>{t("createNotice")}</span>
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-gray-50/50 dark:bg-slate-800/40 p-4 rounded-3xl border border-gray-100 dark:border-slate-700/60 mb-8 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-3 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchNotice")}
            className="w-full pl-11 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 rounded-full border border-gray-200 dark:border-slate-700 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-gray-800 dark:text-white placeholder-gray-400 transition shadow-sm"
          />
        </div>

        {/* Filters Scrollable List */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all hover:cursor-pointer border ${
                activeFilter === tab.key
                  ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                  : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-orange-500 dark:hover:border-orange-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notice Feed List */}
      {notices.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col justify-center items-center">
          <div className="w-16 h-16 bg-orange-50 dark:bg-slate-700 rounded-full flex items-center justify-center text-orange-500 text-2xl mb-4">
            📭
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
            {lang === "bn" ? "কোনো নোটিশ পাওয়া যায়নি" : "No Notices Found"}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xs text-sm">
            {lang === "bn"
              ? "অনুসন্ধান অথবা ফিল্টারের সাথে মিলে এমন কোনো নোটিশ নেই।"
              : "Try adjusting your search query or filter tags to find notices."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {notices.map((notice) => (
            <NoticeCard
              key={notice._id}
              notice={notice}
              userId={userId}
              role={role}
              onEditClick={openEditModal}
              onDeleteClick={handleDeleteNotice}
              onDeleteComment={(commentId) => setCommentToDelete(commentId)}
            />
          ))}
        </div>
      )}

      {/* Create Notice Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-gray-850 dark:text-gray-100 flex items-center gap-2">
                <span>📝</span> {lang === "bn" ? "নতুন নোটিশ প্রকাশ করুন" : "Publish New Notice"}
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition hover:cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {lang === "bn" ? "শিরোনাম" : "Notice Title"}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={lang === "bn" ? "নোটিশের শিরোনাম লিখুন..." : "Enter notice title..."}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition text-sm"
                  maxLength={100}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {lang === "bn" ? "নোটিশের বিবরণ" : "Notice Description"}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={lang === "bn" ? "নোটিশের বিস্তারিত বিবরণ লিখুন..." : "Enter notice details..."}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition text-sm min-h-[120px]"
                  required
                />
              </div>

              {/* Expiry Date Datepicker */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("expiryDate")}
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent text-gray-800 dark:text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition text-sm"
                />
              </div>

              {/* Pin notice */}
              <label className="flex items-center gap-3 cursor-pointer group py-1 select-none">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border transition-all duration-200 flex items-center justify-center ${
                    isPinned
                      ? "bg-orange-500 border-orange-500 text-white"
                      : "border-gray-300 dark:border-slate-650 group-hover:border-orange-500"
                  }`}>
                    {isPinned && <Check size={14} strokeWidth={3} />}
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-650 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-white transition">
                  {t("pinNotice")}
                </span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-full font-semibold transition hover:bg-gray-50 dark:hover:bg-slate-750 hover:cursor-pointer text-sm"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-350 text-white rounded-full font-semibold shadow-md hover:shadow-lg disabled:shadow-none transition-all hover:cursor-pointer flex items-center gap-2 text-sm"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{lang === "bn" ? "প্রকাশ করা হচ্ছে..." : "Publishing..."}</span>
                    </>
                  ) : (
                    <span>{lang === "bn" ? "প্রকাশ করুন" : "Publish Notice"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Notice Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-gray-850 dark:text-gray-100 flex items-center gap-2">
                <span>📝</span> {lang === "bn" ? "নোটিশ পরিবর্তন করুন" : "Edit Notice"}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition hover:cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {lang === "bn" ? "শিরোনাম" : "Notice Title"}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent text-gray-800 dark:text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition text-sm"
                  maxLength={100}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {lang === "bn" ? "নোটিশের বিবরণ" : "Notice Description"}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent text-gray-800 dark:text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition text-sm min-h-[120px]"
                  required
                />
              </div>

              {/* Expiry Date */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("expiryDate")}
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent text-gray-800 dark:text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition text-sm"
                />
              </div>

              {/* Pin notice */}
              <label className="flex items-center gap-3 cursor-pointer group py-1 select-none">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border transition-all duration-200 flex items-center justify-center ${
                    isPinned
                      ? "bg-orange-500 border-orange-500 text-white"
                      : "border-gray-300 dark:border-slate-650 group-hover:border-orange-500"
                  }`}>
                    {isPinned && <Check size={14} strokeWidth={3} />}
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-655 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-white transition">
                  {t("pinNotice")}
                </span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-full font-semibold transition hover:bg-gray-50 dark:hover:bg-slate-750 hover:cursor-pointer text-sm"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-350 text-white rounded-full font-semibold shadow-md hover:shadow-lg disabled:shadow-none transition-all hover:cursor-pointer flex items-center gap-2 text-sm"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{lang === "bn" ? "সংরক্ষণ করা হচ্ছে..." : "Saving..."}</span>
                    </>
                  ) : (
                    <span>{t("save")}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notice Deletion Confirmation Modal */}
      {noticeToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/30 text-red-500 mb-4 mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-center font-bold text-base text-gray-900 dark:text-white mb-2">
              {lang === "bn" ? "নোটিশটি ডিলিট করতে চান?" : "Delete Notice?"}
            </h3>
            <p className="text-center text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
              {lang === "bn"
                ? "আপনি কি নিশ্চিত? নোটিশটি ডিলিট করলে এর সকল কমেন্ট ও রিঅ্যাকশন চিরতরে মুছে যাবে।"
                : "Are you sure? Deleting this notice will permanently remove all of its comments and reactions."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setNoticeToDelete(null)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-350 transition hover:cursor-pointer"
              >
                {lang === "bn" ? "বাতিল" : "Cancel"}
              </button>
              <button
                onClick={() => {
                  executeDeleteNotice(noticeToDelete);
                  setNoticeToDelete(null);
                }}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-red-500 hover:bg-red-650 text-white transition hover:cursor-pointer"
              >
                {lang === "bn" ? "ডিলিট" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comment Deletion Confirmation Modal */}
      {commentToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/30 text-red-500 mb-4 mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-center font-bold text-base text-gray-900 dark:text-white mb-2">
              {lang === "bn" ? "মন্তব্যটি ডিলিট করতে চান?" : "Delete Comment?"}
            </h3>
            <p className="text-center text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
              {lang === "bn"
                ? "আপনি কি আসলেই মন্তব্যটি মুছে ফেলতে চান? এই কাজটি আর ফিরিয়ে আনা সম্ভব নয়।"
                : "Are you sure you want to delete this comment? This action cannot be undone."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCommentToDelete(null)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-350 transition hover:cursor-pointer"
              >
                {lang === "bn" ? "বাতিল" : "Cancel"}
              </button>
              <button
                onClick={() => {
                  executeDeleteComment(commentToDelete);
                  setCommentToDelete(null);
                }}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-red-500 hover:bg-red-650 text-white transition hover:cursor-pointer"
              >
                {lang === "bn" ? "ডিলিট" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
