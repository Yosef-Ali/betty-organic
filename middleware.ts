import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type Role = 'admin' | 'sales' | 'customer' | '';

// Simple route protection
const PROTECTED_ROUTES = ['/dashboard'];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    },
  );

  // Refresh session if expired
  await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Only check authentication for dashboard paths
  if (path.startsWith('/dashboard')) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Get user profile with role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = (profile?.role || '') as Role;

    // Allow all authenticated users to access their profile
    if (path === '/dashboard/profile') {
      return response;
    }

    // Only allow admin and sales to access other dashboard routes
    if (
      path.startsWith('/dashboard') &&
      !['admin', 'sales'].includes(userRole)
    ) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // For /auth/callback, get the session here since we need to
  // handle Google OAuth callback specifically
  if (request.nextUrl.pathname === '/auth/callback') {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.provider === 'google') {
      const { access_token, refresh_token, expires_in } = session;

      // Set tokens as cookies
      response.cookies.set({
        name: 'sb-access-token',
        value: access_token,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: expires_in,
      });

      response.cookies.set({
        name: 'sb-refresh-token',
        value: refresh_token,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: expires_in,
      });
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api/auth/callback|_next/static|_next/image|favicon.ico|auth/login).*)',
    '/auth/callback',
  ],
};
