"use client";
import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { getOptimizedImageUrl } from "@/lib/image-utils";
import { useSocket } from "@/components/providers/SocketProvider";
import { useTranslation } from "@/lib/useTranslation";
import { Pin, Calendar, Eye, MessageCircle, MoreVertical, Trash2, Edit2, Check, Smile, Reply, Send, X, Users, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function NoticeCard({ notice, userId, role, onEditClick, onDeleteClick, onDeleteComment }) {
  const { socket } = useSocket();
  const { t, lang } = useTranslation();

  const [localReactions, setLocalReactions] = useState(notice.reactions || []);
  const [seenBy, setSeenBy] = useState(notice.seenBy || [notice.createdBy]);
  
  const [showReactionsMenu, setShowReactionsMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  
  const [replyToId, setReplyToId] = useState(null);
  const [replyText, setReplyText] = useState("");

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState("");

  const [showSeenList, setShowSeenList] = useState(false);
  const [seenStatus, setSeenStatus] = useState({ seenUsers: [], unseenUsers: [], seenCount: 0, totalCount: 0 });
  const [loadingSeen, setLoadingSeen] = useState(false);

  // New states for community feedback requests
  const [showDropdown, setShowDropdown] = useState(false);
  const [showReactionsModal, setShowReactionsModal] = useState(false);
  const [detailedReactions, setDetailedReactions] = useState([]);
  const [loadingReactions, setLoadingReactions] = useState(false);

  const reactionsMenuRef = useRef(null);
  const seenMenuRef = useRef(null);
  const dropdownRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setShowReactionsMenu(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setShowReactionsMenu(false);
    }, 1200); // 1.2 seconds delay gives plenty of time to choose emoji
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // Emojis list
  const emojiList = ["👍", "❤️", "🤗", "😮", "🎉"];

  // Click outside to close menus
  useEffect(() => {
    function handleClickOutside(e) {
      if (reactionsMenuRef.current && !reactionsMenuRef.current.contains(e.target)) {
        setShowReactionsMenu(false);
      }
      if (seenMenuRef.current && !seenMenuRef.current.contains(e.target)) {
        setShowSeenList(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync Seen status when notice enters viewport or mounts
  useEffect(() => {
    const markAsSeen = async () => {
      if (!userId || seenBy.includes(userId)) return;
      try {
        const res = await fetch(`${API_BASE}/api/notices/${notice._id}/seen`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        const data = await res.json();
        if (data.success) {
          setSeenBy((prev) => [...prev, userId]);
        }
      } catch (error) {
        console.error("Error setting notice seen:", error);
      }
    };
    markAsSeen();
  }, [notice._id, userId, seenBy, API_BASE]);

  // Listen for socket interactions for this notice card
  useEffect(() => {
    if (!socket) return;

    const handleInteraction = (data) => {
      if (data.noticeId.toString() === notice._id.toString()) {
        if (data.type === "reactions_update") {
          setLocalReactions(data.reactions);
        } else if (data.type === "comments_update") {
          fetchComments();
        } else if (data.type === "seen_update") {
          setSeenBy(data.seenBy);
          if (showSeenList) {
            fetchSeenStatus();
          }
        }
      }
    };

    socket.on("notice-interaction", handleInteraction);
    return () => socket.off("notice-interaction", handleInteraction);
  }, [socket, notice._id, showSeenList]);

  // Fetch comments
  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await fetch(`${API_BASE}/api/notices/${notice._id}/comments`);
      const data = await res.json();
      if (data.success) {
        setComments(data.data);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments, notice._id]);

  // Fetch seen status detailed list
  const fetchSeenStatus = async () => {
    setLoadingSeen(true);
    try {
      const res = await fetch(`${API_BASE}/api/notices/${notice._id}/seen-status?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setSeenStatus(data);
      }
    } catch (error) {
      console.error("Error fetching seen status details:", error);
    } finally {
      setLoadingSeen(false);
    }
  };

  useEffect(() => {
    if (showSeenList && userId) {
      fetchSeenStatus();
    }
  }, [showSeenList, userId]);

  // Fetch detailed reactions
  const fetchDetailedReactions = async () => {
    setLoadingReactions(true);
    try {
      const res = await fetch(`${API_BASE}/api/notices/${notice._id}/reactions`);
      const data = await res.json();
      if (data.success) {
        setDetailedReactions(data.data);
      }
    } catch (err) {
      console.error("Error fetching detailed reactions:", err);
    } finally {
      setLoadingReactions(false);
    }
  };

  // React to notice
  const handleReact = async (type) => {
    // Check if user already gave this exact reaction. If so, remove it (send null).
    const existing = localReactions.find((r) => r.userId === userId);
    const emojiToSend = existing && existing.type === type ? null : type;

    try {
      // Optimistic update
      if (!emojiToSend) {
        setLocalReactions((prev) => prev.filter((r) => r.userId !== userId));
      } else {
        setLocalReactions((prev) => {
          const filtered = prev.filter((r) => r.userId !== userId);
          return [...filtered, { userId, type }];
        });
      }
      setShowReactionsMenu(false);

      await fetch(`${API_BASE}/api/notices/${notice._id}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, type: emojiToSend }),
      });
    } catch (error) {
      console.error("Error reacting to notice:", error);
    }
  };

  // Add Comment
  const handleAddComment = async (e, pId = null) => {
    e.preventDefault();
    const text = pId ? replyText : commentText;
    if (!text.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/api/notices/${notice._id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          commentText: text,
          parentId: pId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (pId) {
          setReplyText("");
          setReplyToId(null);
        } else {
          setCommentText("");
        }
        // Fetch comments will be triggered by socket event, but let's refresh locally as fallback
        fetchComments();
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  // Edit Comment
  const handleEditComment = async (commentId) => {
    if (!editingText.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/comments/${commentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          commentText: editingText,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingCommentId(null);
        setEditingText("");
        fetchComments();
      }
    } catch (error) {
      console.error("Error editing comment:", error);
    }
  };

  // Delete Comment
  const handleDeleteComment = async (commentId) => {
    try {
      const res = await fetch(`${API_BASE}/api/comments/${commentId}?userId=${userId}`, {
        method: "DELETE",
        headers: {
          "x-user-id": userId,
        }
      });
      const data = await res.json();
      if (data.success) {
        fetchComments();
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  // Group reactions for badge displaying
  const reactionGroups = localReactions.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + 1;
    return acc;
  }, {});

  const myReaction = localReactions.find((r) => r.userId === userId)?.type;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`relative p-6 bg-white dark:bg-slate-800 rounded-3xl border transition-all duration-300 ${
      notice.isPinned
        ? "border-orange-350 dark:border-orange-500/40 bg-orange-50/10 dark:bg-orange-500/5 shadow-sm"
        : "border-gray-100 dark:border-slate-700/60 shadow-sm hover:shadow-md"
    }`}>
      {/* Top Badges & Actions */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          {notice.authorImage ? (
            <Image
              src={getOptimizedImageUrl(notice.authorImage, { width: 80, height: 80 })}
              alt={notice.authorName}
              width={40}
              height={40}
              unoptimized={typeof notice.authorImage === "string" && notice.authorImage.startsWith("http")}
              className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-slate-700"
            />
          ) : (
            <div className="w-10 h-10 bg-orange-100 dark:bg-slate-700 text-orange-600 dark:text-orange-400 font-bold rounded-full flex items-center justify-center">
              {notice.authorName?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-250 flex items-center gap-1.5">
              {notice.authorName}
              <span className="text-[10px] font-medium bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full uppercase">
                {lang === "bn" ? "ম্যানেজার" : "Manager"}
              </span>
            </h4>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
              <Calendar size={12} />
              {formatDate(notice.createdAt)}
              {notice.isEdited && (
                <span className="text-[10px] text-orange-500 font-semibold px-1 rounded bg-orange-50 dark:bg-orange-500/10">
                  {lang === "bn" ? "সম্পাদিত" : "Edited"}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {notice.isPinned && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-orange-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
              <Pin size={10} className="fill-white" />
              <span>{lang === "bn" ? "পিনড" : "Pinned"}</span>
            </span>
          )}

          {/* Edit/Delete for Manager */}
          {role === "manager" && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 transition hover:cursor-pointer"
              >
                <MoreVertical size={16} />
              </button>
              {showDropdown && (
                <div className="absolute right-0 top-8 w-28 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden z-10 animate-in fade-in duration-100">
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      onEditClick(notice);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 text-xs font-semibold text-gray-700 dark:text-gray-250 flex items-center gap-2 hover:cursor-pointer"
                  >
                    <Edit2 size={12} />
                    {t("edit")}
                  </button>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      onDeleteClick(notice._id);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-semibold text-red-500 flex items-center gap-2 hover:cursor-pointer"
                  >
                    <Trash2 size={12} />
                    {t("delete")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Notice content */}
      <h2 className="text-xl font-bold text-gray-950 dark:text-white leading-snug">
        {notice.title}
      </h2>
      <p className="text-gray-650 dark:text-gray-300 mt-3 text-sm leading-relaxed whitespace-pre-wrap">
        {notice.description}
      </p>

      {/* Expiry Badge */}
      {notice.expiryDate && (
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-3.5 italic">
          ⏳ {lang === "bn" ? "আর্কাইভ হবে: " : "Expiry: "} {formatDate(notice.expiryDate)}
        </p>
      )}

      {/* Seen Status summary for All Members */}
      {userId && (
        <div className="relative mt-4 border-t border-gray-50 dark:border-slate-700/50 pt-3" ref={seenMenuRef}>
          <button
            onClick={() => setShowSeenList(!showSeenList)}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-550 dark:text-gray-400 hover:text-orange-500 transition hover:cursor-pointer"
          >
            <Eye size={14} />
            <span>
              {lang === "bn"
                ? `${seenBy.length} জন নোটিশটি দেখেছে`
                : `Seen by ${seenBy.length} members`}
            </span>
          </button>

          {showSeenList && (
            <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-gray-150 dark:border-slate-700 rounded-2xl shadow-xl p-4 z-20 space-y-4 max-h-72 overflow-y-auto">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-700 pb-2">
                <span className="font-bold text-xs text-gray-700 dark:text-gray-250 flex items-center gap-1.5">
                  <Users size={12} /> {t("seenStatus")}
                </span>
                <button onClick={() => setShowSeenList(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X size={14} />
                </button>
              </div>

              {loadingSeen ? (
                <div className="flex justify-center py-4">
                  <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-3.5">
                  {/* Seen list */}
                  <div>
                    <h5 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                      {t("seenBy")} ({seenStatus.seenUsers?.length})
                    </h5>
                    {seenStatus.seenUsers?.length === 0 ? (
                      <p className="text-xs text-gray-400 dark:text-gray-500">-</p>
                    ) : (
                      <div className="space-y-1.5">
                        {seenStatus.seenUsers?.map((u) => (
                          <div key={u.userId} className="flex items-center gap-2">
                            {u.image ? (
                              <Image src={u.image} alt={u.name} width={20} height={20} className="w-5 h-5 rounded-full object-cover" />
                            ) : (
                              <div className="w-5 h-5 bg-orange-100 dark:bg-slate-700 text-orange-650 dark:text-orange-400 font-bold text-[10px] rounded-full flex items-center justify-center">
                                {u.name?.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">{u.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Unseen list */}
                  <div>
                    <h5 className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-wider mb-2">
                      {t("notSeenBy")} ({seenStatus.unseenUsers?.length})
                    </h5>
                    {seenStatus.unseenUsers?.length === 0 ? (
                      <p className="text-xs text-gray-400 dark:text-gray-550 italic">
                        {lang === "bn" ? "সবাই দেখেছে" : "All members saw"}
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {seenStatus.unseenUsers?.map((u) => (
                          <div key={u.userId} className="flex items-center gap-2">
                            {u.image ? (
                              <Image src={u.image} alt={u.name} width={20} height={20} className="w-5 h-5 rounded-full object-cover" />
                            ) : (
                              <div className="w-5 h-5 bg-gray-100 dark:bg-slate-750 text-gray-500 dark:text-gray-400 font-bold text-[10px] rounded-full flex items-center justify-center">
                                {u.name?.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="text-xs text-gray-600 dark:text-gray-400">{u.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Interactions Statistics */}
      <div className="flex items-center gap-5 mt-5 border-t border-b border-gray-50 dark:border-slate-700/50 py-3 text-xs text-gray-500 dark:text-gray-400">
        <button
          onClick={() => {
            if (localReactions.length > 0) {
              setShowReactionsModal(true);
              fetchDetailedReactions();
            }
          }}
          className={`flex items-center gap-1.5 hover:text-orange-500 transition font-medium ${localReactions.length > 0 ? "hover:cursor-pointer" : "cursor-default"}`}
        >
          <span className="flex items-center">
            {Object.keys(reactionGroups).slice(0, 3).map((type) => (
              <span key={type} className="-mr-1 bg-white dark:bg-slate-800 rounded-full border border-white dark:border-slate-800 w-5 h-5 flex items-center justify-center text-xs">
                {type}
              </span>
            ))}
          </span>
          <span className="font-semibold">
            {localReactions.length === 0
              ? (lang === "bn" ? "কোনো রিঅ্যাকশন নেই" : "No reactions")
              : `${localReactions.length} ${t("reactions")}`}
          </span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 hover:text-orange-500 transition hover:cursor-pointer font-medium"
        >
          <MessageCircle size={15} />
          <span>{comments.length > 0 ? comments.length : notice.commentsCount} {t("comments")}</span>
        </button>
      </div>

      {/* Interactive Bar */}
      <div className="flex items-center gap-2 mt-2 pt-1">
        {/* Reactions popover trigger */}
        <div 
          className="relative" 
          ref={reactionsMenuRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button
            onClick={() => setShowReactionsMenu(!showReactionsMenu)}
            className={`flex items-center gap-1.5 px-4 py-2 hover:bg-orange-50/50 dark:hover:bg-slate-700/50 rounded-full text-xs font-bold transition hover:cursor-pointer border border-transparent ${
              myReaction
                ? "text-orange-500 bg-orange-50/20 border-orange-200 dark:border-orange-500/20"
                : "text-gray-600 dark:text-gray-300"
            }`}
          >
            {myReaction ? <span className="text-sm">{myReaction}</span> : <Smile size={15} />}
            <span>{myReaction ? myReaction : (lang === "bn" ? "রিঅ্যাক্ট" : "React")}</span>
          </button>

          {showReactionsMenu && (
            <div className="absolute left-0 bottom-10 bg-white dark:bg-slate-800 border border-gray-155 dark:border-slate-750 rounded-full shadow-xl px-2 py-1.5 flex gap-2.5 z-20 animate-in slide-in-from-bottom-2 duration-150">
              {emojiList.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    handleReact(emoji);
                    setShowReactionsMenu(false);
                  }}
                  className="text-xl hover:scale-130 active:scale-100 transition hover:cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Comment Button */}
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 px-4 py-2 hover:bg-orange-50/50 dark:hover:bg-slate-700/50 rounded-full text-xs font-bold text-gray-655 dark:text-gray-300 transition hover:cursor-pointer"
        >
          <MessageCircle size={15} />
          <span>{lang === "bn" ? "মন্তব্য করুন" : "Comment"}</span>
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="mt-4 border-t border-gray-50 dark:border-slate-700/55 pt-4 space-y-4">
          {loadingComments && comments.length === 0 ? (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Comment submission form */}
              <form onSubmit={(e) => handleAddComment(e)} className="flex items-center gap-3">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={t("writeComment")}
                  className="flex-grow px-4 py-2 text-xs rounded-full border border-gray-200 dark:border-slate-700 bg-transparent text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
                  required
                />
                <button
                  type="submit"
                  className="p-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full transition flex items-center justify-center hover:cursor-pointer shrink-0"
                >
                  <Send size={12} />
                </button>
              </form>

              {/* Comments list */}
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 py-4 italic">
                    {lang === "bn" ? "কোনো মন্তব্য নেই" : "No comments yet"}
                  </p>
                ) : (
                  comments.map((comment) => {
                    const isMyComment = comment.userId === userId;
                    const canDelete = isMyComment || role === "manager";

                    return (
                      <div key={comment._id} className="space-y-3">
                        {/* Parent Comment */}
                        <div className="flex gap-2.5 items-start">
                          {comment.userImage ? (
                            <Image src={comment.userImage} alt={comment.userName} width={32} height={32} className="w-8 h-8 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-8 h-8 bg-orange-100 dark:bg-slate-700 text-orange-600 dark:text-orange-400 font-semibold text-xs rounded-full flex items-center justify-center shrink-0">
                              {comment.userName?.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div className="flex-grow min-w-0">
                            <div className="bg-gray-50 dark:bg-slate-750/70 p-3 rounded-2xl">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-xs text-gray-850 dark:text-gray-200">{comment.userName}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] text-gray-400 dark:text-gray-550">{formatDate(comment.createdAt)}</span>
                                  {isMyComment && (
                                    <button
                                      onClick={() => {
                                        setEditingCommentId(comment._id);
                                        setEditingText(comment.commentText);
                                      }}
                                      className="text-gray-400 hover:text-orange-500"
                                    >
                                      <Edit2 size={10} />
                                    </button>
                                  )}
                                  {canDelete && (
                                    <button
                                      onClick={() => onDeleteComment(comment._id)}
                                      className="text-gray-400 hover:text-red-500"
                                    >
                                      <Trash2 size={10} />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {editingCommentId === comment._id ? (
                                <div className="flex items-center gap-2 mt-1">
                                  <input
                                    type="text"
                                    value={editingText}
                                    onChange={(e) => setEditingText(e.target.value)}
                                    className="flex-grow px-2 py-1 text-xs border rounded bg-transparent text-gray-850 dark:text-white"
                                  />
                                  <button
                                    onClick={() => handleEditComment(comment._id)}
                                    className="p-1 text-xs bg-orange-500 text-white rounded hover:cursor-pointer"
                                  >
                                    <Check size={10} />
                                  </button>
                                  <button
                                    onClick={() => setEditingCommentId(null)}
                                    className="p-1 text-xs border rounded hover:cursor-pointer"
                                  >
                                    <X size={10} />
                                  </button>
                                </div>
                              ) : (
                                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{comment.commentText}</p>
                              )}
                            </div>

                            {/* Interactions */}
                            <div className="flex items-center gap-3 px-2 mt-1">
                              <button
                                onClick={() => {
                                  setReplyToId(comment._id);
                                  setReplyText("");
                                }}
                                className="text-[10px] font-bold text-gray-500 dark:text-gray-450 hover:text-orange-500 transition flex items-center gap-1 hover:cursor-pointer"
                              >
                                <Reply size={10} /> {t("reply")}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Comment Replies list (Nested 1 Level) */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="pl-10 space-y-3">
                            {comment.replies.map((reply) => {
                              const isMyReply = reply.userId === userId;
                              const canDeleteReply = isMyReply || role === "manager";

                              return (
                                <div key={reply._id} className="flex gap-2.5 items-start">
                                  {reply.userImage ? (
                                    <Image src={reply.userImage} alt={reply.userName} width={26} height={26} className="w-6.5 h-6.5 rounded-full object-cover shrink-0" />
                                  ) : (
                                    <div className="w-6.5 h-6.5 bg-orange-100 dark:bg-slate-700 text-orange-600 dark:text-orange-400 font-semibold text-[10px] rounded-full flex items-center justify-center shrink-0">
                                      {reply.userName?.charAt(0).toUpperCase()}
                                    </div>
                                  )}

                                  <div className="flex-grow min-w-0">
                                    <div className="bg-gray-50 dark:bg-slate-750/50 p-2.5 rounded-xl">
                                      <div className="flex justify-between items-center mb-0.5">
                                        <span className="font-bold text-[11px] text-gray-800 dark:text-gray-250">{reply.userName}</span>
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[8px] text-gray-400 dark:text-gray-550">{formatDate(reply.createdAt)}</span>
                                          {isMyReply && (
                                            <button
                                              onClick={() => {
                                                setEditingCommentId(reply._id);
                                                setEditingText(reply.commentText);
                                              }}
                                              className="text-gray-400 hover:text-orange-500"
                                            >
                                              <Edit2 size={9} />
                                            </button>
                                          )}
                                          {canDeleteReply && (
                                            <button
                                              onClick={() => onDeleteComment(reply._id)}
                                              className="text-gray-400 hover:text-red-500"
                                            >
                                              <Trash2 size={9} />
                                            </button>
                                          )}
                                        </div>
                                      </div>

                                      {editingCommentId === reply._id ? (
                                        <div className="flex items-center gap-2 mt-1">
                                          <input
                                            type="text"
                                            value={editingText}
                                            onChange={(e) => setEditingText(e.target.value)}
                                            className="flex-grow px-2 py-0.5 text-xs border rounded bg-transparent text-gray-850 dark:text-white"
                                          />
                                          <button
                                            onClick={() => handleEditComment(reply._id)}
                                            className="p-1 text-xs bg-orange-500 text-white rounded hover:cursor-pointer"
                                          >
                                            <Check size={8} />
                                          </button>
                                          <button
                                            onClick={() => setEditingCommentId(null)}
                                            className="p-1 text-xs border rounded hover:cursor-pointer"
                                          >
                                            <X size={8} />
                                          </button>
                                        </div>
                                      ) : (
                                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-normal whitespace-pre-wrap">{reply.commentText}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Reply Form */}
                        {replyToId === comment._id && (
                          <form onSubmit={(e) => handleAddComment(e, comment._id)} className="pl-10 flex items-center gap-3">
                            <input
                              type="text"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder={t("writeReply")}
                              className="flex-grow px-3 py-1.5 text-xs rounded-full border border-gray-200 dark:border-slate-700 bg-transparent text-gray-800 dark:text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
                              required
                            />
                            <button
                              type="submit"
                              className="p-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-full transition flex items-center justify-center hover:cursor-pointer shrink-0"
                            >
                              <Send size={10} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setReplyToId(null)}
                              className="p-1.5 border border-gray-250 dark:border-slate-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full transition hover:cursor-pointer"
                            >
                              <X size={10} />
                            </button>
                          </form>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      )}


      {/* Reactions Details Modal */}
      {showReactionsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-155 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
              <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Smile size={16} className="text-orange-500" />
                <span>{lang === "bn" ? "রিঅ্যাকশন সমূহ" : "Reactions"}</span>
              </h3>
              <button
                onClick={() => setShowReactionsModal(false)}
                className="text-gray-400 hover:text-gray-650 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition hover:cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* List */}
            <div className="p-6 max-h-80 overflow-y-auto space-y-4">
              {loadingReactions ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-gray-400">{lang === "bn" ? "লোড হচ্ছে..." : "Loading..."}</span>
                </div>
              ) : detailedReactions.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-6">
                  {lang === "bn" ? "কোনো রিঅ্যাকশন পাওয়া যায়নি" : "No reactions found"}
                </p>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-slate-800">
                  {detailedReactions.map((r, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        {r.userImage ? (
                          <Image src={r.userImage} alt={r.userName} width={32} height={32} className="w-8 h-8 rounded-full object-cover border border-gray-100 dark:border-slate-800" />
                        ) : (
                          <div className="w-8 h-8 bg-orange-100 dark:bg-slate-700 text-orange-600 dark:text-orange-400 font-bold text-xs rounded-full flex items-center justify-center">
                            {r.userName?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-xs font-semibold text-gray-800 dark:text-gray-250">{r.userName}</span>
                      </div>
                      <span className="text-lg bg-orange-50 dark:bg-slate-800 px-2 py-0.5 rounded-xl border border-orange-100/50 dark:border-slate-700/50">{r.type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
