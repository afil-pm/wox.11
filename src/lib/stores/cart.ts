import { create } from "zustand";

export type CartItem = {
  id: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  size: string;
  sizeId: string;
  quantity: number;
  maxQuantity: number;
  category?: string;
  gender?: string;
};

interface CartState {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getItem: (productId: string, sizeId: string) => CartItem | undefined;
}

function computeTotals(items: CartItem[]) {
  return {
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  };
}

const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  totalItems: 0,
  subtotal: 0,

  addItem: (item) => {
    set((state) => {
      const existingItem = state.items.find(
        (i) => i.productId === item.productId && i.sizeId === item.sizeId
      );

      if (existingItem) {
        const updatedQuantity = Math.min(
          existingItem.quantity + item.quantity,
          existingItem.maxQuantity
        );
        const items = state.items.map((i) =>
          i.id === existingItem.id
            ? { ...i, quantity: updatedQuantity }
            : i
        );
        return { items, ...computeTotals(items) };
      }

      const newItem: CartItem = {
        ...item,
        id: `${item.productId}-${item.sizeId}-${Date.now()}`,
      };
      const items = [...state.items, newItem];
      return { items, ...computeTotals(items) };
    });
  },

  removeItem: (id) => {
    set((state) => {
      const items = state.items.filter((i) => i.id !== id);
      return { items, ...computeTotals(items) };
    });
  },

  updateQuantity: (id, quantity) => {
    set((state) => {
      const items = state.items.map((i) =>
        i.id === id
          ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxQuantity)) }
          : i
      );
      return { items, ...computeTotals(items) };
    });
  },

  clearCart: () => {
    set({ items: [], totalItems: 0, subtotal: 0 });
  },

  getItem: (productId, sizeId) => {
    return get().items.find(
      (i) => i.productId === productId && i.sizeId === sizeId
    );
  },
}));

export default useCartStore;
