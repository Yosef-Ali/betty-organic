import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  try {
    let response = NextResponse.next();

    // Skip middleware for static files and API routes
    if (
      request.nextUrl.pathname.includes('.') ||
      request.nextUrl.pathname.startsWith('/_next') ||
      request.nextUrl.pathname.startsWith('/api/')
    ) {
      return response;
    }

    // Create Supabase client
    const supabase = createMiddlewareClient({
      req: request,
      res: response,
    });

    // Get session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Check if accessing protected routes
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard');
    const isAuthRoute = request.nextUrl.pathname.startsWith('/auth');

    if (isProtectedRoute) {
      if (!session) {
        // Redirect to login if not authenticated
        const redirectUrl = new URL('/auth/login', request.url);
        redirectUrl.searchParams.set(
          'redirectedFrom',
          request.nextUrl.pathname,
        );
        return NextResponse.redirect(redirectUrl);
      }

      // Get user profile for role check
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', session.user.id)
        .single();

      // Handle inactive accounts
      if (profile?.status === 'inactive') {
        const errorUrl = new URL('/auth/auth-error', request.url);
        errorUrl.searchParams.set('code', '403');
        errorUrl.searchParams.set('message', 'Account is inactive');
        return NextResponse.redirect(errorUrl);
      }

      // Add user context to headers
      response.headers.set('x-user-id', session.user.id);
      response.headers.set('x-user-role', profile?.role || '');
    }

    // Redirect authenticated users away from auth routes
    if (isAuthRoute && session) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return response;
  } catch (error) {
    console.error('Middleware error:', error);

    // Handle errors gracefully
    const errorUrl = new URL('/auth/auth-error', request.url);
    errorUrl.searchParams.set('code', '500');
    errorUrl.searchParams.set('message', 'An unexpected error occurred');
    return NextResponse.redirect(errorUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*$|api/).*)',
  ],
};
