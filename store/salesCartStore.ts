import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface SalesCartItem {
  id: string;
  name: string;
  imageUrl: string;
  pricePerKg: number;
  grams: number;
  unit: string | null;
}

interface SalesCartStore {
  items: SalesCartItem[];
  addItem: (item: SalesCartItem) => void;
  removeFromCart: (id: string) => void;
  updateItemQuantity: (id: string, grams: number) => void;
  clearCart: () => void;
  getTotalAmount: () => number;
}

export const useSalesCartStore = create<SalesCartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: newItem =>
        set(state => {
          const existingItem = state.items.find(item => item.id === newItem.id);
          if (existingItem) {
            return {
              items: state.items.map(item =>
                item.id === newItem.id
                  ? { ...item, grams: item.grams + newItem.grams }
                  : item,
              ),
            };
          }
          return { items: [...state.items, newItem] };
        }),
      removeFromCart: id =>
        set(state => ({
          items: state.items.filter(item => item.id !== id),
        })),
      updateItemQuantity: (id: string, grams: number) =>
        set(state => ({
          items: state.items.map(item =>
            item.id === id ? { ...item, grams } : item,
          ),
        })),
      clearCart: () => {
        console.log('[CANCEL] clearCart called - clearing items array and localStorage');
        set({ items: [] });
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('sales-cart');
          console.log('[CANCEL] localStorage cleared');
        }
      },
      getTotalAmount: () => {
        const { items } = get();
        return items.reduce((total, item) => {
          return total + (item.pricePerKg * (item.grams / 1000));
        }, 0);
      },
    }),
    {
      name: 'sales-cart',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
