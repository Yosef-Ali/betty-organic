import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface CartItem {
  id: string; // Change this to string
  grams: number;
  name: string;
  pricePerKg: number;
  imageUrl: string;
}

export interface CartStore {
  cart: CartItem[];
  addToCart: (id: string, grams: number, name: string, pricePerKg: number, imageUrl: string) => void; // Change id to string
  removeFromCart: (id: string) => void; // Change id to string
  updateGrams: (id: string, grams: number) => void; // Change id to string
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalAmount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: [],
      addToCart: (id, grams, name, pricePerKg, imageUrl) =>
        set((state) => {
          const existingItem = state.cart.find((item) => item.id === id);
          if (existingItem) {
            return {
              cart: state.cart.map((item) =>
                item.id === id ? { ...item, grams: item.grams + grams } : item
              ),
            };
          } else {
            return { cart: [...state.cart, { id, name, pricePerKg, grams, imageUrl }] };
          }
        }),
      removeFromCart: (id) =>
        set((state) => ({
          cart: state.cart.filter((item) => item.id !== id),
        })),
      updateGrams: (id, grams) =>
        set((state) => ({
          cart: state.cart.map((item) =>
            item.id === id ? { ...item, grams: grams } : item
          ),
        })),
      clearCart: () => set({ cart: [] }),
      getTotalItems: () => {
        return get().cart.length;
      },
      getTotalAmount: () => {
        return get().cart.reduce((total, item) => total + (item.pricePerKg * item.grams / 1000), 0);
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)