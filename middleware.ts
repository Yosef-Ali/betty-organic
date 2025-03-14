import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Skip middleware for authentication-related routes and public assets
  if (
    request.nextUrl.pathname.startsWith('/auth') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api/auth') ||
    request.nextUrl.pathname.includes('.') ||
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname === '/api/auth/session' // Allow session check endpoint
  ) {
    return NextResponse.next();
  }

  // Check for required environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Missing Supabase environment variables');
    return NextResponse.next();
  }

  // Create a response object to modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

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
          // Directly set cookies on response without treating as Promise
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          // Directly remove cookies without treating as Promise
          response.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          });
        },
      },
    },
  );

  try {
    // Get user session with more detailed logging
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error in middleware:', sessionError);
      return redirectToLogin(request);
    }

    // Debug log (remove in production)
    console.log('Session check in middleware:',
      session ? `User authenticated: ${session.user.id}` : 'No active session');

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
      console.log('Access attempt to protected route without session:', request.nextUrl.pathname);
      return redirectToLogin(request);
    }

    // If we have a session, get the user's profile for role-based access
    if (session) {
      // Add user data to request headers for components to access
      response.headers.set('x-user-id', session.user.id);
      response.headers.set('x-user-email', session.user.email || '');
      response.headers.set('x-user-authenticated', 'true');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', session.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
        return redirectToLogin(request);
      }

      const userRole = profile?.role || 'customer';
      const userStatus = profile?.status || 'active';

      // Add role to headers
      response.headers.set('x-user-role', userRole);

      // Check if user is inactive
      if (userStatus === 'inactive') {
        console.log('Inactive user attempted access:', session.user.id);
        return redirectToLogin(request);
      }

      // Role-based route protection
      if (request.nextUrl.pathname.startsWith('/dashboard')) {
        // Admin-only routes
        if (request.nextUrl.pathname.startsWith('/dashboard/admin') && userRole !== 'admin') {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }

        // Sales routes - accessible by admin and sales
        if (request.nextUrl.pathname.startsWith('/dashboard/sales') && !['admin', 'sales'].includes(userRole)) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }

        // Customer routes - accessible by all authenticated users
        if (request.nextUrl.pathname.startsWith('/dashboard/customer') && !['admin', 'sales', 'customer'].includes(userRole)) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }
    }

    return response;
  } catch (err) {
    console.error('Middleware error:', err);
    return redirectToLogin(request);
  }
}

function redirectToLogin(request: NextRequest) {
  const redirectUrl = new URL('/auth/login', request.url);
  redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
  return NextResponse.redirect(redirectUrl);
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
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
