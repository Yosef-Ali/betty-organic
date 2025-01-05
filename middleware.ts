import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Set security headers
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')

  try {
    // Refresh session if needed - this will automatically set cookies
    const { data: { session } } = await supabase.auth.getSession()
    const path = req.nextUrl.pathname

    // Protected routes - only these require authentication
    const protectedRoutes = ['/dashboard', '/admin']
    const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))
    
    // Public routes that should never require auth
    const publicRoutes = ['/', '/products', '/about', '/contact']
    const isPublicRoute = publicRoutes.some(route => path.startsWith(route))

    // Auth routes
    const authRoutes = ['/auth/signin', '/auth/signup', '/auth/callback', '/auth/magic-link']
    const isAuthRoute = authRoutes.includes(path)

    // Redirect to dashboard if authenticated and trying to access auth routes
    if (session && isAuthRoute) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Handle session state for protected routes
    if (isProtectedRoute) {
      // If no session but we have tokens, try to refresh
      if (!session) {
        const authToken = req.cookies.get('sb-auth-token')?.value
        const refreshToken = req.cookies.get('sb-refresh-token')?.value
        
        if (authToken && refreshToken) {
          const { data: refreshedSession } = await supabase.auth.setSession({
            access_token: authToken,
            refresh_token: refreshToken
          })
          
          if (refreshedSession) {
            // If refresh succeeded, continue with the request
            return res
          }
        }
        
        // If no valid session or refresh failed, redirect to login
        const redirectUrl = new URL('/auth/signin', req.url)
        redirectUrl.searchParams.set('returnTo', path)
        return NextResponse.redirect(redirectUrl)
      }
      
      // If we have a session, ensure cookies are set
      if (session) {
        const expiresAt = new Date(session.expires_at * 1000)
        const maxAge = Math.floor((expiresAt.getTime() - Date.now()) / 1000)
        
        res.cookies.set('sb-auth-token', session.access_token, {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: maxAge,
          expires: expiresAt
        })
        res.cookies.set('sb-refresh-token', session.refresh_token, {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: maxAge,
          expires: expiresAt
        })
      }
    }

    // For public routes, just continue without any session checks
    if (isPublicRoute) {
      // Clear any existing auth cookies if present
      res.cookies.delete('sb-auth-token')
      res.cookies.delete('sb-refresh-token')
      return res
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    // If there's an error, clear the auth token
    res.cookies.delete('sb-auth-token')
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth (auth routes)
     * - public (public assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|auth|public).*)',
  ],
}
