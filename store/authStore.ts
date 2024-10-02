import { create } from 'zustand'
import { User } from 'next-auth'

type ExtendedUser = User & {
  role?: string
  isVerified?: boolean
}

type AuthStore = {
  isAuthenticated: boolean
  user: ExtendedUser | null
  login: (user: ExtendedUser) => void
  logout: () => void
  updateUser: (user: Partial<ExtendedUser>) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  user: null,
  login: (user) => set({ isAuthenticated: true, user }),
  logout: () => set({ isAuthenticated: false, user: null }),
  updateUser: (userData) => set((state) => ({ user: state.user ? { ...state.user, ...userData } : null })),
}))
