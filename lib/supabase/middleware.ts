import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logAuthEvent } from '@/lib/utils';

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/signup',
  '/auth/reset-password',
  '/',
  '/about',
  '/contact',
  '/public',
  '/_next',
  '/verify',
  '/auth',
  '/login',
];

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/settings',
  '/orders',
  '/products',
  '/admin',
  '/sales',
  '/api',
];

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Early return for public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Handle protected routes only
    if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
      if (!session) {
        const redirectUrl = new URL('/auth/login', req.url);
        redirectUrl.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(redirectUrl);
      }
    }

    return res;
  } catch (error) {
    // Always allow the request to continue for non-protected routes
    if (!PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
      return NextResponse.next();
    }

    // Redirect to login for protected routes
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
