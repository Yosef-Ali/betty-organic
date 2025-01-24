import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = ['/dashboard', '/profile', '/settings'];
const authPaths = ['/auth/login', '/auth/signup', '/auth/reset-password'];

export async function middleware(request: NextRequest) {
  try {
    let response = NextResponse.next();

    // Skip middleware for static files
    if (
      request.nextUrl.pathname.includes('.') ||
      request.nextUrl.pathname.startsWith('/_next')
    ) {
      return response;
    }

    // Initialize Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(
            name: string,
            value: string,
            options: {
              path: string;
              sameSite?: 'lax' | 'strict' | 'none';
              domain?: string;
              secure?: boolean;
            },
          ) {
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: { path: string; domain?: string }) {
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      },
    );

    // Get current session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Handle protected routes
    const isProtectedPath = protectedPaths.some(path =>
      request.nextUrl.pathname.startsWith(path),
    );

    if (isProtectedPath && !session) {
      const redirectUrl = new URL('/auth/login', request.url);
      redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Get user profile for role-based access
    if (session?.user.id) {
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

      // Sales route role check
      if (request.nextUrl.pathname.startsWith('/dashboard/sales')) {
        if (!['admin', 'sales'].includes(profile?.role || '')) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }
    }

    // Handle auth routes redirect for authenticated users
    const isAuthPath = authPaths.some(
      path => request.nextUrl.pathname === path,
    );

    if (isAuthPath && session) {
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
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
};
