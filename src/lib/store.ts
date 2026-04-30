import { create } from 'zustand';
import { Product, CartItem } from '../types';

interface CartStore {
  items: CartItem[];
  wishlist: Product[];
  isOpen: boolean;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setIsOpen: (isOpen: boolean) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
}

export const useCart = create<CartStore>((set, get) => ({
  items: [],
  wishlist: [],
  isOpen: false,
  // ... existing cart functions ...
  toggleWishlist: (product) => {
    set((state) => {
      const exists = state.wishlist.some(p => p.id === product.id);
      if (exists) {
        return { wishlist: state.wishlist.filter(p => p.id !== product.id) };
      }
      return { wishlist: [...state.wishlist, product] };
    });
  },
  isInWishlist: (productId) => {
    return get().wishlist.some(p => p.id === productId);
  },
  // Re-implementing existing functions to keep context
  addItem: (product) => {
    set((state) => {
      const existingItem = state.items.find((item) => item.id === product.id);
      if (existingItem) {
        return {
          items: state.items.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          ),
        };
      }
      return { items: [...state.items, { ...product, quantity: 1 }] };
    });
  },
  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== productId),
    }));
  },
  updateQuantity: (productId, quantity) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === productId ? { ...item, quantity: Math.max(0, quantity) } : item
      ).filter(item => item.quantity > 0),
    }));
  },
  clearCart: () => set({ items: [] }),
  setIsOpen: (isOpen) => set({ isOpen }),
  getTotalItems: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
  getTotalPrice: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },
}));
