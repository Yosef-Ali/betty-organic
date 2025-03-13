import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

type Role = 'admin' | 'sales' | 'customer' | '';

// Simple route protection
const PROTECTED_ROUTES = ['/dashboard'];

export async function middleware(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data: { session } } = await supabase.auth.getSession();

  // If there's no session and the user is trying to access a protected route
  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

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
      return NextResponse.next();
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
      NextResponse.cookies.set({
        name: 'sb-access-token',
        value: access_token,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: expires_in,
      });

      NextResponse.cookies.set({
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
  matcher: ['/dashboard/:path*'],
};
