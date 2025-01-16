import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Database } from './lib/supabase/database.types'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response.cookies.set({ name, value: '', ...options })
        }
      }
    }
  )

  try {
    const { data: { session } } = await supabase.auth.getSession()

    // Define public and protected routes
    const publicPaths = ['/', '/about', '/contact', '/pricing', '/marketing']
    const protectedPaths = ['/dashboard', '/settings', '/profile', '/orders', '/customers', '/products']

    const isPublicRoute = publicPaths.some(path =>
      request.nextUrl.pathname.startsWith(path) ||
      request.nextUrl.pathname.startsWith('/marketing')
    )

    const isProtectedRoute = protectedPaths.some(path =>
      request.nextUrl.pathname.startsWith(path)
    )

    // Allow public routes
    if (isPublicRoute) {
      return response
    }

    // Redirect to login if accessing protected route without session
    if (isProtectedRoute && !session) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Redirect to dashboard if accessing auth routes with session
    if (request.nextUrl.pathname.startsWith('/auth') && session) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
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
     * - public (public files)
     * - auth/callback (auth callback route)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|auth/callback).*)'
  ]
}
