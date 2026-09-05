"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useSocket } from "@/components/providers/SocketProvider";
import { useTranslation } from "@/lib/useTranslation";
import {
  Send,
  X,
  Trash2,
  Users,
  MessageCircle,
  Loader2,
  ExternalLink,
  ChevronDown,
  Info,
  ShieldCheck,
  User,
  PlusCircle,
  LogIn,
  Plus,
  BarChart2,
  ShoppingCart,
  Check,
  CheckCheck,
  CheckSquare,
  Square,
  Pin,
  PinOff,
  AlertTriangle,
  Volume2,
  VolumeX,
  Eye,
  Smile,
  ChevronLeft,
  Bell,
  BellOff,
} from "lucide-react";
import { toast } from "sonner";

export const dynamic = "force-dynamic";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

// Helper: Web Audio API sound chime (no external audio assets required)
function playChimeSound(isAlert = false) {
  try {
    if (typeof window === "undefined") return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    if (isAlert) {
      // High-visibility Emergency Alert Chime (two-tone urgent beep)
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, now); // A5
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1174.66, now + 0.16); // D6
      gain2.gain.setValueAtTime(0.25, now + 0.16);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.16);
      osc2.stop(now + 0.38);
    } else {
      // Pleasant new message notification chime (D5 -> A5)
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);
    }
  } catch (e) {
    // Ignore autoplay restriction errors if user hasn't interacted yet
  }
}

// Helper: Format message time
function formatMessageTime(dateString) {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return "";
  }
}

// Helper: Format date divider
function formatDateDivider(dateString, isBn) {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return isBn ? "আজ" : "Today";
    }
    if (d.toDateString() === yesterday.toDateString()) {
      return isBn ? "গতকাল" : "Yesterday";
    }
    return d.toLocaleDateString(isBn ? "bn-BD" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch (e) {
    return "";
  }
}

// Helper: Convert English numbers to Bengali digits
function toBnNumber(n) {
  if (n === null || n === undefined) return "";
  const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(n).replace(/\d/g, (d) => bnDigits[d]);
}

// Auto linkify text
function LinkifiedText({ text }) {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return (
    <span className="whitespace-pre-wrap break-words">
      {parts.map((part, i) =>
        urlRegex.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-amber-200 hover:text-white font-medium inline-flex items-center gap-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            {part} <ExternalLink size={12} className="inline ml-0.5 opacity-80" />
          </a>
        ) : (
          part
        )
      )}
    </span>
  );
}

