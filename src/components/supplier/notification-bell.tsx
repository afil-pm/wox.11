"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Package,
  AlertTriangle,
  Info,
  UserCheck,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSupplierNotifications } from "@/lib/stores/supplier-notifications";

function getTypeIcon(type: string) {
  switch (type) {
    case "order_update":
      return <Package className="h-4 w-4 text-blue-500" />;
    case "supplier_verification":
      return <UserCheck className="h-4 w-4 text-amber-500" />;
    case "supplier_alert":
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
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
  if (Number.isNaN(diff)) return "";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/**
 * Header bell for the supplier panel: shows this supplier's own notifications
 * (orders, cancellations, shipping, payments, verification, alerts) with an
 * unread badge, and keeps the shared feed fresh while the panel is open.
 */
export default function SupplierNotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const notifications = useSupplierNotifications((s) => s.notifications);
  const unreadCount = useSupplierNotifications((s) => s.unreadCount);
  const loaded = useSupplierNotifications((s) => s.loaded);
  const refresh = useSupplierNotifications((s) => s.refresh);
  const markAllRead = useSupplierNotifications((s) => s.markAllRead);
  const markOneRead = useSupplierNotifications((s) => s.markOneRead);

  useEffect(() => {
    if (!loaded) refresh();
  }, [loaded, refresh]);

  // Refresh when the panel opens so the list is never stale.
  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleOpenClick() {
    setOpen((prev) => !prev);
  }

  function handleNotificationClick(id: string, url?: string | null, orderId?: string | null) {
    markOneRead(id);
    setOpen(false);
    if (url) {
      window.location.href = url;
      return;
    }
    window.location.href = orderId ? "/wox/supplier/orders" : "/wox/supplier/notifications";
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpenClick}
        aria-label="Notifications"
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
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
          className="fixed right-2 top-14 z-[60] w-[calc(100vw-1rem)] max-w-80 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:w-80"
        >
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-zinc-900">Notifications</h3>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllRead()}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Mark all read
                </button>
              )}
              <Link
                href="/wox/supplier/notifications"
                onClick={() => setOpen(false)}
                className="flex items-center gap-0.5 text-xs font-medium text-zinc-500 hover:text-zinc-900"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-400">
                <Bell className="mx-auto mb-2 h-8 w-8 text-zinc-200" />
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <button
                  key={n._id}
                  type="button"
                  onClick={() => handleNotificationClick(n._id, n.url, n.orderId)}
                  className={cn(
                    "flex w-full gap-3 border-b border-zinc-50 px-4 py-3 text-left transition-colors hover:bg-zinc-50",
                    !n.read && "bg-blue-50/50"
                  )}
                >
                  <span className="mt-0.5 shrink-0">{getTypeIcon(n.type)}</span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block text-sm",
                        n.read ? "font-normal text-zinc-600" : "font-medium text-zinc-900"
                      )}
                    >
                      {n.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-zinc-500 line-clamp-2">{n.body}</span>
                    <span className="mt-1 block text-[10px] text-zinc-400">
                      {timeAgo(n.createdAt)}
                    </span>
                  </span>
                  {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
