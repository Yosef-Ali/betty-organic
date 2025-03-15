import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

type Role = 'admin' | 'sales' | 'customer' | '';

export async function middleware(request: NextRequest) {
  // Handle session update first
  const response = await updateSession(request);
  const path = request.nextUrl.pathname;

  // Create Supabase client
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
    }
  );

  // Allow public routes and static assets
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api/auth') ||
    path.startsWith('/auth/login') ||
    path === '/auth/callback' ||
    path.includes('favicon.ico')
  ) {
    return response;
  }

  // Check auth for dashboard paths
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

    // Redirect non-admin/sales users from protected dashboard routes
    if (!['admin', 'sales'].includes(userRole)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
