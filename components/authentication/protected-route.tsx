'use client'

import { useAuth } from '@/lib/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cookies } from 'next/headers'

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
  const [isCookieLoaded, setIsCookieLoaded] = useState(false)

  // Handle cookie loading
  useEffect(() => {
    const loadCookie = async () => {
      try {
        const cookieStore = cookies()
        const authToken = await cookieStore.get('sb-auth-token')
        if (authToken) {
          // Handle the token if needed
        }
        setIsCookieLoaded(true)
      } catch (error) {
        console.error('Failed to load cookies:', error)
        setIsCookieLoaded(true) // Continue anyway
      }
    }

    loadCookie()
  }, [])

  useEffect(() => {
    if (!isLoading) {
      try {
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
      } catch (error) {
        console.error('Authentication error:', error)
        // Clear potentially corrupted auth state
        localStorage.removeItem('sb-auth-token')
        document.cookie = 'sb-auth-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'
        router.push('/auth/signin')
      }
    }
  }, [user, isAdmin, isSales, isCustomer, isLoading, requireAdmin, requireSales, requireCustomer, router])

  if (isLoading || !isCookieLoaded) {
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
