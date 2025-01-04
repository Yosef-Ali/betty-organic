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

    // Protected routes
    const protectedRoutes = ['/dashboard', '/admin']
    const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))

    // Auth routes
    const authRoutes = ['/auth/signin', '/auth/signup', '/auth/callback']
    const isAuthRoute = authRoutes.includes(path)

    // Redirect to dashboard if authenticated and trying to access auth routes
    if (session && isAuthRoute) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Redirect to login if not authenticated and trying to access protected routes
    if (!session && isProtectedRoute) {
      const redirectUrl = new URL('/auth/signin', req.url)
      // Store the returnTo URL in sessionStorage
      redirectUrl.searchParams.set('returnTo', path)
      return NextResponse.redirect(redirectUrl)
    }

    // Set secure cookie attributes
    if (session) {
      res.cookies.set('sb-auth-token', session.access_token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      })
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
    '/dashboard/:path*',
    '/admin/:path*',
    '/auth/:path*'
  ]
}
