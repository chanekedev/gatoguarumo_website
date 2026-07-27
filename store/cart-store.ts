import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartLineItem {
  productId: string;
  variantId: string | null;
  vendorId: string;
  vendorName: string;
  name: string;
  variantName: string | null;
  price: number;
  quantity: number;
  imageUrl: string | null;
}

interface CartState {
  items: CartLineItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartLineItem, 'quantity'>, quantity?: number) => void;
  removeItem: (productId: string, variantId: string | null) => void;
  updateQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
}

function sameLine(a: { productId: string; variantId: string | null }, b: { productId: string; variantId: string | null }) {
  return a.productId === b.productId && a.variantId === b.variantId;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      addItem: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((line) => sameLine(line, item));
          if (existing) {
            return {
              items: state.items.map((line) =>
                sameLine(line, item) ? { ...line, quantity: line.quantity + quantity } : line
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity }] };
        }),
      removeItem: (productId, variantId) =>
        set((state) => ({
          items: state.items.filter((line) => !sameLine(line, { productId, variantId })),
        })),
      updateQuantity: (productId, variantId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((line) => !sameLine(line, { productId, variantId }))
              : state.items.map((line) =>
                  sameLine(line, { productId, variantId }) ? { ...line, quantity } : line
                ),
        })),
      clear: () => set({ items: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    { name: 'gato-guarumo-cart' }
  )
);

export function groupCartByVendor(items: CartLineItem[]) {
  const groups = new Map<string, { vendorId: string; vendorName: string; items: CartLineItem[] }>();
  for (const item of items) {
    const group = groups.get(item.vendorId) ?? { vendorId: item.vendorId, vendorName: item.vendorName, items: [] };
    group.items.push(item);
    groups.set(item.vendorId, group);
  }
  return Array.from(groups.values());
}

export function cartSubtotal(items: CartLineItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
