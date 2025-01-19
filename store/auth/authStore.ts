import { create } from 'zustand'
import { AuthContextType } from '../../contexts/auth/AuthContext'

type UserRole = 'admin' | 'sales' | 'customer' | null

interface Profile {
  id: string
  email: string
  name: string
  role: UserRole
  status: 'active' | 'inactive'
  auth_provider?: string
  avatar_url?: string
  isVerified?: boolean
  hasAccessToDashboard?: boolean
  created_at?: string
  updated_at?: string
}

interface AuthState {
  isAuthenticated: boolean
  profile: Profile | null
  loading: boolean
  contextLoading: boolean
}

interface AuthActions {
  login: (profile: Profile) => void
  logout: () => void
  updateProfile: (profile: Partial<Profile>) => void
  setAdminStatus: (isAdmin: boolean) => void
  setDashboardAccess: (hasAccessToDashboard: boolean) => void
  setLoading: (loading: boolean) => void
  syncWithContext: (context: AuthContextType) => void
}

type AuthStore = AuthState & AuthActions

const calculatePermissions = (role: UserRole) => ({
  isVerified: true,
  isAdmin: role === 'admin',
  isSales: role === 'sales',
  hasAccessToDashboard: role === 'admin' || role === 'sales'
})

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  profile: null,
  loading: true,
  contextLoading: true,

  login: (profile) => set({
    isAuthenticated: true,
    profile: {
      ...profile,
      ...calculatePermissions(profile.role)
    }
  }),

  logout: () => set({
    isAuthenticated: false,
    profile: null,
    loading: false,
    contextLoading: false
  }),

  updateProfile: (profileData) => set((state) => ({
    profile: state.profile ? {
      ...state.profile,
      ...profileData,
      ...calculatePermissions(profileData.role ?? state.profile.role)
    } : null
  })),

  setAdminStatus: (isAdmin) => set((state) => ({
    profile: state.profile ? {
      ...state.profile,
      role: isAdmin ? 'admin' : state.profile.role,
      ...calculatePermissions(isAdmin ? 'admin' : state.profile.role)
    } : null
  })),

  setDashboardAccess: (hasAccessToDashboard) => set((state) => ({
    profile: state.profile ? {
      ...state.profile,
      hasAccessToDashboard
    } : null
  })),

  setLoading: (loading) => set({ loading }),

  syncWithContext: (context) => set({
    isAuthenticated: !!context.profile,
    profile: context.profile ? {
      ...context.profile,
      ...calculatePermissions(context.profile.role)
    } : null,
    loading: context.loading,
    contextLoading: context.loading
  })
}))
