import { create } from 'zustand';

interface UIState {
  isCartOpen: boolean;
  isChatVisible: boolean;
  setCartOpen: (isOpen: boolean) => void;
  setChatVisible: (isVisible: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isCartOpen: false,
  isChatVisible: true,
  setCartOpen: (isOpen) => set({ 
    isCartOpen: isOpen,
    // Hide chat when cart is open
    isChatVisible: isOpen ? false : true
  }),
  setChatVisible: (isVisible) => set({ isChatVisible: isVisible }),
}));