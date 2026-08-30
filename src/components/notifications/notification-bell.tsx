"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, Package, MessageSquare, Info } from "lucide-react";
import { cn } from "@/lib/utils";

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
  return localStorage.getItem("wox-user-id");
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const userId = getUserId();
    if (!userId) return;
    setLoading(true);
    fetch("/api/notifications", {
      headers: { "x-user-id": userId },
    })
      .then((r) => r.json())
      .then((d) => setNotifications(d.notifications || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

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

  async function markRead(ids: string[]) {
    const userId = getUserId();
    if (!userId || ids.length === 0) return;
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ userId, notificationIds: ids }),
      });
      setNotifications((prev) =>
        prev.map((n) => (ids.includes(n._id) ? { ...n, read: true } : n))
      );
    } catch {}
  }

  function getTypeIcon(type: string) {
    switch (type) {
      case "order_status":
        return <Package className="h-4 w-4 text-blue-500" />;
      case "message_reply":
        return <MessageSquare className="h-4 w-4 text-green-500" />;
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
          className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl z-[60]"
        >
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-zinc-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markRead(notifications.filter((n) => !n.read).map((n) => n._id))}
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
                    !n.read && "bg-blue-50/50"
                  )}
                  onClick={() => {
                    if (!n.read) markRead([n._id]);
                    if (n.orderId) {
                      window.location.href = `/account/orders/${n.orderId}`;
                    }
                  }}
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
