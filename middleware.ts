import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    // Refresh the session
    const { data: { session }, error } = await supabase.auth.getSession()

    // If there's an error or no session, and we're not on an auth page
    if ((!session || error) && !req.nextUrl.pathname.startsWith('/auth')) {
      const redirectUrl = new URL('/auth/login', req.url)
      // Preserve the original URL to redirect back after login
      redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // If we have a session and we're on an auth page, redirect to dashboard
    if (session && req.nextUrl.pathname.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, we should probably redirect to login as well
    const redirectUrl = new URL('/auth/login', req.url)
    return NextResponse.redirect(redirectUrl)
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/:path*'  // Add auth paths to handle redirects when already logged in
  ]
}
