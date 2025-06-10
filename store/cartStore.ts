import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface MarketingCartItem {
  id: string
  name: string
  imageUrl: string
  pricePerKg: number
  grams: number
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface MarketingCartStore {
  items: MarketingCartItem[]
  isContinuingShopping: boolean
  addItem: (item: MarketingCartItem) => void
  removeFromCart: (id: string) => void
  updateItemQuantity: (id: string, grams: number) => void
  clearCart: () => void
  setContinuingShopping: (continuing: boolean) => void
  resetForNewOrder: () => void
  getTotalAmount: () => number
}

// Define the current version of the store
const CURRENT_VERSION = 1

export const useMarketingCartStore = create<MarketingCartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isContinuingShopping: false,
      addItem: (newItem) => {
        if (!newItem?.id) return;
        set((state) => {
          // If user is not continuing shopping and cart has items, clear it first for fresh order
          if (!state.isContinuingShopping && state.items.length > 0) {
            // Start fresh cart with only the new item
            return { 
              items: [newItem], 
              isContinuingShopping: false 
            };
          }
          
          // Normal add item logic
          const existingItem = state.items?.find((item) => item.id === newItem.id);
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.id === newItem.id ? { ...item, grams: item.grams + newItem.grams } : item
              ),
              isContinuingShopping: state.isContinuingShopping,
            };
          }
          return { 
            items: [...(state.items || []), newItem],
            isContinuingShopping: state.isContinuingShopping,
          };
        });
      },
      removeFromCart: (id) => {
        if (!id) return;
        set((state) => ({
          items: state.items?.filter((item) => item.id !== id) || [],
          isContinuingShopping: state.isContinuingShopping,
        }));
      },
      updateItemQuantity: (id, grams) => {
        if (!id) return;
        set((state) => ({
          items: state.items?.map((item) =>
            item.id === id ? { ...item, grams: Math.max(100, grams) } : item
          ) || [],
          isContinuingShopping: state.isContinuingShopping,
        }));
      },
      clearCart: () => {
        set({ items: [], isContinuingShopping: false });
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('marketing-cart');
        }
      },
      setContinuingShopping: (continuing) => {
        set({ isContinuingShopping: continuing });
      },
      resetForNewOrder: () => {
        set({ items: [], isContinuingShopping: false });
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
      version: CURRENT_VERSION,
      // Add migration function to handle state updates
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Handle migration from version 0 to 1
          return {
            items: persistedState.items || [],
            isContinuingShopping: false,
          }
        }
        return persistedState as MarketingCartStore
      },
    }
  )
)
