'use client'

import { useAuth } from '@/lib/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
  requireSales?: boolean
}

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  requireSales = false
}: ProtectedRouteProps) {
  const { user, isAdmin, isSales, isLoading } = useAuth()
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

  if ((requireAdmin && !isAdmin) || (requireSales && !isSales && !isAdmin)) {
    return null
  }

  return <>{children}</>
}
