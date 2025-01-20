import { useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserRole } from '@/app/auth/actions/authActions'
import { useToast } from '@/components/ui/use-toast'

interface Profile {
  id: string
  role: UserRole
  status: 'active' | 'inactive'
}

export function useAuth() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const refreshProfile = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return null

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) throw error
      return profile as Profile
    } catch (error) {
      console.error('Error refreshing profile:', error)
      return null
    }
  }, [supabase])

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      router.push('/auth/login')
      toast({
        title: 'Signed out successfully',
        duration: 2000
      })
    } catch (error) {
      console.error('Error signing out:', error)
      toast({
        title: 'Error signing out',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive'
      })
    }
  }, [supabase, router, toast])

  const checkAuth = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      const profile = await refreshProfile()
      if (!profile) {
        toast({
          title: 'Profile not found',
          description: 'Please sign in again',
          variant: 'destructive'
        })
        await signOut()
        return
      }

      if (profile.status === 'inactive') {
        toast({
          title: 'Account inactive',
          description: 'Your account is currently inactive. Please contact support.',
          variant: 'destructive'
        })
        await signOut()
        return
      }

      return profile
    } catch (error) {
      console.error('Error checking auth:', error)
      toast({
        title: 'Authentication error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive'
      })
      return null
    }
  }, [supabase, router, toast, refreshProfile, signOut])

  const hasPermission = useCallback((requiredRole: UserRole | UserRole[]) => {
    return async () => {
      const profile = await checkAuth()
      if (!profile) return false

      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
      return roles.includes(profile.role)
    }
  }, [checkAuth])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          router.push('/auth/login')
        } else if (event === 'SIGNED_IN') {
          const profile = await refreshProfile()
          if (profile) {
            router.push(getRoleBasedRedirect(profile.role))
          }
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router, refreshProfile])

  return {
    checkAuth,
    refreshProfile,
    signOut,
    hasPermission
  }
}

function getRoleBasedRedirect(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard'
    case 'sales':
      return '/sales/dashboard'
    case 'customer':
    default:
      return '/dashboard'
  }
}
