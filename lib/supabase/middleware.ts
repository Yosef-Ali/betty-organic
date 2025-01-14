import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // If the cookie is updated, update the cookies for the request and response
          request.cookies.set({
            name,
            value,
            ...(options as any)
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...(options as any)
          })
        },
        remove(name: string, options: CookieOptions) {
          // If the cookie is removed, update the cookies for the request and response
          request.cookies.delete(name)
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.delete(name)
        },
      },
    }
  )

  // IMPORTANT: Do not make any data fetches or calls to the Supabase client 
  // before calling auth.getUser() as this is what sets the cookies
  // and the request object.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Handle protected routes
  const isAuthPath = request.nextUrl.pathname.startsWith('/auth')
  const isVerifyPath = request.nextUrl.pathname.includes('/verify')
  const isPublicPath = request.nextUrl.pathname === '/' || 
                      request.nextUrl.pathname.startsWith('/public')

  // If user is not signed in and the route is protected, redirect to login
  if (!user && !isAuthPath && !isVerifyPath && !isPublicPath) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // If user is signed in and tries to access auth pages, redirect to home
  if (user && isAuthPath) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}
