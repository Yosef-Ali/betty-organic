import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function middleware(request: NextRequest) {
  // Skip middleware for authentication-related routes and public assets
  if (
    request.nextUrl.pathname.startsWith('/auth') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api/auth') ||
    request.nextUrl.pathname.includes('.') ||
    request.nextUrl.pathname === '/'
  ) {
    return NextResponse.next();
  }

  try {
    // Create a response object to modify
    let response = NextResponse.next();

    // Create a Supabase client using the request cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value: '',
              ...options,
              maxAge: 0,
            });
          },
        },
      }
    );

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error:', sessionError);
      return redirectToLogin(request);
    }

    // Protected routes that require authentication
    const protectedRoutes = [
      '/dashboard',
      '/checkout',
      '/orders',
      '/api/orders',
      '/profile'
    ];

    const isProtectedRoute = protectedRoutes.some(route =>
      request.nextUrl.pathname.startsWith(route)
    );

    // If there's no session and the user is trying to access a protected route
    if (!session && isProtectedRoute) {
      return redirectToLogin(request);
    }

    // If we have a session, get the user's profile for role-based access
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', session.user.id)
        .single();

      // Set user role in response header for client access
      response.headers.set('x-user-role', profile?.role || 'customer');
      response.headers.set('x-user-id', session.user.id);
      response.headers.set('x-user-email', session.user.email || '');
      response.headers.set('x-user-authenticated', 'true');

      // Check if user is inactive
      if (profile?.status === 'inactive') {
        return redirectToLogin(request);
      }

      // Role-based route protection
      if (request.nextUrl.pathname.startsWith('/dashboard')) {
        // Admin-only routes
        if (
          request.nextUrl.pathname.startsWith('/dashboard/admin') &&
          profile?.role !== 'admin'
        ) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }

        // Sales routes - accessible by admin and sales
        if (
          request.nextUrl.pathname.startsWith('/dashboard/sales') &&
          !['admin', 'sales'].includes(profile?.role || '')
        ) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }

      return response;
    }

    return response;
  } catch (err) {
    console.error('Middleware error:', err);
    return redirectToLogin(request);
  }
}

function redirectToLogin(request: NextRequest) {
  const redirectUrl = new URL('/auth/login', request.url);
  redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|gif|png|svg|ico)|public).*)',
  ],
};
