import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Skip middleware for authentication-related routes and public assets
  if (
    request.nextUrl.pathname.startsWith('/auth') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api/auth') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for required environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Missing Supabase environment variables');
    return NextResponse.next();
  }

  // Create a response object to modify
  let response = NextResponse.next();

  // Create a Supabase client using the request cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Don't set cookies for middleware, just read them
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          // Don't remove cookies for middleware, just read them
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
  const { data: { session } } = await supabase.auth.getSession();

  // Debug session information
  console.log(`Middleware session check: ${session ? 'Session found' : 'No session'}`);
  if (session) {
    console.log(`User ID: ${session.user.id}`);
  }

  // Protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/checkout',
    '/orders',
    '/api/orders'
  ];

  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );

  // If there's no session and the user is trying to access a protected route
  if (!session && isProtectedRoute) {
    // Store the original URL to redirect back after sign in
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Role-based access control for dashboard routes
  if (session && request.nextUrl.pathname.startsWith('/dashboard')) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // If we can't fetch the profile, let's create a default one
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              id: session.user.id,
              email: session.user.email,
              role: 'customer', // Default role
            },
          ])
          .select('*')
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
        }
      }

      const userRole = profile?.role || 'customer';

      // Admin routes
      if (request.nextUrl.pathname.startsWith('/dashboard/admin') && userRole !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      // Sales routes
      if (request.nextUrl.pathname.startsWith('/dashboard/sales') && !['admin', 'sales'].includes(userRole)) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      // Customer routes
      if (request.nextUrl.pathname.startsWith('/dashboard/customer') && !['admin', 'sales', 'customer'].includes(userRole)) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (err) {
      console.error('Middleware error:', err);
    }
  }

  return response;
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
