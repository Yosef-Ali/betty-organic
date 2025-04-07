import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Skip middleware for public routes and assets
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api/public') ||
    request.nextUrl.pathname.includes('.') ||
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname === '/marketing'
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

    // Auth routes don't need session validation, but we'll pass through the session if it exists
    if (request.nextUrl.pathname.startsWith('/auth')) {
      // Use getUser instead of getSession for better security
      const { data: { user } } = await supabase.auth.getUser();

      // If user is already logged in and trying to access auth pages, redirect to dashboard
      if (user && !request.nextUrl.pathname.startsWith('/auth/logout')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      return response;
    }

    // For all other routes, validate session using getUser for better security
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('User authentication error:', userError);
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

    // If there's no authenticated user and the user is trying to access a protected route
    if (!user && isProtectedRoute) {
      return redirectToLogin(request);
    }

    // If we have an authenticated user, get the user's profile for role-based access
    if (user) {
      // We already have the authenticated user from getUser() above
      // No need to call getSession() again

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', user.id)
        .single();

      // Set user role in response header for client access (secure way to make role available to client)
      response.headers.set('x-user-role', profile?.role || 'customer');
      response.headers.set('x-user-id', user.id);
      response.headers.set('x-user-authenticated', 'true');

      // Check if user is inactive and deny access
      if (profile?.status === 'inactive') {
        // Sign out the inactive user
        await supabase.auth.signOut();
        return NextResponse.redirect(
          new URL('/auth/login?error=account_inactive', request.url)
        );
      }

      // Role-based route protection
      if (request.nextUrl.pathname.startsWith('/dashboard')) {
        // Only admin and sales can access dashboard (except profile)
        if (
          !request.nextUrl.pathname.startsWith('/dashboard/profile') &&
          !['admin', 'sales'].includes(profile?.role || '')
        ) {
          return NextResponse.redirect(new URL('/', request.url));
        }

        // Admin-only routes
        if (
          (request.nextUrl.pathname.startsWith('/dashboard/admin') ||
            request.nextUrl.pathname.startsWith('/dashboard/users/manage')) &&
          profile?.role !== 'admin'
        ) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }

      // Attach session to response
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
  redirectUrl.searchParams.set('returnTo', request.nextUrl.pathname);
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder (public assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|gif|png|svg|ico)|public).*)',
  ],
};
