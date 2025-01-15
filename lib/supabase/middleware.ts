import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { logAuthEvent } from '@/lib/utils'
import { Database } from '@/types/supabase'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: DO NOT REMOVE auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get current route info
  const requestUrl = new URL(request.url)
  const isAuthPath = requestUrl.pathname.startsWith('/auth') ||
    requestUrl.pathname.startsWith('/login')
  const isApiPath = requestUrl.pathname.startsWith('/api')
  const isPublicPath = requestUrl.pathname === '/' ||
    requestUrl.pathname.startsWith('/public') ||
    requestUrl.pathname.startsWith('/_next') ||
    requestUrl.pathname.includes('/verify')

  // Handle authentication state
  if (!user) {
    if (!isAuthPath && !isPublicPath && !isApiPath) {
      // Save the original URL to redirect back after login
      const callbackUrl = encodeURIComponent(requestUrl.pathname)
      logAuthEvent('Redirecting to login', { metadata: { path: requestUrl.pathname } })
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('callbackUrl', callbackUrl)
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // User is signed in
  if (isAuthPath) {
    return supabaseResponse;
  }

  // Check role-based access
  const userRole = user.user_metadata?.role || 'customer'
  const isAdminPath = requestUrl.pathname.startsWith('/admin')
  const isSalesPath = requestUrl.pathname.startsWith('/sales')

  if (isAdminPath && userRole !== 'admin') {
    logAuthEvent('Unauthorized admin access', {
      metadata: {
        path: requestUrl.pathname,
        role: userRole
      }
    })
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (isSalesPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}
