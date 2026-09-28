import { create } from "zustand";
import { supplierFetch } from "@/lib/supplier-api";

export interface SupplierNotification {
  _id: string;
  title: string;
  body: string;
  type: string;
  orderId?: string | null;
  url?: string | null;
  read: boolean;
  createdAt: string;
}

interface SupplierNotificationsState {
  notifications: SupplierNotification[];
  unreadCount: number;
  loading: boolean;
  loaded: boolean;
  /** Silent refresh of the feed + unread count. */
  refresh: () => Promise<void>;
  markAllRead: () => Promise<void>;
  markOneRead: (id: string) => Promise<void>;
}

const FEED_LIMIT = 50;

/**
 * Shared feed for the supplier panel header bell, sidebar badge and the
 * notifications page: one poll feeds all of them, and every write goes through
 * the supplier scoped API (session auth), so the rows are always this
 * supplier's own.
 */
export const useSupplierNotifications = create<SupplierNotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  loaded: false,

  refresh: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const res = await supplierFetch(`/api/wox/supplier/notifications?limit=${FEED_LIMIT}`);
      const data = await res.json();
      if (Array.isArray(data.notifications)) {
        set({
          notifications: data.notifications,
          unreadCount: data.unreadCount || 0,
          loaded: true,
        });
      }
    } catch {
      // Offline / transient failure: keep the last known feed.
    } finally {
      set({ loading: false });
    }
  },

  markAllRead: async () => {
    const previous = get().notifications;
    set({
      notifications: previous.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    });
    try {
      await supplierFetch("/api/wox/supplier/notifications/read", {
        method: "POST",
        body: JSON.stringify({ markAll: true }),
      });
    } catch {
      set({ notifications: previous });
      get().refresh();
    }
  },

  markOneRead: async (id: string) => {
    const previous = get().notifications;
    const target = previous.find((n) => n._id === id);
    if (!target || target.read) return;

    set({
      notifications: previous.map((n) => (n._id === id ? { ...n, read: true } : n)),
      unreadCount: Math.max(0, get().unreadCount - 1),
    });
    try {
      await supplierFetch("/api/wox/supplier/notifications/read", {
        method: "POST",
        body: JSON.stringify({ notificationId: id }),
      });
    } catch {
      set({ notifications: previous });
      get().refresh();
    }
  },
}));
