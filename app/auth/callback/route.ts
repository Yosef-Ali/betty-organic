import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, ...options }) => {
            cookieStore.set({ name, value, ...options })
          })
        }
      },
    }
  )

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  if (error || !code) {
    console.error('OAuth error:', {
      error,
      error_description,
      url: request.url
    })
    return NextResponse.redirect(new URL('/auth/error', request.url))
  }

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

    if (sessionError || !session) {
      console.error('Session error:', {
        sessionError,
        session,
        url: request.url
      })
      throw sessionError || new Error('No session')
    }

    return NextResponse.redirect(new URL('/dashboard', request.url), {
      status: 302,
    })
  } catch (error) {
    console.error('Auth error:', {
      error,
      url: request.url,
      timestamp: new Date().toISOString()
    })
    return NextResponse.redirect(new URL('/auth/error', request.url))
  }
}
