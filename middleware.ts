import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'

export async function middleware(req: NextRequest) {
  try {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })

    // Refresh session if expired - required for Server Components
    const { data: { session }, error } = await supabase.auth.getSession()

    // Get user session
    const { data: { user } } = await supabase.auth.getUser()

    // Handle auth and marketing paths
    const isAuthPath = req.nextUrl.pathname.startsWith('/auth')
    const isVerifyPath = req.nextUrl.pathname.includes('/verify')
    const isMarketingPath = req.nextUrl.pathname === '/' || req.nextUrl.pathname.startsWith('/(marketing)')

    // Redirect unauthenticated users (except for marketing pages)
    if (!user && !isAuthPath && !isVerifyPath && !isMarketingPath) {
      const url = req.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }

    // Handle dashboard routes with role checking
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      if (!user) {
        return NextResponse.redirect(new URL('/auth/login', req.url))
      }

      // Check user role from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile?.role || profile.role !== 'admin') {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
