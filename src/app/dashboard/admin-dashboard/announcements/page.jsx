"use client";
import React, { useEffect, useState } from "react";
import { GetUser } from "@/components/action/action";
import { useTranslation } from "@/lib/useTranslation";
import { toast } from "sonner";
import Image from "next/image";
import {
  Megaphone,
  Send,
  Radio,
  History,
  AlertTriangle,
  Bell,
  RefreshCcw,
  Image as ImageIcon,
  Eye,
  Sparkles,
  Link2,
  ExternalLink,
  UploadCloud,
  X,
  Trash2,
} from "lucide-react";

function Avatar({ name, src, size = 44 }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className="shrink-0 rounded-full flex items-center justify-center font-bold text-white"
        style={{
          width: size,
          height: size,
          background: "linear-gradient(135deg, #16181D 0%, #FF6900 100%)",
          fontSize: size * 0.4,
        }}
      >
        {name ? name[0].toUpperCase() : "?"}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={name}
      width={size}
      height={size}
      unoptimized
      onError={() => setFailed(true)}
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  );
}

export default function AdminAnnouncementsPage() {
  const user = GetUser();
  const adminUserId = user?.user?.id;
  const { lang } = useTranslation();
  const isBn = lang === "bn";

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [actionUrl, setActionUrl] = useState("");
  const [actionText, setActionText] = useState("");
  const [urgency, setUrgency] = useState("normal");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [broadcasts, setBroadcasts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [expandedSeenId, setExpandedSeenId] = useState(null);
  const [expandedUnseenId, setExpandedUnseenId] = useState(null);
  const [deleteModalId, setDeleteModalId] = useState(null);

  const fetchBroadcasts = async () => {
    if (!adminUserId) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/broadcasts?userId=${adminUserId}`
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setBroadcasts(data.data || []);
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const performDelete = async (broadcastId) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/broadcast/${broadcastId}?userId=${adminUserId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(isBn ? "ব্রডকাস্ট মুছে ফেলা হয়েছে" : "Broadcast deleted successfully");
        fetchBroadcasts();
      } else {
        toast.error(data.message || (isBn ? "মুছে ফেলতে ব্যর্থ" : "Failed to delete"));
      }
    } catch (err) {
      console.error(err);
      toast.error(isBn ? "সার্ভার এরর" : "Server error");
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchBroadcasts();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminUserId]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(isBn ? "ছবি সর্বোচ্চ ৫ মেগাবাইট হতে পারবে" : "Image size must be less than 5MB");
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "easymess_preset"
      );

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "kkvshrff";

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      if (res.ok && data.secure_url) {
        setImageUrl(data.secure_url);
        toast.success(isBn ? "ক্লাউডিনারিতে ছবি আপলোড সফল হয়েছে!" : "Image uploaded successfully to Cloudinary!");
      } else {
        toast.error(data.error?.message || (isBn ? "আপলোড ব্যর্থ হয়েছে" : "Failed to upload image"));
      }
    } catch (err) {
      console.error(err);
      toast.error(isBn ? "ক্লাউডিনারি আপলোড এরর" : "Cloudinary upload error");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error(isBn ? "শিরোনাম এবং বিবরণ প্রদান করুন" : "Title and message are required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/broadcast`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adminUserId,
            title,
            message,
            imageUrl,
            urgency,
            actionUrl,
            actionText,
          }),
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(
          isBn
            ? "সকল ইউজারের কাছে পপআপ মোডাল ব্রডকাস্ট পাঠানো হয়েছে!"
            : "Broadcast popup announcement sent successfully to all users!"
        );
        setTitle("");
        setMessage("");
        setImageUrl("");
        setActionUrl("");
        setActionText("");
        setUrgency("normal");
        fetchBroadcasts();
      } else {
        toast.error(data.message || (isBn ? "ব্রডকাস্ট পাঠাতে ব্যর্থ" : "Failed to send broadcast"));
      }
    } catch (err) {
      console.error(err);
      toast.error(isBn ? "সার্ভার এরর" : "Server error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <Megaphone className="text-orange-500" size={26} />
            {isBn ? "গ্লোবাল পপআপ অ্যানাউন্সমেন্ট মোডাল" : "Global Announcement Popup Modal"}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
            {isBn
              ? "ক্লাউডিনারি ইমেজ আপলোড ও অটো-লিংকসহ সকল মেসের সকল ইউজারের জন্য পপআপ নোটিশ।"
              : "Broadcast popup announcement with Cloudinary image upload, auto-hyperlinks, and action buttons."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <form
          onSubmit={handleSendBroadcast}
          className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4"
        >
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Radio size={18} className="text-orange-500" />
            {isBn ? "নতুন পপআপ মোডাল বার্তা তৈরি করুন" : "Compose Popup Announcement"}
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                {isBn ? "মোডাল শিরোনাম (Title)" : "Notice Title"}
              </label>
              <input
                type="text"
                placeholder={isBn ? "জরুরী ঘোষণা বা Join Our Mess..." : "Emergency Announcement / Join Our Mess..."}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            {/* Cloudinary Image Direct File Upload Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                {isBn ? "ব্যানার ছবি আপলোড (Cloudinary Direct Upload)" : "Banner Image Upload (Cloudinary Direct)"}
              </label>

              {imageUrl ? (
                <div className="relative w-full h-36 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 group">
                  <Image
                    src={imageUrl}
                    alt="Uploaded Banner"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer transition flex items-center gap-1"
                    >
                      <X size={14} />
                      <span>Remove Image</span>
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 dark:border-slate-700 hover:border-orange-500 dark:hover:border-orange-500 rounded-xl bg-gray-50 dark:bg-slate-800/50 cursor-pointer transition">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 space-y-1 text-center px-4">
                    {uploadingImage ? (
                      <div className="flex items-center gap-2 text-orange-500 font-semibold text-xs">
                        <RefreshCcw size={18} className="animate-spin" />
                        <span>Uploading image to Cloudinary...</span>
                      </div>
                    ) : (
                      <>
                        <UploadCloud size={26} className="text-orange-500 mb-1" />
                        <p className="text-xs font-bold text-gray-700 dark:text-slate-200">
                          {isBn ? "ছবি আপলোড করতে ক্লিক করুন" : "Click to select banner image"}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          PNG, JPG, WEBP (Max 5MB) - Direct Cloudinary Upload
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingImage}
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Action Link & Text Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  {isBn ? "অ্যাকশন লিংক (Link URL)" : "Action Link URL"}
                </label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="url"
                    placeholder="https://facebook.com/..."
                    value={actionUrl}
                    onChange={(e) => setActionUrl(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  {isBn ? "বাটন নাম (Button Text)" : "Action Button Text"}
                </label>
                <input
                  type="text"
                  placeholder={isBn ? "Join Our Mess / Visit Link" : "Join Our Mess / Visit Link"}
                  value={actionText}
                  onChange={(e) => setActionText(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                {isBn ? "জরুরী মাত্রা (Urgency Level)" : "Urgency Level"}
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                <option value="normal">{isBn ? "সাধারণ ঘোষণা (Normal Notice)" : "Normal System Notice"}</option>
                <option value="urgent">{isBn ? "জরুরী নোটিশ (Urgent Announcement)" : "Urgent Announcement"}</option>
                <option value="critical">{isBn ? "অত্যন্ত জরুরী অ্যালার্ট (Critical Alert)" : "Critical System Alert"}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                {isBn ? "বিস্তারিত বিবরণ (Message Content)" : "Message Content"}
              </label>
              <textarea
                rows={4}
                placeholder={isBn ? "মেসেজ বিস্তারিতভাবে লিখুন (যেকোনো লিংক অটো হাইপারলিংক হয়ে যাবে)..." : "Write your message (any https:// link will be auto-hyperlinked)..."}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || uploadingImage}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer"
          >
            <Send size={16} />
            <span>{submitting ? (isBn ? "ব্রডকাস্ট হচ্ছে..." : "Broadcasting...") : (isBn ? "সকল ইউজারের নিকট পপআপ ব্রডকাস্ট পাঠান" : "Send Popup Broadcast Now")}</span>
          </button>
        </form>

        {/* Live Preview Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Eye size={14} className="text-orange-500" />
              {isBn ? "ইউজারের স্ক্রিনের লাইভ প্রিভিউ" : "User Screen Live Preview"}
            </h3>

            {/* Simulated Popup Card */}
            <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 p-4 space-y-3 shadow-inner">
              {imageUrl ? (
                <div className="relative w-full h-32 rounded-xl overflow-hidden bg-slate-900">
                  <Image
                    src={imageUrl}
                    alt="Preview"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400 flex items-center justify-center font-bold">
                  <Megaphone size={20} />
                </div>
              )}

              <div className="space-y-1">
                <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                  {urgency}
                </span>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                  {title || (isBn ? "মোডাল শিরোনাম..." : "Announcement Title...")}
                </h4>
                <p className="text-xs text-gray-500 dark:text-slate-300 line-clamp-3">
                  {message || (isBn ? "বিস্তারিত মেসেজ বিবরণ..." : "Message content preview...")}
                </p>
              </div>

              {/* Action Link Preview Button */}
              {actionUrl && (
                <div className="pt-1">
                  <div className="w-full py-2 bg-orange-500 text-white rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-md">
                    <span>{actionText || "Join Our Mess"}</span>
                    <ExternalLink size={12} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast History */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <History size={18} className="text-orange-500" />
            {isBn ? "পূর্বের ব্রডকাস্ট হিস্ট্রি" : "Past Broadcast History"}
          </h2>
          <button
            type="button"
            onClick={fetchBroadcasts}
            className="p-2 bg-gray-50 dark:bg-slate-800 rounded-xl text-gray-500 hover:bg-gray-100 transition cursor-pointer"
          >
            <RefreshCcw size={14} className={loadingHistory ? "animate-spin" : ""} />
          </button>
        </div>

        {loadingHistory ? (
          <div className="p-8 flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          </div>
        ) : broadcasts.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">
            {isBn ? "পূর্বে কোনো ব্রডকাস্ট পাঠানো হয়নি" : "No previous broadcast history"}
          </p>
        ) : (
          <div className="space-y-3">
            {broadcasts.map((b) => {
              const seenList = users.filter(u => b.seenBy?.includes(u._id.toString()));
              const unseenList = users.filter(u => !b.seenBy?.includes(u._id.toString()));
              const isSeenExpanded = expandedSeenId === b._id;
              const isUnseenExpanded = expandedUnseenId === b._id;

              return (
                <div
                  key={b._id}
                  className="p-4 rounded-xl border border-gray-100 dark:border-slate-800/80 bg-gray-50/50 dark:bg-slate-800/40 space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5 font-display">
                      <Bell size={14} className="text-orange-500" />
                      {b.title}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          b.urgency === "critical"
                            ? "bg-rose-100 text-rose-700"
                            : b.urgency === "urgent"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {b.urgency}
                      </span>
                      <button
                        onClick={() => setDeleteModalId(b._id)}
                        className="p-1 text-rose-500 hover:bg-rose-100/50 dark:hover:bg-rose-950/40 rounded transition cursor-pointer"
                        title={isBn ? "মুছে ফেলুন" : "Delete"}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {b.imageUrl && (
                    <p className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 truncate">
                      🖼️ Image: {b.imageUrl}
                    </p>
                  )}
                  <p className="text-xs text-gray-600 dark:text-slate-300 font-body">{b.message}</p>
                  
                  {/* Seen / Unseen Stats */}
                  <div className="flex flex-wrap gap-2 pt-1.5 border-t border-gray-100 dark:border-slate-850">
                    <button
                      onClick={() => {
                        setExpandedSeenId(isSeenExpanded ? null : b._id);
                        setExpandedUnseenId(null);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        isSeenExpanded
                          ? "bg-emerald-500 text-white shadow-sm"
                          : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100"
                      }`}
                    >
                      {isBn ? `দেখেছে: ${seenList.length} জন` : `Seen: ${seenList.length}`}
                    </button>
                    <button
                      onClick={() => {
                        setExpandedUnseenId(isUnseenExpanded ? null : b._id);
                        setExpandedSeenId(null);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        isUnseenExpanded
                          ? "bg-gray-700 dark:bg-slate-700 text-white shadow-sm"
                          : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-205"
                      }`}
                    >
                      {isBn ? `দেখেনি: ${unseenList.length} জন` : `Unseen: ${unseenList.length}`}
                    </button>
                  </div>

                  {/* Collapsible Seen List */}
                  {isSeenExpanded && (
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-gray-100 dark:border-slate-800 space-y-2 animate-in fade-in duration-200">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-meta">
                        {isBn ? "যারা দেখেছেন:" : "Seen By:"}
                      </p>
                      {seenList.length === 0 ? (
                        <p className="text-xs text-gray-405 italic">{isBn ? "এখনো কেউ দেখেনি" : "Nobody has seen this notice yet"}</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                          {seenList.map((u) => (
                            <div key={u._id} className="flex items-center gap-2 text-xs py-1 border-b border-gray-50 dark:border-slate-800 last:border-0">
                              <Avatar name={u.name} src={u.image} size={22} />
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-gray-800 dark:text-slate-200 truncate">{u.name}</p>
                                <p className="text-[9px] text-gray-400 truncate">{u.email}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Collapsible Unseen List */}
                  {isUnseenExpanded && (
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-gray-100 dark:border-slate-800 space-y-2 animate-in fade-in duration-200">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 font-meta">
                        {isBn ? "যারা এখনো দেখেননি:" : "Not Seen Yet By:"}
                      </p>
                      {unseenList.length === 0 ? (
                        <p className="text-xs text-emerald-600 font-semibold">{isBn ? "সবai দেখেছেন!" : "Everyone has seen this notice!"}</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                          {unseenList.map((u) => (
                            <div key={u._id} className="flex items-center gap-2 text-xs py-1 border-b border-gray-50 dark:border-slate-800 last:border-0">
                              <Avatar name={u.name} src={u.image} size={22} />
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-gray-800 dark:text-slate-200 truncate">{u.name}</p>
                                <p className="text-[9px] text-gray-400 truncate">{u.email}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
                    <span>Sent by: {b.senderName || "Admin"}</span>
                    <span>{new Date(b.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-[#16181D]/40 backdrop-blur-sm" onClick={() => setDeleteModalId(null)} />
          <div className="relative w-full max-w-sm rounded-[28px] bg-white dark:bg-slate-900 p-6 text-center shadow-xl border border-gray-100 dark:border-slate-800 z-10 animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-500 mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white font-display">
              {isBn ? "ব্রডকাস্টটি মুছে ফেলবেন?" : "Delete announcement?"}
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 font-body">
              {isBn ? "এটি চিরতরে ব্রডকাস্ট নোটিশ এবং এর সাথে সম্পর্কিত সকল সিস্টেম নোটিফিকেশন মুছে ফেলবে।" : "This will permanently remove the broadcast notice and all related system notifications."}
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteModalId(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition cursor-pointer font-display"
              >
                {isBn ? "বাতিল" : "Cancel"}
              </button>
              <button
                onClick={async () => {
                  const bId = deleteModalId;
                  setDeleteModalId(null);
                  await performDelete(bId);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition cursor-pointer font-display"
              >
                {isBn ? "মুছে ফেলুন" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
