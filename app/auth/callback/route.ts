import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    if (!code) {
      throw new Error('No code provided')
    }

    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)

    return NextResponse.redirect(new URL('/dashboard', requestUrl))
  } catch (error) {
    console.error('Auth callback error:', error)
    // Make sure this URL is absolute
    return NextResponse.redirect(new URL('/auth/login?error=callback_error', request.url))
  }
}
