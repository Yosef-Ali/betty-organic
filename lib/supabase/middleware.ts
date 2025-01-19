import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { logAuthEvent } from '@/lib/utils'
import { Database } from '@/types/supabase'

// Define protected route patterns
const PROTECTED_ROUTES = {
  ADMIN: /^\/admin/,
  DASHBOARD: /^\/dashboard/,
  SALES: /^\/sales/,
  API: /^\/api/,
} as const

// Define public route patterns
const PUBLIC_ROUTES = {
  HOME: /^\/$/,
  PUBLIC: /^\/public/,
  NEXT: /^\/_next/,
  VERIFY: /\/verify/,
  AUTH: /^\/auth/,
  LOGIN: /^\/login/,
} as const

// Define allowed roles for specific paths
const ROLE_ACCESS_MAP = {
  admin: ['ADMIN', 'DASHBOARD', 'SALES'],
  merchant: ['DASHBOARD', 'SALES'],
  customer: ['DASHBOARD'],
} as const

type UserRole = keyof typeof ROLE_ACCESS_MAP

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req: request, res: response })

  try {
    // Refresh session if needed
    await supabase.auth.getSession()

    const requestUrl = new URL(request.url)
    const isDashboardRoute = requestUrl.pathname.startsWith('/dashboard')

    // Only check auth for dashboard routes
    if (isDashboardRoute) {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        return NextResponse.redirect(new URL(`/auth/login?redirectTo=${requestUrl.pathname}`, request.url))
      }
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    return response
  }
}
