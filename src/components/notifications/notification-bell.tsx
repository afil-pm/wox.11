"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Package, MessageSquare, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { subscribeToPush } from "@/lib/push-client";

type Notification = {
  _id: string;
  title: string;
  body: string;
  type: string;
  orderId?: string;
  read: boolean;
  createdAt: string;
};

function getUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("wox-user");
    const user = stored ? JSON.parse(stored) : null;
    if (user?.id) return user.id;
  } catch {}
  return localStorage.getItem("wox-user-id");
}

async function fetchNotifications(userId: string): Promise<Notification[]> {
  const res = await fetch("/api/notifications", {
    headers: { "x-user-id": userId },
  });
  const data = await res.json();
  return data.notifications || [];
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const loadNotifications = useCallback(async () => {
    const userId = getUserId();
    if (!userId) return;
    try {
      const data = await fetchNotifications(userId);
      setNotifications(data);
    } catch {}
  }, []);

  const loadNotificationsSilent = useCallback(async () => {
    const userId = getUserId();
    if (!userId) return;
    try {
      const data = await fetchNotifications(userId);
      setNotifications(data);
    } catch {}
  }, []);

  useEffect(() => {
    if (open) {
      setLoading(true);
      loadNotifications().finally(() => setLoading(false));
    }
  }, [open, loadNotifications]);

  useEffect(() => {
    loadNotificationsSilent();
    const interval = setInterval(loadNotificationsSilent, 30000);
    return () => clearInterval(interval);
  }, [loadNotificationsSilent]);

  useEffect(() => {
    const userId = getUserId();
    if (!userId || !("Notification" in window) || !("serviceWorker" in navigator)) return;

    if (Notification.permission === "denied") return;

    if (Notification.permission === "granted") {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (!sub) {
            subscribeToPush(userId).catch(() => {});
          }
        });
      });
    } else if (Notification.permission === "default") {
      subscribeToPush(userId).catch(() => {});
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function markAllRead() {
    const userId = getUserId();
    if (!userId) return;
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  }

  async function markOneRead(id: string) {
    const userId = getUserId();
    if (!userId) return;
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch {}
  }

  function getTypeIcon(type: string) {
    switch (type) {
      case "order_update":
        return <Package className="h-4 w-4 text-blue-500" />;
      case "message_reply":
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case "new_product":
        return <Package className="h-4 w-4 text-purple-500" />;
      default:
        return <Info className="h-4 w-4 text-zinc-400" />;
    }
  }

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  function handleNotificationClick(n: Notification) {
    if (!n.read) markOneRead(n._id);
    const stored = localStorage.getItem("wox-user");
    const user = stored ? JSON.parse(stored) : null;
    const isAdminUser = user?.role === "ADMIN";
    if (n.orderId) {
      if (isAdminUser) {
        window.location.href = "/wox/admin/orders";
      } else {
        window.location.href = `/account/orders/${n.orderId}`;
      }
    } else if (isAdminUser) {
      window.location.href = "/wox/admin";
    }
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="relative flex h-10 w-10 items-center justify-center text-zinc-900 transition-colors hover:text-zinc-600"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="fixed right-2 top-14 w-[calc(100vw-1rem)] max-w-80 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl z-[60] sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:w-[calc(100vw-2rem)]"
        >
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-zinc-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-blue-600 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-sm text-zinc-400">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-400">
                <Bell className="mx-auto mb-2 h-8 w-8 text-zinc-200" />
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <div
                  key={n._id}
                  className={cn(
                    "flex gap-3 border-b border-zinc-50 px-4 py-3 transition-colors hover:bg-zinc-50",
                    !n.read && "bg-blue-50/50",
                    n.orderId && "cursor-pointer"
                  )}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="mt-0.5 shrink-0">{getTypeIcon(n.type)}</div>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm", n.read ? "font-normal text-zinc-600" : "font-medium text-zinc-900")}>
                      {n.title}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500 line-clamp-2">{n.body}</p>
                    <p className="mt-1 text-[10px] text-zinc-400">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.read && (
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
