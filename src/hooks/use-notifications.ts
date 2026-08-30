"use client";

import { useState, useEffect, useCallback } from "react";

type Notification = {
  _id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  orderId?: string;
  read: boolean;
  createdAt: string;
};

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const res = await fetch("/api/notifications", {
        headers: { "x-user-id": userId },
      });
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId?: string) => {
    if (!userId) return;
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, notificationId, markAll: !notificationId }),
      });
      fetchNotifications();
    } catch {
      // silent
    }
  }, [userId, fetchNotifications]);

  return { notifications, unreadCount, loading, markAsRead, refresh: fetchNotifications };
}