export default function MessChatPage() {
  const router = useRouter();
  const { t, lang } = useTranslation();
  const isBn = lang === "bn";

  const { data: session, isPending: sessionPending } = authClient.useSession();
  const currentUser = session?.user;
  const currentUserId = currentUser?.id;

  const { socket, messId: socketMessId, setChatUnreadCount, requestPushPermission } = useSocket();

  // Push notification permission state
  const [pushPermission, setPushPermission] = useState("granted");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushPermission(Notification.permission);

      if (Notification.permission === "default" && requestPushPermission) {
        const timer = setTimeout(() => {
          toast("🔔 মেসেঞ্জার নোটিফিকেশন চালু করুন", {
            description: isBn
              ? "অ্যাপ বন্ধ থাকলেও সরাসরি ফোনে মেসেজের নোটিফিকেশন পেতে চান?"
              : "Get message alerts on your phone screen even when outside the app.",
            duration: 9000,
            action: {
              label: isBn ? "অনুমতি দিন" : "Enable",
              onClick: () => handleEnablePush(),
            },
          });
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [requestPushPermission, isBn]);

  const handleEnablePush = async () => {
    if (requestPushPermission) {
      const granted = await requestPushPermission();
      if (granted) {
        setPushPermission("granted");
        toast.success(
          isBn
            ? "পুশ নোটিফিকেশন চালু হয়েছে! এখন অ্যাপের বাইরে থাকলেও মেসেজ পাবেন।"
            : "Push notifications enabled! You'll now receive messages even outside the app."
        );
      } else {
        toast.info(
          isBn
            ? "নোটিফিকেশনের অনুমতি দেওয়া হয়নি।"
            : "Notification permission was not granted."
        );
      }
    }
  };

  // Reset unread chat counter when inside chat room
  useEffect(() => {
    if (setChatUnreadCount) {
      setChatUnreadCount(0);
    }
  }, [setChatUnreadCount]);

  // Local state
  const [messId, setMessId] = useState(socketMessId || null);
  const [messDetails, setMessDetails] = useState(null);
  const [userRole, setUserRole] = useState("member");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeCount, setActiveCount] = useState(1);

  // Input state
  const [inputText, setInputText] = useState("");

  // Typing state
  const [typingUsers, setTypingUsers] = useState(new Set());
  const typingTimeoutRef = useRef(null);

  // UI state
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const actionMenuRef = useRef(null);
  const actionBtnRef = useRef(null);
  const [highlightedMsgId, setHighlightedMsgId] = useState(null);
  const [viewSeenCandidate, setViewSeenCandidate] = useState(null);
  const [activeReactionMenuMsgId, setActiveReactionMenuMsgId] = useState(null);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Close Action Menu & Reaction Picker when clicking outside
  useEffect(() => {
    if (!showActionMenu && !activeReactionMenuMsgId) return;

    const handleClickOutside = (e) => {
      // Close Action Menu if click is outside both menu popover and + toggle button
      if (
        showActionMenu &&
        actionMenuRef.current &&
        !actionMenuRef.current.contains(e.target) &&
        actionBtnRef.current &&
        !actionBtnRef.current.contains(e.target)
      ) {
        setShowActionMenu(false);
      }

      // Close reaction picker if click is outside
      if (
        activeReactionMenuMsgId &&
        !e.target.closest?.(".reaction-picker-popover") &&
        !e.target.closest?.(".reaction-trigger-btn")
      ) {
        setActiveReactionMenuMsgId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showActionMenu, activeReactionMenuMsgId]);

  // Sound Notification state (Task 4)
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundEnabledRef = useRef(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("easymess_chat_sound");
      if (stored !== null) {
        const val = stored === "true";
        setSoundEnabled(val);
        soundEnabledRef.current = val;
      }
    }
  }, []);

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      soundEnabledRef.current = next;
      if (typeof window !== "undefined") {
        localStorage.setItem("easymess_chat_sound", String(next));
      }
      if (next) playChimeSound(false);
      return next;
    });
  };

  // Feature Modals: Poll, Bazaar & Emergency Alert (Tasks 1 & 2)
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  const [showBazaarModal, setShowBazaarModal] = useState(false);
  const [bazaarTitle, setBazaarTitle] = useState("");
  const [bazaarBudget, setBazaarBudget] = useState("");
  const [bazaarItems, setBazaarItems] = useState(["", ""]);

  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyTitle, setEmergencyTitle] = useState("");
  const [emergencyNote, setEmergencyNote] = useState("");

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // 1. Sync messId from socket provider or fetch fallback
  useEffect(() => {
    if (socketMessId) {
      setMessId(socketMessId);
    } else if (currentUserId) {
      fetch(`${API_BASE}/api/member/messid/${currentUserId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.messId) setMessId(data.messId);
          else setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [socketMessId, currentUserId]);

  // 2. Fetch mess details & user role
  useEffect(() => {
    if (!currentUserId || !messId) return;

    // Load cached role
    if (typeof window !== "undefined") {
      const cachedRole = sessionStorage.getItem(`user_role_${currentUserId}`);
      if (cachedRole) setUserRole(cachedRole);
    }

    // Load mess details
    fetch(`${API_BASE}/api/user/my-mess/${currentUserId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.messName) {
          setMessDetails(data);
        } else if (data.mess) {
          setMessDetails(data.mess);
        }
      })
      .catch((err) => console.error("Error fetching mess info:", err));
  }, [currentUserId, messId]);

  // 3. Fetch initial messages
  const fetchMessages = useCallback(async () => {
    if (!messId) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/mess/${messId}/messages?limit=80`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMessages(data.data);
      }
    } catch (err) {
      console.error("Error loading chat messages:", err);
    } finally {
      setLoading(false);
    }
  }, [messId]);

  useEffect(() => {
    if (messId) {
      fetchMessages();
    }
  }, [messId, fetchMessages]);

  // 4. Auto scroll to bottom
  const scrollToBottom = useCallback((behavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  }, []);

  useEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom("auto");
    }
  }, [loading, scrollToBottom]);

  // Scroll detection for "Scroll to bottom" button
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 180;
    setShowScrollBottom(isUp);
  };

  // 5. Setup Socket.io real-time listeners
  useEffect(() => {
    if (!socket || !messId) return;

    // Ensure user has joined mess room with userId for active tracking
    socket.emit("join-mess", { messId, userId: currentUserId });

    // Request initial active count
    socket.emit("get-mess-active-count", messId, (res) => {
      if (res?.activeCount) setActiveCount(res.activeCount);
    });

    // Active count listener
    const handleActiveCount = (data) => {
      if (data && String(data.messId) === String(messId)) {
        setActiveCount(data.activeCount || 1);
      }
    };

    // New message listener
    const handleNewMessage = (newMsg) => {
      if (!newMsg || String(newMsg.messId) !== String(messId)) return;
      setMessages((prev) => {
        // Prevent duplicate messages
        if (prev.some((m) => String(m._id) === String(newMsg._id))) {
          return prev;
        }
        return [...prev, newMsg];
      });

      // Play sound chime if message is from another member & sound is enabled
      const isFromOther = String(newMsg.sender?.userId) !== String(currentUserId);
      if (isFromOther && soundEnabledRef.current) {
        playChimeSound(newMsg.type === "emergency_alert");
      }

      setTimeout(() => scrollToBottom("smooth"), 100);
    };

    // Message deleted listener
    const handleMessageDeleted = ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => String(m._id) !== String(messageId)));
    };

    // Pin updated listener
    const handlePinUpdated = ({ messageId, isPinned }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (String(m._id) === String(messageId)) {
            return { ...m, isPinned: !!isPinned };
          }
          if (isPinned) {
            return { ...m, isPinned: false };
          }
          return m;
        })
      );
    };

    // User typing listener
    const handleUserTyping = ({ userName, userId }) => {
      if (userId && String(userId) !== String(currentUserId)) {
        setTypingUsers((prev) => new Set(prev).add(userName || "Someone"));
      }
    };

    // User stop typing listener
    const handleUserStopTyping = ({ userId }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        return new Set();
      });
    };

    // Poll updated listener
    const handlePollUpdated = ({ messageId, options }) => {
      setMessages((prev) =>
        prev.map((m) =>
          String(m._id) === String(messageId)
            ? { ...m, poll: { ...m.poll, options } }
            : m
        )
      );
    };

    // Bazaar list updated listener
    const handleBazaarUpdated = ({ messageId, items }) => {
      setMessages((prev) =>
        prev.map((m) =>
          String(m._id) === String(messageId)
            ? { ...m, bazaarList: { ...m.bazaarList, items } }
            : m
        )
      );
    };

    // Messages seen listener
    const handleMessagesSeen = ({ messageIds, seenUser }) => {
      if (!Array.isArray(messageIds) || !seenUser) return;
      const idSet = new Set(messageIds.map(String));
      setMessages((prev) =>
        prev.map((m) => {
          if (idSet.has(String(m._id))) {
            const existing = m.seenBy || [];
            if (!existing.some((s) => String(s.userId) === String(seenUser.userId))) {
              return { ...m, seenBy: [...existing, seenUser] };
            }
          }
          return m;
        })
      );
    };

    // Reaction updated listener
    const handleReactionUpdated = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) =>
          String(m._id) === String(messageId)
            ? { ...m, reactions }
            : m
        )
      );
    };

    socket.on("mess-active-count", handleActiveCount);
    socket.on("new-mess-message", handleNewMessage);
    socket.on("mess-message-deleted", handleMessageDeleted);
    socket.on("mess-pin-updated", handlePinUpdated);
    socket.on("mess-messages-seen", handleMessagesSeen);
    socket.on("mess-reaction-updated", handleReactionUpdated);
    socket.on("user-typing", handleUserTyping);
    socket.on("user-stop-typing", handleUserStopTyping);
    socket.on("mess-poll-updated", handlePollUpdated);
    socket.on("mess-bazaar-updated", handleBazaarUpdated);

    return () => {
      socket.off("mess-active-count", handleActiveCount);
      socket.off("new-mess-message", handleNewMessage);
      socket.off("mess-message-deleted", handleMessageDeleted);
      socket.off("mess-pin-updated", handlePinUpdated);
      socket.off("mess-messages-seen", handleMessagesSeen);
      socket.off("mess-reaction-updated", handleReactionUpdated);
      socket.off("user-typing", handleUserTyping);
      socket.off("user-stop-typing", handleUserStopTyping);
      socket.off("mess-poll-updated", handlePollUpdated);
      socket.off("mess-bazaar-updated", handleBazaarUpdated);
    };
  }, [socket, messId, currentUserId, scrollToBottom]);

  // Auto-mark unseen messages as seen
  useEffect(() => {
    if (!socket?.connected || !messId || !currentUserId || messages.length === 0) return;

    const unreadIds = messages
      .filter(
        (m) =>
          m._id &&
          String(m.sender?.userId) !== String(currentUserId) &&
          !m.seenBy?.some((s) => String(s.userId) === String(currentUserId))
      )
      .map((m) => m._id);

    if (unreadIds.length > 0) {
      socket.emit("mark-mess-seen", {
        messId,
        userId: currentUserId,
        userName: currentUser?.name || "Member",
        userAvatar: currentUser?.image || null,
        messageIds: unreadIds,
      });
      if (setChatUnreadCount) {
        setChatUnreadCount(0);
      }
    }
  }, [messages, socket, messId, currentUserId, currentUser, setChatUnreadCount]);

  // 6. Handle Typing indicator trigger with debounce
  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (!socket || !messId) return;

    socket.emit("typing-start", {
      messId,
      userName: currentUser?.name || "Someone",
      userId: currentUserId,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing-stop", { messId, userId: currentUserId });
    }, 2500);
  };

  // 7. Send Message handler
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const trimmedText = inputText.trim();

    if (!trimmedText) return;
    if (!messId || !currentUserId) {
      toast.error(isBn ? "মেস আইডি পাওয়া যায়নি।" : "Mess ID not found.");
      return;
    }

    setSending(true);

    try {
      const payload = {
        messId,
        sender: {
          userId: currentUserId,
          name: currentUser?.name || "Member",
          avatar: currentUser?.image || null,
          role: userRole,
        },
        text: trimmedText,
      };

      // Stop typing
      if (socket) {
        socket.emit("typing-stop", { messId, userId: currentUserId });
      }

      // Try Socket first for real-time speed, fallback to HTTP
      let sentSuccessfully = false;
      if (socket?.connected) {
        socket.emit("send-mess-message", payload, (ack) => {
          if (ack && ack.success) {
            sentSuccessfully = true;
          }
        });
        sentSuccessfully = true;
      }

      if (!sentSuccessfully) {
        const res = await fetch(`${API_BASE}/api/mess/${messId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success && data.data) {
          setMessages((prev) => {
            if (prev.some((m) => String(m._id) === String(data.data._id))) return prev;
            return [...prev, data.data];
          });
        }
      }

      // Clear input
      setInputText("");
      setTimeout(() => scrollToBottom("smooth"), 100);
    } catch (err) {
      console.error("Send message error:", err);
      toast.error(isBn ? "মেসেজ পাঠানো ব্যর্থ হয়েছে।" : "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  // 8. Handle Vote on a Poll
  const handleVote = (messageId, optionIndex) => {
    if (!socket || !messId || !currentUserId) return;

    // Optimistic UI update
    setMessages((prev) =>
      prev.map((m) => {
        if (String(m._id) === String(messageId) && m.poll?.options) {
          const uIdStr = currentUserId.toString();
          const newOptions = m.poll.options.map((opt, idx) => {
            const votes = Array.isArray(opt.votes) ? opt.votes.map(String) : [];
            const filtered = votes.filter((v) => v !== uIdStr);
            if (idx === optionIndex) filtered.push(uIdStr);
            return { ...opt, votes: filtered };
          });
          return { ...m, poll: { ...m.poll, options: newOptions } };
        }
        return m;
      })
    );

    socket.emit("vote-mess-poll", {
      messId,
      messageId,
      optionIndex,
      userId: currentUserId,
    });
  };

  // 9. Handle Toggle Bazaar Checklist Item
  const handleToggleBazaarItem = (messageId, itemIndex) => {
    if (!socket || !messId) return;

    // Optimistic UI update
    setMessages((prev) =>
      prev.map((m) => {
        if (String(m._id) === String(messageId) && m.bazaarList?.items) {
          const newItems = [...m.bazaarList.items];
          if (newItems[itemIndex]) {
            newItems[itemIndex] = {
              ...newItems[itemIndex],
              completed: !newItems[itemIndex].completed,
            };
          }
          return { ...m, bazaarList: { ...m.bazaarList, items: newItems } };
        }
        return m;
      })
    );

    socket.emit("toggle-bazaar-item", {
      messId,
      messageId,
      itemIndex,
    });
  };

  // 10. Create Poll Handler
  const handleCreatePoll = async (e) => {
    e.preventDefault();
    const q = pollQuestion.trim();
    const opts = pollOptions.map((o) => o.trim()).filter(Boolean);

    if (!q) {
      toast.error(isBn ? "পোলের প্রশ্ন লিখুন।" : "Please enter the poll question.");
      return;
    }
    if (opts.length < 2) {
      toast.error(isBn ? "কমপক্ষে ২টি অপশন লিখুন।" : "Please provide at least 2 options.");
      return;
    }

    const payload = {
      messId,
      sender: {
        userId: currentUserId,
        name: currentUser?.name || "Member",
        avatar: currentUser?.image || null,
        role: userRole,
      },
      type: "poll",
      poll: {
        question: q,
        options: opts.map((text) => ({ text, votes: [] })),
      },
    };

    if (socket?.connected) {
      socket.emit("send-mess-message", payload);
    } else {
      await fetch(`${API_BASE}/api/mess/${messId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setShowPollModal(false);
    setPollQuestion("");
    setPollOptions(["", ""]);
    toast.success(isBn ? "পোল পোস্ট করা হয়েছে!" : "Poll created successfully!");
  };

  // 11. Create Bazaar List Handler
  const handleCreateBazaarList = async (e) => {
    e.preventDefault();
    const items = bazaarItems.map((i) => i.trim()).filter(Boolean);

    if (items.length === 0) {
      toast.error(isBn ? "কমপক্ষে একটি বাজারের আইটেম লিখুন।" : "Add at least one item.");
      return;
    }

    const payload = {
      messId,
      sender: {
        userId: currentUserId,
        name: currentUser?.name || "Member",
        avatar: currentUser?.image || null,
        role: userRole,
      },
      type: "bazaar_list",
      bazaarList: {
        title: bazaarTitle.trim() || (isBn ? "বাজারের ফর্দ" : "Bazaar Checklist"),
        budget: bazaarBudget.trim(),
        items: items.map((text) => ({ text, completed: false })),
      },
    };

    if (socket?.connected) {
      socket.emit("send-mess-message", payload);
    } else {
      await fetch(`${API_BASE}/api/mess/${messId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setShowBazaarModal(false);
    setBazaarTitle("");
    setBazaarBudget("");
    setBazaarItems(["", ""]);
    toast.success(isBn ? "বাজার লিস্ট পাঠানো হয়েছে!" : "Bazaar list shared!");
  };

  // 12. Send Emergency Alert Handler (Task 2)
  const handleSendEmergencyAlert = async (e) => {
    if (e) e.preventDefault();
    const title = emergencyTitle.trim();
    if (!title) {
      toast.error(isBn ? "অ্যালার্টের বিষয়/শিরোনাম লিখুন।" : "Please enter an alert title.");
      return;
    }
    if (!messId || !currentUserId) return;

    const payload = {
      messId,
      sender: {
        userId: currentUserId,
        name: currentUser?.name || "Member",
        avatar: currentUser?.image || null,
        role: userRole,
      },
      type: "emergency_alert",
      text: emergencyNote.trim() ? `${title}: ${emergencyNote.trim()}` : title,
      emergencyAlert: {
        title,
        note: emergencyNote.trim(),
      },
    };

    if (socket?.connected) {
      socket.emit("send-mess-message", payload);
    } else {
      await fetch(`${API_BASE}/api/mess/${messId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setShowEmergencyModal(false);
    setEmergencyTitle("");
    setEmergencyNote("");
    toast.success(isBn ? "জরুরি অ্যালার্ট পাঠানো হয়েছে! 🚨" : "Emergency alert sent! 🚨");
  };

  // 13. Pin / Unpin message handler (Task 1)
  const handleTogglePin = (msg) => {
    if (!socket || !messId || !msg?._id) return;
    const targetPinned = !msg.isPinned;

    // Optimistic UI update
    setMessages((prev) =>
      prev.map((m) => {
        if (String(m._id) === String(msg._id)) {
          return { ...m, isPinned: targetPinned };
        }
        if (targetPinned) {
          return { ...m, isPinned: false };
        }
        return m;
      })
    );

    socket.emit("pin-mess-message", {
      messId,
      messageId: msg._id,
      isPinned: targetPinned,
    });

    toast.success(
      targetPinned
        ? (isBn ? "মেসেজ পিন করা হয়েছে 📌" : "Message pinned to top 📌")
        : (isBn ? "মেসেজ আনপিন করা হয়েছে" : "Message unpinned")
    );
  };

  // 14. Scroll to pinned message
  const scrollToPinnedMessage = (messageId) => {
    if (!messageId) return;
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMsgId(messageId);
      setTimeout(() => setHighlightedMsgId(null), 2200);
    } else {
      toast.info(isBn ? "মেসেজটি স্ক্রিনে নেই" : "Message not in current view");
    }
  };

  // 15. Delete Message handler
  const confirmDeleteMessage = async () => {
    if (!deleteCandidate || !messId) return;

    try {
      if (socket?.connected) {
        socket.emit("delete-mess-message", {
          messId,
          messageId: deleteCandidate._id,
          userId: currentUserId,
        });
      }

      // Also call REST endpoint to guarantee deletion
      await fetch(
        `${API_BASE}/api/mess/${messId}/messages/${deleteCandidate._id}?userId=${currentUserId}`,
        { method: "DELETE" }
      );

      setMessages((prev) => prev.filter((m) => m._id !== deleteCandidate._id));
      toast.success(isBn ? "মেসেজ মুছে ফেলা হয়েছে" : "Message deleted");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(isBn ? "মেসেজ মোছা সম্ভব হয়নি" : "Failed to delete message");
    } finally {
      setDeleteCandidate(null);
    }
  };

  // 16. Toggle Emoji Reaction on a message
  const handleToggleReaction = (messageId, emoji) => {
    if (!socket || !messId || !currentUserId || !messageId || !emoji) return;

    // Optimistic UI update
    setMessages((prev) =>
      prev.map((m) => {
        if (String(m._id) === String(messageId)) {
          const existing = Array.isArray(m.reactions) ? m.reactions : [];
          const uIdStr = String(currentUserId);
          const hasReacted = existing.some(
            (r) => r.emoji === emoji && String(r.userId) === uIdStr
          );
          const updated = hasReacted
            ? existing.filter((r) => !(r.emoji === emoji && String(r.userId) === uIdStr))
            : [...existing, { emoji, userId: uIdStr, userName: currentUser?.name || "Member" }];
          return { ...m, reactions: updated };
        }
        return m;
      })
    );

    socket.emit("react-mess-message", {
      messId,
      messageId,
      emoji,
      userId: currentUserId,
      userName: currentUser?.name || "Member",
    });

    setActiveReactionMenuMsgId(null);
  };

  // Key press listener for Enter to send
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // RENDER: Loading state
  if (sessionPending) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-3" />
        <p className="text-gray-500 text-sm">{isBn ? "লোড হচ্ছে..." : "Loading..."}</p>
      </div>
    );
  }

  // RENDER: Not logged in
  if (!currentUserId) {
    return (
      <div className="min-h-[85vh] max-w-md mx-auto px-4 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-3xl bg-orange-100 dark:bg-orange-950/40 text-orange-600 flex items-center justify-center mb-4 shadow-inner">
          <LogIn size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          {isBn ? "লগইন প্রয়োজন" : "Authentication Required"}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          {isBn
            ? "মেসের চ্যাটে অংশ নিতে অনুগ্রহ করে আপনার অ্যাকাউন্টে লগইন করুন।"
            : "Please sign in to your account to participate in your mess chat."}
        </p>
        <Link
          href="/signin"
          className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-lg shadow-orange-500/25 hover:opacity-95 transition-all"
        >
          {isBn ? "লগইন করুন" : "Sign In"}
        </Link>
      </div>
    );
  }

  // RENDER: Not joined in any mess
  if (!loading && !messId) {
    return (
      <div className="min-h-[85vh] max-w-lg mx-auto px-4 py-8 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-100 to-orange-100 dark:from-slate-800 dark:to-orange-950/40 text-orange-500 flex items-center justify-center mb-5 shadow-lg shadow-orange-500/10 border border-orange-200/50 dark:border-orange-500/20">
          <MessageCircle size={40} className="stroke-[1.8]" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          {isBn ? "আপনি কোনো মেসে যুক্ত নন" : "No Mess Joined Yet"}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 max-w-sm">
          {isBn
            ? "গ্রুপ চ্যাট ব্যবহার করার জন্য আপনাকে একটি মেসের সদস্য হতে হবে অথবা নিজের একটি মেস তৈরি করতে হবে।"
            : "To access the mess group chat, you need to belong to a mess or create your own."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <Link
            href="/join-mess"
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-center shadow-lg shadow-orange-500/25 hover:opacity-95 transition-all"
          >
            {isBn ? "মেসে যুক্ত হন" : "Join a Mess"}
          </Link>
          <Link
            href="/create-mess"
            className="flex-1 py-3 px-4 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 font-semibold text-center hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all"
          >
            {isBn ? "নতুন মেস তৈরি করুন" : "Create Mess"}
          </Link>
        </div>
      </div>
    );
  }

  // RENDER: Full Mess Chat Room
  return (
    <div className="w-full flex-1 flex flex-col h-[calc(100dvh-8.5rem)] md:h-[calc(100dvh-5.5rem)] min-h-0 bg-gradient-to-br from-[#FAF2E8] via-[#FCF7F0] to-[#FFFDFB] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors">
      <div className="max-w-4xl w-full mx-auto px-2 sm:px-4 pt-1.5 pb-2 md:py-3 flex-1 flex flex-col min-h-0">
        {/* 1. CHAT HEADER */}
        <div className="shrink-0 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-[#EFE2D2]/90 dark:border-slate-800/80 rounded-2xl p-2.5 sm:p-3 shadow-xs flex items-center justify-between mb-2 transition-all">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Back button for mobile */}
          <Link
            href="/dashboard"
            className="sm:hidden w-8 h-8 rounded-xl flex items-center justify-center -ml-1 text-gray-500 dark:text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            title={isBn ? "ফিরে যান" : "Back"}
          >
            <ChevronLeft size={20} />
          </Link>

          {/* Mess Avatar */}
          <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-sm shadow-orange-500/20 shrink-0 overflow-hidden">
            {messDetails?.messImage ? (
              <Image
                src={messDetails.messImage}
                alt={messDetails.messName || "Mess"}
                fill
                className="object-cover"
              />
            ) : (
              <span>{messDetails?.messName?.[0]?.toUpperCase() || "M"}</span>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
          </div>

          {/* Mess Name & Live Active Status */}
          <div className="min-w-0 flex-1 pr-1">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 truncate leading-tight">
                {messDetails?.messName || (isBn ? "মেস চ্যাট" : "Mess Chat")}
              </h1>
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 shrink-0">
                <Users size={11} />
                {isBn ? "মেস গ্রুপ" : "Mess Group"}
              </span>
            </div>

            <p className="text-[11px] sm:text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium whitespace-nowrap mt-0.5">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="whitespace-nowrap">
                {isBn
                  ? `${toBnNumber(activeCount)} জন অ্যাক্টিভ`
                  : `${activeCount} Active`}
              </span>
              {messDetails?.totalMembers ? (
                <span className="text-gray-400 dark:text-gray-500 font-normal whitespace-nowrap">
                  • {isBn ? `মোট ${toBnNumber(messDetails.totalMembers)} জন` : `${messDetails.totalMembers} members`}
                </span>
              ) : null}
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Sound Mute/Unmute Toggle (Task 4) */}
          <button
            type="button"
            onClick={toggleSound}
            title={soundEnabled ? (isBn ? "সাউন্ড বন্ধ করুন" : "Mute Sound") : (isBn ? "সাউন্ড চালু করুন" : "Unmute Sound")}
            aria-label={soundEnabled ? "Mute notifications" : "Unmute notifications"}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
              soundEnabled
                ? "bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-200/60 dark:border-orange-500/30 hover:bg-orange-100"
                : "bg-gray-100 dark:bg-slate-800 text-gray-400 border-gray-200 dark:border-slate-700 hover:text-gray-600"
            }`}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Action Link to Mess Overview */}
          <Link
            href={
              userRole === "manager"
                ? "/dashboard/manager-dashboard/my-mess"
                : "/dashboard/user-dashboard/my-mess"
            }
            className="w-8 h-8 sm:w-auto sm:px-3 sm:py-1.5 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-slate-700 transition-all cursor-pointer"
            title={isBn ? "মেস তথ্য" : "Mess Info"}
          >
            <Info size={16} />
            <span className="hidden sm:inline">{isBn ? "মেস তথ্য" : "Mess Info"}</span>
          </Link>
        </div>
      </div>

      {/* 1.5. PINNED MESSAGE BANNER (Task 1) */}
      {(() => {
        const pinnedMsg = messages.find((m) => m.isPinned);
        if (!pinnedMsg) return null;

        const isManager = userRole === "manager";
        const isAuthor = String(pinnedMsg.sender?.userId) === String(currentUserId);
        const canUnpin = isManager || isAuthor;

        let snippet = pinnedMsg.text || "";
        if (pinnedMsg.poll?.question) {
          snippet = `📊 ${isBn ? "পোল" : "Poll"}: ${pinnedMsg.poll.question}`;
        } else if (pinnedMsg.bazaarList?.title) {
          snippet = `🛒 ${isBn ? "বাজার" : "Bazaar"}: ${pinnedMsg.bazaarList.title}`;
        } else if (pinnedMsg.emergencyAlert?.title) {
          snippet = `🚨 ${isBn ? "জরুরি" : "Alert"}: ${pinnedMsg.emergencyAlert.title}`;
        }

        return (
          <div className="shrink-0 mb-2 bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border border-amber-300/70 dark:border-amber-500/30 rounded-2xl px-3.5 py-2 shadow-[0_4px_20px_rgba(245,158,11,0.12)] flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <button
              type="button"
              onClick={() => scrollToPinnedMessage(pinnedMsg._id)}
              className="flex items-center gap-2.5 min-w-0 text-left flex-1 group"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs shadow-amber-500/30 group-hover:scale-105 transition-transform">
                <Pin size={13} className="rotate-45" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    {isBn ? "পিন করা মেসেজ" : "Pinned Message"}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    • {pinnedMsg.sender?.name || "Member"}
                  </span>
                </div>
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {snippet}
                </p>
              </div>
            </button>

            {/* Unpin button */}
            {canUnpin && (
              <button
                type="button"
                onClick={() => handleTogglePin(pinnedMsg)}
                title={isBn ? "আনপিন করুন" : "Unpin message"}
                className="p-1.5 rounded-lg text-amber-700 dark:text-amber-400 hover:bg-amber-200/50 dark:hover:bg-amber-950/50 transition-colors flex-shrink-0"
              >
                <PinOff size={15} />
              </button>
            )}
          </div>
        );
      })()}

      {/* 2. CHAT MESSAGES FEED */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto min-h-0 rounded-3xl bg-gradient-to-br from-[#FAF2E8]/75 via-white/80 to-[#FAF2E8]/55 dark:from-slate-900/70 dark:via-slate-900/85 dark:to-slate-950/90 border border-[#EFE2D2]/90 dark:border-slate-800/80 p-3 sm:p-5 space-y-4 shadow-inner relative"
      >
        {/* Subtle Ambient Decorative Glows for Apple iOS Liquid Glass Refraction */}
        <div className="pointer-events-none absolute -top-16 -left-16 w-72 h-72 bg-[#F6DFC8]/50 dark:bg-orange-500/10 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 -right-16 w-80 h-80 bg-[#FAEAD9]/60 dark:bg-amber-500/10 rounded-full blur-3xl" />
        {loading ? (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-2" />
            <p className="text-xs">{isBn ? "মেসেজ লোড হচ্ছে..." : "Loading messages..."}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 rounded-3xl bg-orange-50 dark:bg-orange-950/30 text-orange-500 flex items-center justify-center mb-3">
              <MessageCircle size={32} />
            </div>
            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-base mb-1">
              {isBn ? "কোনো মেসেজ নেই" : "No messages yet"}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
              {isBn
                ? "আপনার মেসের সদস্যদের সাথে আলোচনা শুরু করতে প্রথম মেসেজ বা ছবি পাঠান!"
                : "Say hello or share a picture to start the conversation with your mess mates!"}
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = String(msg.sender?.userId) === String(currentUserId);
            const isManager = msg.sender?.role === "manager";
            // Only the message author can delete their own message
            const canDelete = isMe;

            // Date divider check
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const showDateDivider =
              !prevMsg ||
              new Date(msg.createdAt).toDateString() !==
                new Date(prevMsg.createdAt).toDateString();

            return (
              <React.Fragment key={msg._id || index}>
                {/* Date Divider */}
                {showDateDivider && (
                  <div className="flex justify-center my-3">
                    <span className="text-[11px] font-semibold tracking-wide text-gray-600 dark:text-gray-300 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-[#EAE0D2] dark:border-white/10 px-3.5 py-0.5 rounded-full shadow-xs select-none">
                      {formatDateDivider(msg.createdAt, isBn)}
                    </span>
                  </div>
                )}

                {/* Message Item */}
                <div
                  id={`msg-${msg._id}`}
                  className={`group flex items-end gap-2 sm:gap-2.5 transition-all duration-300 ${
                    isMe ? "justify-end" : "justify-start"
                  } ${
                    highlightedMsgId === msg._id
                      ? "ring-2 ring-amber-400 dark:ring-amber-500 rounded-3xl p-1 bg-amber-100/40 dark:bg-amber-950/30"
                      : ""
                  }`}
                >
                  {/* Other's Avatar */}
                  {!isMe && (
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-slate-800 flex-shrink-0 relative shadow-xs border border-white/60 dark:border-white/10">
                      {msg.sender?.avatar ? (
                        <Image
                          src={msg.sender.avatar}
                          alt={msg.sender.name || "Member"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-xs text-gray-600 dark:text-gray-300">
                          {msg.sender?.name?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bubble Content - Apple iOS Liquid Glass Style */}
                  <div
                    className={`relative max-w-[85%] sm:max-w-[72%] rounded-[20px] sm:rounded-[22px] p-3 sm:p-3.5 transition-all backdrop-blur-xl ${
                      isMe
                        ? "bg-gradient-to-br from-orange-500/90 via-orange-500/85 to-amber-500/90 text-white rounded-br-[4px] border border-white/35 dark:border-white/20 shadow-[0_6px_20px_-2px_rgba(249,115,22,0.32),inset_0_1px_1px_rgba(255,255,255,0.45)]"
                        : "bg-white/85 dark:bg-slate-800/85 text-gray-900 dark:text-gray-100 rounded-bl-[4px] border border-white dark:border-white/10 shadow-[0_4px_20px_-2px_rgba(180,140,110,0.08),inset_0_1px_1.5px_rgba(255,255,255,1)] dark:shadow-[0_6px_20px_-2px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.08)]"
                    }`}
                  >
                    {/* Pinned message indicator badge */}
                    {msg.isPinned && (
                      <div className="flex items-center gap-1 mb-1.5 pb-1 border-b border-black/10 dark:border-white/10 select-none">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isMe
                            ? "bg-white/25 text-white"
                            : "bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300"
                        }`}>
                          <Pin size={11} className="rotate-45" />
                          {isBn ? "পিন করা মেসেজ" : "Pinned Message"}
                        </span>
                      </div>
                    )}

                    {/* Sender Name & Role for others */}
                    {!isMe && (
                      <div className="flex items-center gap-1.5 mb-1 select-none">
                        <span className="text-xs font-bold text-orange-600 dark:text-orange-400 truncate">
                          {msg.sender?.name || "Member"}
                        </span>
                        {isManager && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold px-1.5 py-0.2 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                            👑 {isBn ? "ম্যানেজার" : "Manager"}
                          </span>
                        )}
                      </div>
                    )}

                    {/* 1. Regular Text Message */}
                    {msg.text && (
                      <div className="text-sm leading-relaxed">
                        <LinkifiedText text={msg.text} />
                      </div>
                    )}

                    {/* 2. Interactive Poll Card */}
                    {msg.poll && (
                      <div className="mt-1 min-w-[240px] sm:min-w-[280px]">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/70 text-orange-600 dark:text-orange-300 flex items-center gap-1">
                            <BarChart2 size={11} />
                            {isBn ? "পোল" : "Poll"}
                          </span>
                          <span className={`text-[11px] font-semibold ${isMe ? "text-orange-100" : "text-gray-500 dark:text-gray-400"}`}>
                            {isBn ? "মতামত দিন" : "Cast your vote"}
                          </span>
                        </div>

                        <h4 className="font-bold text-sm mb-3">
                          {msg.poll.question}
                        </h4>

                        {/* Poll Options */}
                        <div className="space-y-2">
                          {(() => {
                            const totalVotes = msg.poll.options?.reduce(
                              (sum, o) => sum + (o.votes?.length || 0),
                              0
                            ) || 0;

                            return msg.poll.options?.map((option, optIdx) => {
                              const optVotes = option.votes?.length || 0;
                              const pct = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
                              const hasVoted = option.votes?.map(String).includes(String(currentUserId));

                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  onClick={() => handleVote(msg._id, optIdx)}
                                  className={`relative w-full text-left p-2.5 rounded-xl border transition-all overflow-hidden flex items-center justify-between text-xs select-none backdrop-blur-sm ${
                                    isMe
                                      ? hasVoted
                                        ? "bg-white/30 border-white/60 text-white font-bold shadow-2xs"
                                        : "bg-white/15 hover:bg-white/25 border-white/20 text-white"
                                      : hasVoted
                                      ? "bg-orange-500/15 dark:bg-orange-500/25 border-orange-400/50 dark:border-orange-500/50 font-bold text-orange-700 dark:text-orange-300 shadow-2xs"
                                      : "bg-white/60 dark:bg-slate-700/50 hover:bg-white/80 dark:hover:bg-slate-700/70 border-black/5 dark:border-white/10 text-gray-800 dark:text-gray-200"
                                  }`}
                                >
                                  {/* Progress bar background fill */}
                                  <div
                                    style={{ width: `${pct}%` }}
                                    className={`absolute left-0 top-0 bottom-0 -z-10 transition-all duration-500 ${
                                      isMe
                                        ? "bg-white/25"
                                        : hasVoted
                                        ? "bg-orange-200/50 dark:bg-orange-800/30"
                                        : "bg-gray-200/50 dark:bg-slate-700/50"
                                    }`}
                                  />

                                  <div className="flex items-center gap-2 min-w-0 z-10">
                                    <span className={`w-4 h-4 rounded-full flex items-center justify-center border text-[10px] ${
                                      hasVoted
                                        ? isMe ? "bg-white text-orange-600 border-white" : "bg-orange-500 text-white border-orange-500"
                                        : isMe ? "border-white/50" : "border-gray-400"
                                    }`}>
                                      {hasVoted && <Check size={10} strokeWidth={3} />}
                                    </span>
                                    <span className="truncate">{option.text}</span>
                                  </div>

                                  <div className="flex items-center gap-1.5 z-10 flex-shrink-0 font-mono text-[11px]">
                                    <span>{isBn ? `${toBnNumber(optVotes)} ভোট` : `${optVotes}`}</span>
                                    <span className="font-bold">({isBn ? toBnNumber(pct) : pct}%)</span>
                                  </div>
                                </button>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}

                    {/* 3. Interactive Bazaar Checklist Card */}
                    {msg.bazaarList && (
                      <div className="mt-1 min-w-[240px] sm:min-w-[280px]">
                        <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-black/10 dark:border-white/10">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                            <ShoppingCart size={11} />
                            {isBn ? "বাজারের ফর্দ" : "Bazaar Checklist"}
                          </span>
                          {msg.bazaarList.budget && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              isMe ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-slate-750 text-emerald-600 dark:text-emerald-400"
                            }`}>
                              💰 {msg.bazaarList.budget}
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-sm mb-2.5">
                          {msg.bazaarList.title}
                        </h4>

                        {/* Checklist items */}
                        <div className="space-y-1.5">
                          {msg.bazaarList.items?.map((item, itemIdx) => {
                            const isDone = !!item.completed;
                            return (
                              <button
                                key={itemIdx}
                                type="button"
                                onClick={() => handleToggleBazaarItem(msg._id, itemIdx)}
                                className={`w-full text-left p-2 rounded-xl flex items-center gap-2.5 transition-all text-xs select-none backdrop-blur-sm ${
                                  isMe
                                    ? isDone ? "bg-white/20 line-through opacity-80" : "bg-white/15 hover:bg-white/25 font-medium"
                                    : isDone ? "bg-emerald-500/10 dark:bg-emerald-950/20 text-gray-400 line-through" : "bg-white/60 dark:bg-slate-700/50 hover:bg-white/80 dark:hover:bg-slate-700/70 border border-black/5 dark:border-white/10 text-gray-800 dark:text-gray-100 font-medium"
                                }`}
                              >
                                {isDone ? (
                                  <CheckSquare size={16} className={isMe ? "text-white" : "text-emerald-500 flex-shrink-0"} />
                                ) : (
                                  <Square size={16} className={isMe ? "text-white/70" : "text-gray-400 flex-shrink-0"} />
                                )}
                                <span className="truncate">{item.text}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Progress count */}
                        <div className={`mt-2.5 text-[10px] flex items-center justify-between font-medium ${isMe ? "text-orange-100" : "text-gray-400 dark:text-gray-500"}`}>
                          <span>
                            {(() => {
                              const doneCount = msg.bazaarList.items?.filter((i) => i.completed).length || 0;
                              const totalCount = msg.bazaarList.items?.length || 0;
                              return isBn
                                ? `${toBnNumber(doneCount)}/${toBnNumber(totalCount)} টি কেনা সম্পন্ন`
                                : `${doneCount} of ${totalCount} items completed`;
                            })()}
                          </span>
                          <span className="text-[9px] opacity-75">{isBn ? "ক্লিক করে টিক দিন" : "Tap to check"}</span>
                        </div>
                      </div>
                    )}

                    {/* 4. Emergency Alert Card (Task 2) */}
                    {msg.emergencyAlert && (
                      <div className="mt-1 min-w-[240px] sm:min-w-[280px]">
                        <div className={`p-3 rounded-2xl border shadow-sm ${
                          isMe
                            ? "bg-red-700/70 border-red-300/40 text-white"
                            : "bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/40 dark:to-orange-950/30 border-red-300 dark:border-red-600/40 text-gray-900 dark:text-gray-100"
                        }`}>
                          <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-red-200/50 dark:border-red-700/30">
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-red-600 text-white flex items-center gap-1 tracking-wider uppercase shadow-xs">
                              <AlertTriangle size={11} />
                              {isBn ? "জরুরি অ্যালার্ট" : "EMERGENCY"}
                            </span>
                            <span className="text-xs">⚠️</span>
                          </div>

                          <h4 className={`font-extrabold text-sm sm:text-base mb-1 leading-snug ${isMe ? "text-white" : "text-red-600 dark:text-red-400"}`}>
                            {msg.emergencyAlert.title}
                          </h4>

                          {msg.emergencyAlert.note && (
                            <p className={`mt-1.5 text-xs rounded-xl p-2 font-medium leading-relaxed ${
                              isMe ? "bg-black/25 text-white" : "bg-red-100/60 dark:bg-red-900/30 text-red-950 dark:text-red-200"
                            }`}>
                              {msg.emergencyAlert.note}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Timestamp, Seen Status & Actions */}
                    <div
                      className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] select-none ${
                        isMe ? "text-orange-100" : "text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      <span>{formatMessageTime(msg.createdAt)}</span>

                      {/* Seen status for own messages */}
                      {isMe && (() => {
                        const othersSeen = msg.seenBy?.filter((s) => String(s.userId) !== String(currentUserId)) || [];
                        const hasSeen = othersSeen.length > 0;
                        return (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (msg.seenBy && msg.seenBy.length > 0) {
                                setViewSeenCandidate(msg);
                              }
                            }}
                            title={
                              hasSeen
                                ? isBn
                                  ? `${othersSeen.length} জন সিন করেছে (ক্লিক করে দেখুন)`
                                  : `Seen by ${othersSeen.length} (click to view)`
                                : isBn
                                ? "পাঠানো হয়েছে"
                                : "Sent"
                            }
                            className={`inline-flex items-center gap-0.5 hover:underline cursor-pointer ${
                              hasSeen ? "text-white font-bold opacity-100" : "opacity-75"
                            }`}
                          >
                            {hasSeen ? (
                              <>
                                <CheckCheck size={13} className="text-amber-200 stroke-[2.5]" />
                                <span className="text-[10px] font-mono font-bold">{othersSeen.length}</span>
                              </>
                            ) : (
                              <Check size={12} className="opacity-80" />
                            )}
                          </button>
                        );
                      })()}

                      {/* Seen indicator for other's messages */}
                      {!isMe && msg.seenBy && msg.seenBy.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewSeenCandidate(msg);
                          }}
                          title={isBn ? "কে কে মেসেজটি দেখেছেন (ক্লিক করুন)" : "View who read this"}
                          className="inline-flex items-center gap-0.5 opacity-70 hover:opacity-100 hover:text-orange-500 transition-opacity ml-0.5 cursor-pointer"
                        >
                          <Eye size={11} />
                          <span className="text-[10px] font-mono font-semibold">{msg.seenBy.length}</span>
                        </button>
                      )}

                      {/* React button (Smile) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveReactionMenuMsgId((prev) => (prev === msg._id ? null : msg._id));
                        }}
                        title={isBn ? "রিঅ্যাক্ট দিন" : "React"}
                        className={`p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-all ${
                          activeReactionMenuMsgId === msg._id
                            ? "opacity-100 text-yellow-300"
                            : isMe
                            ? "opacity-70 sm:opacity-0 sm:group-hover:opacity-100 text-orange-100 hover:text-white"
                            : "opacity-70 sm:opacity-0 sm:group-hover:opacity-100 text-gray-400 hover:text-yellow-500"
                        }`}
                      >
                        <Smile size={12} />
                      </button>

                      {/* Pin button (Task 1) */}
                      {(userRole === "manager" || isMe) && (
                        <button
                          type="button"
                          onClick={() => handleTogglePin(msg)}
                          title={msg.isPinned ? (isBn ? "আনপিন করুন" : "Unpin message") : (isBn ? "মেসেজ পিন করুন" : "Pin message")}
                          className={`p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-all ${
                            msg.isPinned
                              ? "text-amber-400 opacity-100"
                              : "opacity-70 sm:opacity-0 sm:group-hover:opacity-100 text-gray-400 hover:text-amber-500"
                          }`}
                        >
                          {msg.isPinned ? <PinOff size={12} /> : <Pin size={12} />}
                        </button>
                      )}

                      {/* Delete button */}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => setDeleteCandidate(msg)}
                          title={isBn ? "মেসেজ মুছুন" : "Delete message"}
                          className={`opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 ${
                            isMe ? "text-orange-100 hover:text-white" : "text-gray-400 hover:text-red-500"
                          }`}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>

                    {/* Floating Reaction Picker Popover - iOS Glass */}
                    {activeReactionMenuMsgId === msg._id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className={`absolute -top-12 z-30 bg-white/85 dark:bg-slate-800/85 backdrop-blur-xl border border-white/70 dark:border-white/15 rounded-full px-2.5 py-1 shadow-2xl flex items-center gap-2 animate-in zoom-in-95 duration-150 ring-1 ring-black/5 ${
                          isMe ? "right-0" : "left-0"
                        }`}
                      >
                        {QUICK_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleToggleReaction(msg._id, emoji)}
                            className="w-7 h-7 flex items-center justify-center text-base hover:scale-125 active:scale-95 transition-transform cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Active Reactions Pills - iOS Liquid Glass */}
                    {(() => {
                      const reactions = Array.isArray(msg.reactions) ? msg.reactions : [];
                      if (reactions.length === 0) return null;

                      // Group reactions by emoji
                      const grouped = {};
                      reactions.forEach((r) => {
                        if (!grouped[r.emoji]) grouped[r.emoji] = [];
                        grouped[r.emoji].push(r);
                      });

                      return (
                        <div className={`flex flex-wrap items-center gap-1.5 mt-2 pt-1.5 border-t ${
                          isMe ? "border-white/20 justify-end" : "border-black/5 dark:border-white/10 justify-start"
                        }`}>
                          {Object.entries(grouped).map(([emoji, userList]) => {
                            const hasReacted = userList.some((u) => String(u.userId) === String(currentUserId));
                            const userNames = userList.map((u) => u.userName || "Member").join(", ");

                            return (
                              <button
                                key={emoji}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleReaction(msg._id, emoji);
                                }}
                                title={userNames}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-all cursor-pointer select-none active:scale-95 backdrop-blur-md ${
                                  hasReacted
                                    ? isMe
                                      ? "bg-white/35 border-white/60 text-white shadow-xs font-bold ring-1 ring-white/30"
                                      : "bg-orange-500/15 dark:bg-orange-500/25 border-orange-400/50 dark:border-orange-500/50 text-orange-700 dark:text-orange-300 shadow-xs font-bold"
                                    : isMe
                                    ? "bg-white/15 border-white/25 text-white hover:bg-white/25"
                                    : "bg-white/60 dark:bg-slate-700/50 border-gray-200/60 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/90 dark:hover:bg-slate-700/80 shadow-2xs"
                                }`}
                              >
                                <span>{emoji}</span>
                                <span className="font-mono text-[10px] font-bold">{userList.length}</span>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />

        {/* Typing Indicator */}
        {typingUsers.size > 0 && (
          <div className="sticky bottom-0 left-0 flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs px-3 py-1.5 rounded-full w-fit shadow-xs border border-gray-100 dark:border-slate-800">
            <span className="flex gap-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:0.4s]" />
            </span>
            <span>
              {Array.from(typingUsers).join(", ")}{" "}
              {isBn ? "টাইপ করছেন..." : "is typing..."}
            </span>
          </div>
        )}

        {/* Scroll To Bottom Button */}
        {showScrollBottom && (
          <button
            type="button"
            onClick={() => scrollToBottom("smooth")}
            className="absolute bottom-4 right-4 z-20 w-9 h-9 rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/30 flex items-center justify-center hover:scale-105 transition-transform"
            aria-label="Scroll to bottom"
          >
            <ChevronDown size={18} />
          </button>
        )}
      </div>

      {/* 3. CHAT INPUT BAR WITH + ACTION MENU */}
      <div className="shrink-0 mt-2 relative">
        {/* Backdrop to close Quick Actions menu when tapping outside */}
        {showActionMenu && (
          <div
            className="fixed inset-0 z-25 bg-black/5 dark:bg-black/20 sm:bg-transparent cursor-default"
            onClick={() => setShowActionMenu(false)}
          />
        )}

        {/* + Action Menu Popover - iOS Glass */}
        {showActionMenu && (
          <div
            ref={actionMenuRef}
            className="absolute bottom-16 left-2 z-30 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-2xl shadow-2xl p-2 w-64 animate-in fade-in slide-in-from-bottom-3 duration-200"
          >
            <div className="px-2 py-1.5 text-[10px] font-bold tracking-wider uppercase text-gray-400 dark:text-gray-500">
              {isBn ? "কুইক অ্যাকশন" : "Quick Actions"}
            </div>

            {/* 1. Create Poll Option */}
            <button
              type="button"
              onClick={() => {
                setShowActionMenu(false);
                setShowPollModal(true);
              }}
              className="w-full text-left flex items-center gap-3 p-2.5 rounded-xl hover:bg-orange-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0">
                <BarChart2 size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">{isBn ? "পোল তৈরি করুন" : "Create Poll"}</p>
                <p className="text-[10px] text-gray-400 truncate">{isBn ? "মেম্বারদের ভোট/মতামত নিন" : "Vote on meal/decision"}</p>
              </div>
            </button>

            {/* 2. Bazaar Checklist Option */}
            <button
              type="button"
              onClick={() => {
                setShowActionMenu(false);
                setShowBazaarModal(true);
              }}
              className="w-full text-left flex items-center gap-3 p-2.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200 transition-colors mt-1"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <ShoppingCart size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">{isBn ? "বাজারের লিস্ট পাঠান" : "Bazaar Checklist"}</p>
                <p className="text-[10px] text-gray-400 truncate">{isBn ? "প্রয়োজনীয় জিনিসের তালিকা" : "Share shopping list"}</p>
              </div>
            </button>

            {/* 3. Emergency Alert Option (Task 2) */}
            <button
              type="button"
              onClick={() => {
                setShowActionMenu(false);
                setShowEmergencyModal(true);
              }}
              className="w-full text-left flex items-center gap-3 p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-700 dark:text-gray-200 transition-colors mt-1"
            >
              <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0 animate-pulse">
                <AlertTriangle size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-red-600 dark:text-red-400 truncate">{isBn ? "জরুরি অ্যালার্ট" : "Emergency Alert"}</p>
                <p className="text-[10px] text-gray-400 truncate">{isBn ? "গ্যাস, পানি বা জরুরি নোটিশ" : "Gas, water or urgent notice"}</p>
              </div>
            </button>
          </div>
        )}

        {/* Form Container - iOS Glass */}
        <form
          onSubmit={handleSendMessage}
          className="relative flex items-center gap-2 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-[#EFE2D2]/95 dark:border-white/10 rounded-2xl p-1.5 sm:p-2 shadow-[0_4px_20px_rgba(210,185,160,0.2)] focus-within:ring-2 focus-within:ring-orange-500/30 focus-within:border-orange-500 transition-all"
        >
          {/* + Action Trigger Button */}
          <button
            ref={actionBtnRef}
            type="button"
            onClick={() => setShowActionMenu((prev) => !prev)}
            title={isBn ? "অ্যাকশন অপশন" : "Action options"}
            className={`p-2 sm:p-2.5 rounded-xl transition-all flex-shrink-0 z-30 relative ${
              showActionMenu
                ? "bg-orange-500 text-white rotate-45 scale-105"
                : "text-gray-500 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-slate-800"
            }`}
          >
            <Plus size={20} />
          </button>

          {/* Text Input */}
          <textarea
            rows={1}
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsInputFocused(true);
              setTimeout(() => scrollToBottom("smooth"), 150);
            }}
            onBlur={() => setIsInputFocused(false)}
            placeholder={
              isBn ? "একটি মেসেজ লিখুন... (Enter চাপুন)" : "Type a message... (Press Enter)"
            }
            className="flex-1 resize-none bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-hidden py-1.5 px-2 max-h-28 overflow-y-auto"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={sending || !inputText.trim()}
            className="p-2.5 sm:px-4 sm:py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/25 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-95 active:scale-95 transition-all flex-shrink-0"
          >
            {sending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <Send size={18} />
                <span className="hidden sm:inline text-xs">{isBn ? "পাঠান" : "Send"}</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* 4. CREATE POLL MODAL */}
      {showPollModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-5 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <BarChart2 size={16} />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                  {isBn ? "নতুন পোল তৈরি করুন" : "Create a Poll"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPollModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-400 hover:text-gray-600 flex items-center justify-center"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreatePoll} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {isBn ? "পোলের প্রশ্ন" : "Poll Question"}
                </label>
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder={isBn ? "যেমন: আজ রাতে কী রান্না হবে?" : "e.g. What to cook for dinner?"}
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:outline-hidden focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {isBn ? "অপশনসমূহ (কমপক্ষে ২টি)" : "Options (At least 2)"}
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const updated = [...pollOptions];
                          updated[idx] = e.target.value;
                          setPollOptions(updated);
                        }}
                        placeholder={`${isBn ? "অপশন" : "Option"} ${idx + 1}`}
                        className="flex-1 text-xs p-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:outline-hidden focus:border-orange-500"
                        required={idx < 2}
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {pollOptions.length < 6 && (
                  <button
                    type="button"
                    onClick={() => setPollOptions([...pollOptions, ""])}
                    className="mt-2 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                  >
                    <Plus size={13} /> {isBn ? "আরও অপশন যোগ করুন" : "Add another option"}
                  </button>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPollModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  {isBn ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-semibold shadow-md shadow-orange-500/25 hover:opacity-95"
                >
                  {isBn ? "পোল পোস্ট করুন" : "Post Poll"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. CREATE BAZAAR LIST MODAL */}
      {showBazaarModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-5 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ShoppingCart size={16} />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                  {isBn ? "বাজারের লিস্ট তৈরি করুন" : "Create Bazaar Checklist"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBazaarModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-400 hover:text-gray-600 flex items-center justify-center"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateBazaarList} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {isBn ? "লিস্টের শিরোনাম" : "Title"}
                  </label>
                  <input
                    type="text"
                    value={bazaarTitle}
                    onChange={(e) => setBazaarTitle(e.target.value)}
                    placeholder={isBn ? "আজকের বাজার" : "Today's Bazaar"}
                    className="w-full text-xs p-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:outline-hidden focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {isBn ? "আনুমানিক বাজেট (ঐচ্ছিক)" : "Budget (Optional)"}
                  </label>
                  <input
                    type="text"
                    value={bazaarBudget}
                    onChange={(e) => setBazaarBudget(e.target.value)}
                    placeholder={isBn ? "যেমন: ৫০০৳" : "e.g. ৳500"}
                    className="w-full text-xs p-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {isBn ? "বাজারের আইটেমসমূহ" : "Items to Buy"}
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {bazaarItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => {
                          const updated = [...bazaarItems];
                          updated[idx] = e.target.value;
                          setBazaarItems(updated);
                        }}
                        placeholder={`${isBn ? "আইটেম" : "Item"} ${idx + 1} (যেমন: আলু ২ কেজি)`}
                        className="flex-1 text-xs p-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:outline-hidden focus:border-orange-500"
                        required={idx === 0}
                      />
                      {bazaarItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setBazaarItems(bazaarItems.filter((_, i) => i !== idx))}
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setBazaarItems([...bazaarItems, ""])}
                  className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <Plus size={13} /> {isBn ? "আরও আইটেম যোগ করুন" : "Add another item"}
                </button>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowBazaarModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  {isBn ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/25 hover:opacity-95"
                >
                  {isBn ? "লিস্ট শেয়ার করুন" : "Share List"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. CREATE EMERGENCY ALERT MODAL (Task 2) */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-3xl p-5 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
                  <AlertTriangle size={18} />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                  {isBn ? "জরুরি অ্যালার্ট পাঠান" : "Send Emergency Alert"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEmergencyModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-400 hover:text-gray-600 flex items-center justify-center"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSendEmergencyAlert} className="space-y-4">
              {/* Alert Title Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {isBn ? "অ্যালার্টের বিষয় / শিরোনাম *" : "Alert Title / Subject *"}
                </label>
                <input
                  type="text"
                  value={emergencyTitle}
                  onChange={(e) => setEmergencyTitle(e.target.value)}
                  placeholder={
                    isBn
                      ? "যেমন: গ্যাস শেষ! / পানি নাই! / জরুরি মিটিং"
                      : "e.g. Gas Finished! / Water Issue / Urgent Meeting"
                  }
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:outline-hidden focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-gray-900 dark:text-gray-100 placeholder-gray-400"
                  autoFocus
                  required
                />
              </div>

              {/* Note / Details */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {isBn ? "বিস্তারিত বা করণীয় (ঐচ্ছিক)" : "Details / Instructions (Optional)"}
                </label>
                <textarea
                  rows={3}
                  value={emergencyNote}
                  onChange={(e) => setEmergencyNote(e.target.value)}
                  placeholder={
                    isBn
                      ? "যেমন: আজ সন্ধ্যা ৭টায় ডাইনিংয়ে সিলিন্ডার পৌঁছাবে, সবাই উপস্থিত থাকবেন।"
                      : "e.g. Delivery arriving at 7pm, please be mindful."
                  }
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:outline-hidden focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-gray-900 dark:text-gray-100 placeholder-gray-400 resize-none"
                />
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEmergencyModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {isBn ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-semibold shadow-md shadow-red-600/25 hover:opacity-95 flex items-center justify-center gap-1.5 transition-all"
                >
                  <AlertTriangle size={15} />
                  <span>{isBn ? "অ্যালার্ট পাঠান" : "Broadcast Alert"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. CONFIRM DELETE MODAL */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-5 max-w-xs w-full shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600 mx-auto flex items-center justify-center mb-3">
              <Trash2 size={24} />
            </div>
            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-base mb-1">
              {isBn ? "মেসেজটি মুছতে চান?" : "Delete Message?"}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
              {isBn
                ? "এই মেসেজটি মেসের সকলের চ্যাট হিস্ট্রি থেকে স্থায়ীভাবে মুছে যাবে।"
                : "This message will be permanently deleted for all members."}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                {isBn ? "বাতিল" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={confirmDeleteMessage}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors shadow-md shadow-red-600/20"
              >
                {isBn ? "মুছে ফেলুন" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. SEEN BY MEMBERS MODAL */}
      {viewSeenCandidate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-5 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <CheckCheck size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                    {isBn ? "মেসেজ দেখেছেন যারা" : "Message Seen By"}
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    {isBn
                      ? `মোট ${viewSeenCandidate.seenBy?.length || 0} জন সদস্য`
                      : `${viewSeenCandidate.seenBy?.length || 0} members`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewSeenCandidate(null)}
                className="w-7 h-7 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-400 hover:text-gray-600 flex items-center justify-center cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Message preview */}
            <div className="mb-3 p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/70 text-xs text-gray-600 dark:text-gray-300 italic truncate border border-gray-100 dark:border-slate-750">
              &quot;{viewSeenCandidate.text || viewSeenCandidate.poll?.question || viewSeenCandidate.bazaarList?.title || viewSeenCandidate.emergencyAlert?.title || (isBn ? "মেসেজ" : "Message")}&quot;
            </div>

            {/* Members seen list */}
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 divide-y divide-gray-100 dark:divide-slate-800/60">
              {viewSeenCandidate.seenBy && viewSeenCandidate.seenBy.length > 0 ? (
                viewSeenCandidate.seenBy.map((seen, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between pt-1.5 first:pt-0 pb-1.5 hover:bg-gray-50/80 dark:hover:bg-slate-800/50 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-slate-700 flex-shrink-0 relative">
                        {seen.avatar ? (
                          <Image
                            src={seen.avatar}
                            alt={seen.name || "Member"}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xs text-gray-600 dark:text-gray-300">
                            {seen.name?.[0]?.toUpperCase() || "M"}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                          {seen.name || "Member"}{" "}
                          {String(seen.userId) === String(currentUserId) ? (
                            <span className="text-[10px] text-orange-500 font-normal">
                              ({isBn ? "আপনি" : "You"})
                            </span>
                          ) : null}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">
                      {formatMessageTime(seen.seenAt)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-gray-400">
                  {isBn ? "এখনো কেউ দেখেনি" : "Not seen by anyone yet"}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-slate-800 mt-2">
              <button
                type="button"
                onClick={() => setViewSeenCandidate(null)}
                className="w-full py-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                {isBn ? "বন্ধ করুন" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
