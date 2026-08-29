"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { adminFetch } from "@/lib/admin-api";

interface UnreadCounts {
  orders: number;
  messages: number;
  total: number;
}

const STORAGE_PREFIX = "wox-admin-lastSeen-";
const POLL_INTERVAL = 10000;

function getTimestamp(section: string): string | null {
  try {
    return localStorage.getItem(STORAGE_PREFIX + section);
  } catch {
    return null;
  }
}

function setTimestamp(section: string, iso: string) {
  try {
    localStorage.setItem(STORAGE_PREFIX + section, iso);
  } catch {
    // silently fail
  }
}

export function useUnreadCounts(enabled: boolean) {
  const [counts, setCounts] = useState<UnreadCounts>({ orders: 0, messages: 0, total: 0 });
  const [lastServerTime, setLastServerTime] = useState<string>("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCounts = useCallback(async () => {
    if (!enabled) return;
    try {
      const ordersTs = getTimestamp("orders");
      const messagesTs = getTimestamp("messages");

      const params = new URLSearchParams();
      if (ordersTs) params.set("orders", ordersTs);
      if (messagesTs) params.set("messages", messagesTs);

      const res = await adminFetch(`/api/admin/unread-counts?${params.toString()}`);
      const data = await res.json();

      if (data.counts) {
        setCounts(data.counts);
        setLastServerTime(data.serverTime || "");
      }
    } catch {
      // silently fail
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    fetchCounts();
    intervalRef.current = setInterval(fetchCounts, POLL_INTERVAL);

    function onVisible() {
      if (document.visibilityState === "visible") {
        fetchCounts();
      }
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, fetchCounts]);

  const markAsRead = useCallback((section: string) => {
    const now = lastServerTime || new Date().toISOString();
    setTimestamp(section, now);
    setCounts((prev) => ({
      ...prev,
      [section]: 0,
      total: Math.max(0, prev.total - (prev[section as keyof UnreadCounts] || 0)),
    }));
  }, [lastServerTime]);

  const resetAll = useCallback(() => {
    try {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith(STORAGE_PREFIX));
      keys.forEach((k) => localStorage.removeItem(k));
    } catch {
      // silently fail
    }
    setCounts({ orders: 0, messages: 0, total: 0 });
  }, []);

  return { counts, markAsRead, resetAll, refresh: fetchCounts };
}
