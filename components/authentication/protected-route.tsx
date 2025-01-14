'use client'

import { useAuth } from '@/lib/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

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
  const { user, isAdmin, isSales, isCustomer, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/auth/signin')
        return
      }

      if (requireAdmin && !isAdmin) {
        router.push('/unauthorized')
        return
      }

      if (requireSales && !isSales && !isAdmin) {
        router.push('/unauthorized')
        return
      }

      if (requireCustomer && !isCustomer && !isAdmin && !isSales) {
        router.push('/')
        return
      }
    }
  }, [user, isAdmin, isSales, isLoading, requireAdmin, requireSales, router])

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

  if (!user) {
    return null
  }

  if ((requireAdmin && !isAdmin) || 
      (requireSales && !isSales && !isAdmin) ||
      (requireCustomer && !isCustomer && !isAdmin && !isSales)) {
    return null
  }

  return <>{children}</>
}
