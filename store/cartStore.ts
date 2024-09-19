import { create } from 'zustand'

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
  updateGrams: (id: string, grams: number) => void
  clearCart: () => void
}

export const useCartStore = create<CartStore>((set) => ({
  items: [],
  addItem: (newItem) => set((state) => {
    const existingItem = state.items.find((item) => item.id === newItem.id)
    if (existingItem) {
      return {
        items: state.items.map((item) =>
          item.id === newItem.id ? { ...item, grams: item.grams + newItem.grams } : item
        ),
      }
    }
    return { items: [...state.items, newItem] }
  }),
  removeFromCart: (id) => set((state) => ({
    items: state.items.filter((item) => item.id !== id),
  })),
  updateGrams: (id, grams) => set((state) => ({
    items: state.items.map((item) =>
      item.id === id ? { ...item, grams } : item
    ),
  })),
  clearCart: () => set({ items: [] }),
}))