"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Package,
  AlertTriangle,
  Info,
  UserCheck,
  MessageSquare,
  CheckCheck,
} from "lucide-react";
import WoxLoader from "@/components/ui/wox-loader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useSupplierNotifications,
  SupplierNotification,
} from "@/lib/stores/supplier-notifications";

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

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * The supplier's notification inbox: their own order, cancellation, shipping,
 * payment, verification and stock alerts — nothing from other suppliers.
 */
export default function SupplierNotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const notifications = useSupplierNotifications((s) => s.notifications);
  const unreadCount = useSupplierNotifications((s) => s.unreadCount);
  const loaded = useSupplierNotifications((s) => s.loaded);
  const loading = useSupplierNotifications((s) => s.loading);
  const refresh = useSupplierNotifications((s) => s.refresh);
  const markAllRead = useSupplierNotifications((s) => s.markAllRead);
  const markOneRead = useSupplierNotifications((s) => s.markOneRead);

  useEffect(() => {
    if (!loaded) refresh();
  }, [loaded, refresh]);

  const visible: SupplierNotification[] =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  function openNotification(notification: SupplierNotification) {
    markOneRead(notification._id);
    window.location.href =
      notification.url || (notification.orderId ? "/wox/supplier/orders" : "/wox/supplier");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Notifications</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Updates about your orders, products and account.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
            {unreadCount} unread
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => markAllRead()}
            disabled={unreadCount === 0}
            className="gap-1.5"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        {(["all", "unread"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              filter === key
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            )}
          >
            {key === "all" ? `All (${notifications.length})` : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        {loaded && loading && notifications.length === 0 ? (
          <div className="flex h-40 items-center justify-center">
            <WoxLoader />
          </div>
        ) : visible.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-zinc-400">
            <Bell className="mx-auto mb-3 h-8 w-8 text-zinc-200" />
            {filter === "unread" ? "You are all caught up." : "No notifications yet."}
          </div>
        ) : (
          <ul className="divide-y">
            {visible.map((notification) => (
              <li key={notification._id}>
                <button
                  type="button"
                  onClick={() => openNotification(notification)}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-zinc-50",
                    !notification.read && "bg-blue-50/40"
                  )}
                >
                  <span className="mt-0.5 shrink-0 rounded-lg border border-zinc-100 bg-white p-2">
                    {getTypeIcon(notification.type)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-sm",
                          notification.read
                            ? "font-normal text-zinc-600"
                            : "font-semibold text-zinc-900"
                        )}
                      >
                        {notification.title}
                      </span>
                      {!notification.read && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                      )}
                    </span>
                    <span className="mt-1 block text-sm text-zinc-500">{notification.body}</span>
                    <span className="mt-1 block text-xs text-zinc-400">
                      {formatDate(notification.createdAt)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
