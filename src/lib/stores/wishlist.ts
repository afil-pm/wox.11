import { create } from "zustand";

export type WishlistItem = {
  productId: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number;
  image: string;
  category?: string;
  gender?: string;
};

type WishlistState = {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (productId: string) => void;
  toggleItem: (item: WishlistItem) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
};

export const useWishlistStore = create<WishlistState>()((set, get) => ({
  items: [],

  addItem: (item) =>
    set((state) => {
      if (state.items.some((i) => i.productId === item.productId)) {
        return state;
      }
      return { items: [...state.items, item] };
    }),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    })),

  toggleItem: (item) =>
    set((state) => {
      const exists = state.items.some(
        (i) => i.productId === item.productId
      );
      if (exists) {
        return {
          items: state.items.filter(
            (i) => i.productId !== item.productId
          ),
        };
      }
      return { items: [...state.items, item] };
    }),

  isInWishlist: (productId) => {
    return get().items.some((i) => i.productId === productId);
  },

  clearWishlist: () => set({ items: [] }),
}));
