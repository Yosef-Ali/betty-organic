import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { AuthError, type Profile } from '../types/supabase';

export async function createMiddlewareClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookie = await cookieStore.get(name);
          return cookie?.value;
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            await cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle in middleware
          }
        },
        async remove(name: string, options: CookieOptions) {
          try {
            await cookieStore.delete(name);
          } catch (error) {
            // Handle in middleware
          }
        },
      },
    },
  );
}

interface RouteAccess {
  isProtected: boolean;
  allowedRoles?: string[];
}

export function getRouteAccess(pathname: string): RouteAccess {
  // Public routes that don't require authentication
  if (
    pathname.startsWith('/auth') ||
    pathname.startsWith('/verify') ||
    pathname.startsWith('/api/public') ||
    pathname.includes('.') ||
    pathname.startsWith('/_next')
  ) {
    return { isProtected: false };
  }

  // Role-specific routes
  const roleRoutes: Record<string, string[]> = {
    '/dashboard/settings/testimonials': ['admin'],
    '/dashboard/settings': ['admin'], // Settings should be admin-only
    '/dashboard/sales': ['admin', 'sales'],
    '/dashboard/products/new': ['admin', 'sales'],
    '/dashboard/products/edit': ['admin', 'sales'],
    '/dashboard/customers': ['admin', 'sales'],
    '/dashboard/orders': ['admin', 'sales'],
    '/dashboard/profile': ['admin', 'sales', 'customer'],
  };

  // Check if the pathname matches any role-specific routes
  for (const [route, roles] of Object.entries(roleRoutes)) {
    if (pathname.startsWith(route)) {
      return { isProtected: true, allowedRoles: roles };
    }
  }

  // General protected routes accessible to all authenticated users
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/profile')) {
    return { isProtected: true, allowedRoles: ['admin', 'sales'] };
  }

  // Default to public access
  return { isProtected: false };
}

export async function validateAccess(
  pathname: string,
  supabase: Awaited<ReturnType<typeof createMiddlewareClient>>,
) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw {
      message: sessionError.message,
      status: 401,
    } as AuthError;
  }

  const access = getRouteAccess(pathname);

  // Not a protected route, allow access
  if (!access.isProtected) {
    return { session, profile: null };
  }

  // Protected route but no session
  if (!session) {
    throw {
      message: 'Authentication required',
      status: 401,
    } as AuthError;
  }

  // Get user profile for role check
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*, is_admin')
    .eq('id', session.user.id)
    .single();

  if (profileError || !profile) {
    throw {
      message: 'Profile not found',
      status: 404,
    } as AuthError;
  }

  // Check if user is inactive
  if (profile.status === 'inactive') {
    throw {
      message: 'Account is inactive',
      status: 403,
    } as AuthError;
  }

  // Check role-based access
  if (access.allowedRoles && !access.allowedRoles.includes(profile.role)) {
    throw {
      message: 'Access denied',
      status: 403,
    } as AuthError;
  }

  return { session, profile };
}

export async function getRedirectUrl(
  profile: Profile | null,
  error?: AuthError,
): Promise<string> {
  if (error) {
    const url = new URL('/auth/auth-error', process.env.NEXT_PUBLIC_SITE_URL);
    url.searchParams.set('code', error.status?.toString() || '500');
    url.searchParams.set('message', encodeURIComponent(error.message));
    return url.toString();
  }

  if (!profile) {
    return '/auth/login';
  }

  // Default dashboard for all roles (access controlled by middleware)
  return '/dashboard';
}
