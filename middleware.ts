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

  return response;
}

export const config = {
  matcher: [
    '/((?!api/auth/callback|_next/static|_next/image|favicon.ico|auth/login).*)',
  ],
};

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });

  // Refresh session if expired
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Handle Google OAuth session
  if (session?.provider === 'google') {
    response.cookies.set({
      name: 'sb-access-token',
      value: session.access_token,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: session.expires_in,
    });

    response.cookies.set({
      name: 'sb-refresh-token',
      value: session.refresh_token,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: session.expires_in,
    });
  }

  return response;
}
