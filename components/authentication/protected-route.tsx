'use client'

import { useAuth } from '@/lib/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
  requireSales?: boolean
  requireCustomer?: boolean
  initialAuthToken?: string
}

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  requireSales = false,
  requireCustomer = false,
  initialAuthToken
}: ProtectedRouteProps) {
  const { user, isAdmin, isSales, isCustomer, isLoading } = useAuth()
  const router = useRouter()
  const [isCookieLoaded, setIsCookieLoaded] = useState(!!initialAuthToken)

  useEffect(() => {
    if (!isLoading) {
      try {
        if (!user) {
          // Only redirect to login if trying to access protected pages
          if (requireAdmin || requireSales || requireCustomer) {
            router.push('/auth/signin')
          } else {
            // Allow access to public pages
            return
          }
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

        if (requireCustomer) {
          if (!isCustomer && !isAdmin && !isSales) {
            // If trying to access customer-only page but not a customer
            router.push('/')
            return
          }
        } else if (isCustomer) {
          // If customer trying to access non-customer page (like dashboard)
          router.push('/')
          return
        }
      } catch (error) {
        console.error('Authentication error:', error)
        // Clear potentially corrupted auth state
        localStorage.removeItem('sb-auth-token')
        document.cookie = 'sb-auth-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'
        router.push('/auth/signin')
      }
    }
  }, [user, isAdmin, isSales, isCustomer, isLoading, requireAdmin, requireSales, requireCustomer, router])

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

  if (!user && (requireAdmin || requireSales || requireCustomer)) {
    return null
  }

  if ((requireAdmin && !isAdmin) || 
      (requireSales && !isSales && !isAdmin) ||
      (requireCustomer && !isCustomer && !isAdmin && !isSales) ||
      (!requireCustomer && isCustomer)) {
    return null
  }

  return <>{children}</>
}
