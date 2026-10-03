"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "wox-recently-viewed";
const MAX_ITEMS = 20;

export type RecentProduct = {
  slug: string;
  name: string;
  image: string;
  price: number;
  salePrice: number | null;
  category: string;
  gender: string;
  viewedAt: number;
};

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentProduct[]>([]);
  /** True once localStorage has been read — lets pages avoid flashing the
   *  empty state before the stored history arrives. */
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {}
    setHydrated(true);
  }, []);

  const addView = useCallback((product: Omit<RecentProduct, "viewedAt">) => {
    setItems((prev) => {
      const filtered = prev.filter((item) => item.slug !== product.slug);
      const updated = [{ ...product, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const removeItem = useCallback((slug: string) => {
    setItems((prev) => {
      const updated = prev.filter((item) => item.slug !== slug);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  return { items, hydrated, addView, removeItem, clearRecent };
}
