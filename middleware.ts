import { createMiddlewareClient } from '@/lib/supabase/middleware';
import { NextResponse, type NextRequest } from 'next/server';

const DASHBOARD_PATHS = [
  '/dashboard',
  '/dashboard/orders',
  '/dashboard/sales',
  '/dashboard/users',
  '/dashboard/products',
  '/dashboard/settings',
];

export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users from dashboard
  if (DASHBOARD_PATHS.some(path => request.nextUrl.pathname.startsWith(path))) {
    if (!user) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Role-based access control
    const path = request.nextUrl.pathname;

    // Path-based role checks
    const pathRoles = {
      '/dashboard/settings': ['admin'],
      '/dashboard/users': ['admin'],
      '/dashboard/sales': ['admin', 'sales'],
      '/dashboard/orders': ['admin', 'sales'],
      '/dashboard/products': ['admin', 'sales'],
    };

    // Check if the current path requires specific roles
    for (const [protectedPath, allowedRoles] of Object.entries(pathRoles)) {
      if (
        path.startsWith(protectedPath) &&
        !allowedRoles.includes(profile?.role || '')
      ) {
        console.log(`Access denied to ${path} for role ${profile?.role}`);
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
