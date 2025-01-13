import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface CartItem {
  id: string
  name: string
  imageUrl: string
  pricePerKg: number
  grams: number
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeFromCart: (id: string) => void
  updateItemQuantity: (id: string, grams: number) => void
  clearCart: () => void
  getTotalAmount: () => number
}

const cleanLocalStorage = () => {
  // Check if we're in a browser environment with localStorage available
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return [];
  }

  try {
    const storedData = window.localStorage.getItem('betty-organic-cart');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      // Validate and clean the data structure
      const cleanedItems = Array.isArray(parsedData?.state?.items)
        ? parsedData.state.items.filter((item: CartItem) =>
            item &&
            typeof item.id === 'string' &&
            typeof item.name === 'string' &&
            typeof item.grams === 'number' &&
            typeof item.pricePerKg === 'number' &&
            typeof item.imageUrl === 'string'
          )
        : [];

      // Update storage with cleaned data
      localStorage.setItem('betty-organic-cart', JSON.stringify({
        state: { items: cleanedItems }
      }));
      return cleanedItems;
    }
  } catch (error) {
    console.error('Error cleaning localStorage:', error);
    localStorage.removeItem('betty-organic-cart');
    return [];
  }
  return [];
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (newItem) => set((state) => {
        const existingItem = state.items.find((item) => item.id === newItem.id);
        if (existingItem) {
          return {
            items: state.items.map((item) =>
              item.id === newItem.id ? { ...item, grams: item.grams + newItem.grams } : item
            ),
          };
        }
        // Ensure we're working with serializable data
        const serializedItem = {
          id: String(newItem.id),
          name: String(newItem.name),
          imageUrl: String(newItem.imageUrl),
          pricePerKg: Number(newItem.pricePerKg),
          grams: Number(newItem.grams)
        };
        return { items: [...state.items, serializedItem] };
      }),
      removeFromCart: (id) => set((state) => ({
        items: state.items.filter((item) => item.id !== id),
      })),
      updateItemQuantity: (id: string, grams: number) => set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? { ...item, grams: Number(grams) } : item
        ),
      })),
      clearCart: () => {
        set({ items: [] });
        localStorage.removeItem('betty-organic-cart');
      },
      getTotalAmount: () => {
        const { items } = get();
        return items.reduce((total, item) => {
          return total + (item.pricePerKg * (item.grams / 1000));
        }, 0);
      },
    }),
    {
      name: 'betty-organic-cart',
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          cleanLocalStorage();
          return localStorage.getItem(name);
        },
        setItem: (name, value) => localStorage.setItem(name, value),
        removeItem: (name) => localStorage.removeItem(name),
      })),
    }
  )
)
