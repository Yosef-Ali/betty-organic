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
    console.log('Adding item to cart:', newItem);
    const existingItem = state.items.find((item) => item.id === newItem.id);
    if (existingItem) {
      console.log('Item already exists, updating grams:', existingItem);
      return {
        items: state.items.map((item) =>
          item.id === newItem.id ? { ...item, grams: item.grams + newItem.grams } : item
        ),
      };
    }
    return { items: [...state.items, newItem] };
  }),
  removeFromCart: (id) => set((state) => {
    console.log('Removing item from cart with id:', id);
    return {
      items: state.items.filter((item) => item.id !== id),
    };
  }),
  updateGrams: (id, grams) => set((state) => {
    console.log(`Updating grams for item with id ${id} to ${grams}`);
    return {
      items: state.items.map((item) =>
        item.id === id ? { ...item, grams } : item
      ),
    };
  }),
  clearCart: () => {
    console.log('Clearing cart');
    set({ items: [] });
  },
}));
