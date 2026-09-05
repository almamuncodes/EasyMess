"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { messaging } from "@/lib/firebase";
import { getToken } from "firebase/messaging";

const SocketContext = createContext({
  socket: null,
  notifications: [],
  unreadCount: 0,
  chatUnreadCount: 0,
  fetchNotifications: async () => {},
  fetchChatUnreadCount: async () => {},
  setChatUnreadCount: () => {},
  requestPushPermission: async () => {},
  markAllAsRead: async () => {},
  markAsRead: async () => {},
  deleteNotification: async () => {},
  clearAllNotifications: async () => {},
  messId: null,
});

export const useSocket = () => useContext(SocketContext);

export default function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [messId, setMessId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

  // Fetch notifications from the backend
  const fetchNotifications = React.useCallback(async (uId) => {
    if (!uId) return;
    try {
      const res = await fetch(`${API_BASE}/api/notifications/${uId}`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
        const unread = data.data.filter((n) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, [API_BASE]);

  // Fetch unread chat messages count for current mess
  const fetchChatUnreadCount = React.useCallback(async (mId, uId) => {
    if (!mId || !uId) {
      setChatUnreadCount(0);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/mess/${mId}/messages/unread-count?userId=${uId}`);
      const data = await res.json();
      if (data.success && typeof data.count === "number") {
        setChatUnreadCount(data.count);
      }
    } catch (error) {
      console.error("Error fetching chat unread count:", error);
    }
  }, [API_BASE]);

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!userId) return;
    try {
      // Optimistic UI update
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      await fetch(`${API_BASE}/api/notifications/${userId}/read-all`, {
        method: "PATCH",
      });
    } catch (error) {
      console.error("Error marking all read:", error);
      fetchNotifications(userId); // revert on error
    }
  };

  // Mark single notification as read
  const markAsRead = async (notificationId) => {
    try {
      // Optimistic UI update
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await fetch(`${API_BASE}/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      });
    } catch (error) {
      console.error("Error marking single read:", error);
      fetchNotifications(userId); // revert on error
    }
  };

  // Delete single notification
  const deleteNotification = async (notificationId) => {
    try {
      // Optimistic UI update
      setNotifications((prev) => {
        const target = prev.find((n) => n._id === notificationId);
        if (target && !target.isRead) {
          setUnreadCount((u) => Math.max(0, u - 1));
        }
        return prev.filter((n) => n._id !== notificationId);
      });

      await fetch(`${API_BASE}/api/notifications/${notificationId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      fetchNotifications(userId); // revert on error
    }
  };

  // Clear all notifications for user
  const clearAllNotifications = async () => {
    if (!userId) return;
    try {
      // Optimistic UI update
      setNotifications([]);
      setUnreadCount(0);

      await fetch(`${API_BASE}/api/notifications/${userId}/clear-all`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error clearing all notifications:", error);
      fetchNotifications(userId); // revert on error
    }
  };

  const registerPushNotifications = async (uId) => {
    if (!uId || typeof window === "undefined" || !("Notification" in window)) return;

    try {
      if (Notification.permission === "granted" && messaging) {
        const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        
        const fcmToken = await getToken(messaging, {
          vapidKey: "BFJRNRs8ka_kaEMKzuUdlwYm3C3wt2vs0qipZ7HOIAKMFKKiKNR2xnDFut_gIMyC_luoM3dMMTivdTEUgMcBqQ0",
          serviceWorkerRegistration: registration
        });

        if (fcmToken) {
          await fetch(`${API_BASE}/api/save-fcm-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: uId, fcmToken }),
          });
          console.log("FCM Token registered successfully.");
        }
      }
    } catch (error) {
      console.error("FCM Token registration error:", error);
    }
  };

  // Request browser notification permission explicitly
  const requestPushPermission = async () => {
    if (!userId || typeof window === "undefined" || !("Notification" in window)) return false;
    try {
      let perm = Notification.permission;
      if (perm === "default") {
        perm = await Notification.requestPermission();
      }
      if (perm === "granted") {
        await registerPushNotifications(userId);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error requesting push notification permission:", error);
      return false;
    }
  };

  // Load mess ID when user logs in
  useEffect(() => {
    const loadMessId = async () => {
      if (!userId) {
        setMessId(null);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/member/messid/${userId}`);
        const data = await res.json();
        if (data.messId) {
          setMessId(data.messId);
          fetchChatUnreadCount(data.messId, userId);
        }
      } catch (error) {
        console.error("Error loading messId:", error);
      }
    };

    loadMessId();
    fetchNotifications(userId);
    registerPushNotifications(userId);
  }, [userId, API_BASE, fetchNotifications, fetchChatUnreadCount]);

  // Connect to Socket.io server
  useEffect(() => {
    if (!userId) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(API_BASE, {
      transports: ["websocket", "polling"],
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Socket connected client-side:", newSocket.id);
      if (userId) {
        newSocket.emit("join-user", userId);
      }
      if (messId) {
        newSocket.emit("join-mess", messId);
      }
    });

    // Cleanup on unmount or user change
    return () => {
      newSocket.disconnect();
    };
  }, [userId, messId, API_BASE]);

  // Listen to new-notice event
  useEffect(() => {
    if (!socket) return;

    const handleNewNotice = (data) => {
      // Add notification to state
      const newNotification = {
        _id: `temp-${Date.now()}`, // Temporary ID for list key
        messId: messId,
        userId: userId,
        type: data.type,
        noticeId: data.notice._id,
        title: data.title,
        message: data.message,
        isRead: false,
        createdAt: data.createdAt || new Date(),
      };

      setNotifications((prev) => [newNotification, ...prev]);
      
      // Toast notification (only if notice is not created by current user)
      if (data.notice.createdBy !== userId) {
        setUnreadCount((prev) => prev + 1);
        toast.info(`📢 ${data.title}`, {
          description: data.message,
          action: {
            label: "View",
            onClick: () => {
              window.location.href = "/notice";
            },
          },
        });
      }
    };

    socket.on("new-notice", handleNewNotice);

    return () => {
      socket.off("new-notice", handleNewNotice);
    };
  }, [socket, userId, messId]);

  // Listen to new-notification event (meal updates, deposits, bazaar, etc.)
  useEffect(() => {
    if (!socket || !userId) return;

    const handleNewNotification = (data) => {
      const { notification, targetUserId } = data || {};

      // If targetUserId is specified and it's not meant for this user, ignore
      if (targetUserId && targetUserId !== userId) return;

      if (notification) {
        setNotifications((prev) => {
          if (notification._id && prev.some((n) => n._id === notification._id)) {
            return prev;
          }
          return [notification, ...prev];
        });
        setUnreadCount((prev) => prev + 1);

        if (notification.type === "join_approved") {
          if (typeof window !== "undefined") {
            sessionStorage.removeItem(`user_role_${userId}`);
            sessionStorage.removeItem("user_role");
          }
          if (userId) {
            fetch(`${API_BASE}/api/member/messid/${userId}`)
              .then((res) => res.json())
              .then((data) => {
                if (data.messId) setMessId(data.messId);
              })
              .catch((err) => console.error(err));
          }
        }

        const targetLink = notification.link
          ? notification.link
          : notification.type === "join_approved"
          ? "/dashboard/user-dashboard/overview"
          : notification.type?.startsWith("bazaar")
          ? "/dashboard/user-dashboard/bazaar-analysis"
          : notification.type?.startsWith("deposit")
          ? "/dashboard/user-dashboard/bills"
          : "/dashboard/user-dashboard/meals";

        const icon = notification.type === "join_approved"
          ? "🎉"
          : notification.type?.startsWith("bazaar")
          ? "🛒"
          : notification.type?.startsWith("deposit")
          ? "💰"
          : "🍽️";

        toast.info(`${icon} ${notification.title || "Notification"}`, {
          description: notification.message,
          action: {
            label: "View",
            onClick: () => {
              window.location.href = targetLink;
            },
          },
        });
      }
    };

    socket.on("new-notification", handleNewNotification);

    return () => {
      socket.off("new-notification", handleNewNotification);
    };
  }, [socket, userId]);

  // Listen to new-mess-message and mess-messages-seen to update chat unread counter live
  useEffect(() => {
    if (!socket || !messId || !userId) return;

    const handleNewMessMsg = (newMsg) => {
      if (!newMsg || String(newMsg.messId) !== String(messId)) return;
      // If message is from someone else
      if (String(newMsg.sender?.userId) !== String(userId)) {
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/chat")) {
          setChatUnreadCount((prev) => prev + 1);
        }
      }
    };

    const handleMessSeen = (data) => {
      if (data?.seenUser?.userId && String(data.seenUser.userId) === String(userId)) {
        fetchChatUnreadCount(messId, userId);
      }
    };

    socket.on("new-mess-message", handleNewMessMsg);
    socket.on("mess-messages-seen", handleMessSeen);

    return () => {
      socket.off("new-mess-message", handleNewMessMsg);
      socket.off("mess-messages-seen", handleMessSeen);
    };
  }, [socket, messId, userId, fetchChatUnreadCount]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        notifications,
        unreadCount,
        chatUnreadCount,
        setChatUnreadCount,
        fetchChatUnreadCount,
        requestPushPermission,
        fetchNotifications,
        markAllAsRead,
        markAsRead,
        deleteNotification,
        clearAllNotifications,
        messId,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
