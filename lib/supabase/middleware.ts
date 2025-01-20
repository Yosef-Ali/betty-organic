import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { logAuthEvent } from '@/lib/utils'

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/signup',
  '/auth/reset-password',
  '/',
  '/about',
  '/contact',
  '/public',
  '/_next',
  '/verify',
  '/auth',
  '/login',
]

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/settings',
  '/orders',
  '/products',
  '/admin',
  '/sales',
  '/api',
]

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const pathname = req.nextUrl.pathname

  try {
    // Check if it's a public route
    if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
      return res
    }

    // Refresh session
    const { data: { session } } = await supabase.auth.getSession()

    // For protected routes, check if user is authenticated
    if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
      if (!session) {
        // Redirect to login if not authenticated
        const redirectUrl = new URL('/auth/login', req.url)
        redirectUrl.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(redirectUrl)
      }
    }

    // User is authenticated, allow access
    return res
  } catch (error) {
    // Log any errors and redirect to login
    logAuthEvent('Middleware error', {
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      level: 'error'
    })
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
