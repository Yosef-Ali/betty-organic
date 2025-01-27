import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Define valid role types
type Role = 'admin' | 'sales' | 'owner' | 'customer' | '';

// Define protected routes and their allowed roles
const PROTECTED_ROUTES: Record<string, Role[]> = {
  '/dashboard/settings': ['admin', 'owner'],
  '/dashboard/users': ['admin', 'owner'],
  '/dashboard/sales': ['admin', 'sales', 'owner'],
  '/dashboard/orders': ['admin', 'sales', 'owner'],
  '/dashboard/products': ['admin', 'sales', 'owner'],
};

// Routes that customers can access
const CUSTOMER_ROUTES = ['/dashboard/profile'];

// All dashboard paths that require authentication
const DASHBOARD_PATHS = [
  '/dashboard',
  ...Object.keys(PROTECTED_ROUTES),
  ...CUSTOMER_ROUTES,
];

/**
 * Check if a user has access to a specific path based on their role
 */
const hasPathAccess = (path: string, userRole: Role): boolean => {
  // Allow customers to access only their profile route
  if (userRole === 'customer') {
    return CUSTOMER_ROUTES.some(route => path.startsWith(route));
  }

  // For other roles, check against protected routes
  const requiredRoles = PROTECTED_ROUTES[path];
  return !requiredRoles || requiredRoles.includes(userRole);
};

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
    }
  );

  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  
  // Only check authentication for dashboard paths
  if (DASHBOARD_PATHS.some(p => path.startsWith(p))) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }

    // Get user profile with role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = (profile?.role || '') as Role;

    // Redirect customers to home page if trying to access main dashboard
    if (userRole === 'customer' && path === '/dashboard') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Check role-based access for protected routes
    const protectedPath = Object.keys(PROTECTED_ROUTES).find(p => path.startsWith(p));
    if (protectedPath && !hasPathAccess(protectedPath, userRole)) {
      console.log(`Access denied to ${path} for role ${userRole}`);
      // Redirect customers to home page, others to dashboard
      const redirectUrl = userRole === 'customer' ? '/' : '/dashboard';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    // Special handling for customer profile access
    if (CUSTOMER_ROUTES.some(route => path.startsWith(route))) {
      if (!hasPathAccess(path, userRole)) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
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
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
