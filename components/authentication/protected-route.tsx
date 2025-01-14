'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useSupabase } from '@/lib/contexts/supabase-context'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
  requireSales?: boolean
  requireCustomer?: boolean
}

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  requireSales = false,
  requireCustomer = false
}: ProtectedRouteProps) {
  const { session, isLoading } = useSupabase()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!session) {
        if (requireAdmin || requireSales || requireCustomer) {
          router.push('/auth/login')
        }
        return
      }

      const role = session.user.user_metadata?.role
      
      if ((requireAdmin && role !== 'admin') ||
          (requireSales && role !== 'sales') ||
          (requireCustomer && role !== 'customer')) {
        router.push('/')
      }
    }
  }, [session, isLoading, requireAdmin, requireSales, requireCustomer, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session && (requireAdmin || requireSales || requireCustomer)) {
    return null
  }

  return <>{children}</>
}
