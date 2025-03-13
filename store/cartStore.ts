import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface MarketingCartItem {
  id: string
  name: string
  imageUrl: string
  pricePerKg: number
  grams: number
}

interface MarketingCartStore {
  items: MarketingCartItem[]
  addItem: (item: MarketingCartItem) => void
  removeFromCart: (id: string) => void
  updateItemQuantity: (id: string, grams: number) => void
  clearCart: () => void
  getTotalAmount: () => number
}

export const useMarketingCartStore = create<MarketingCartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (newItem) => {
        if (!newItem?.id) return;
        set((state) => {
          const existingItem = state.items?.find((item) => item.id === newItem.id);
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.id === newItem.id ? { ...item, grams: item.grams + newItem.grams } : item
              ),
            };
          }
          return { items: [...(state.items || []), newItem] };
        });
      },
      removeFromCart: (id) => {
        if (!id) return;
        set((state) => ({
          items: state.items?.filter((item) => item.id !== id) || [],
        }));
      },
      updateItemQuantity: (id, grams) => {
        if (!id) return;
        set((state) => ({
          items: state.items?.map((item) =>
            item.id === id ? { ...item, grams: Math.max(100, grams) } : item
          ) || [],
        }));
      },
      clearCart: () => {
        set({ items: [] });
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('marketing-cart');
        }
      },
      getTotalAmount: () => {
        const { items } = get();
        return (items || []).reduce((total, item) => {
          return total + (item.pricePerKg * (item.grams / 1000));
        }, 0);
      },
    }),
    {
      name: 'marketing-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (!state) {
          console.warn('Failed to rehydrate marketing cart state');
        }
      },
    }
  )
)
