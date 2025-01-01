import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from './lib/auth'

export async function middleware(request: NextRequest) {
  const session = await getSession()
  const { pathname } = request.nextUrl

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  // Redirect authenticated users away from auth pages
  if (pathname.startsWith('/auth') && session) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/:path*'
  ]
}
