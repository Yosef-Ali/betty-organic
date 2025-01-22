import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(
            name: string,
            value: string,
            options: {
              path: string;
              domain?: string;
              maxAge?: number;
              httpOnly?: boolean;
              sameSite?: 'lax' | 'strict' | 'none';
              secure?: boolean;
            },
          ) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: { path: string; domain?: string }) {
            cookieStore.delete(name, options);
          },
        },
      },
    );

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('Auth callback error:', error);
        return NextResponse.redirect(
          new URL(
            '/auth/auth-error?message=Authentication failed',
            request.url,
          ),
        );
      }

      // Get the user's session to determine redirect
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        // Determine redirect based on role
        const redirectTo =
          profile?.role === 'admin'
            ? '/dashboard/admin'
            : profile?.role === 'sales'
            ? '/dashboard/sales'
            : '/dashboard';

        return NextResponse.redirect(new URL(redirectTo, request.url));
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(
        new URL('/auth/auth-error?message=Something went wrong', request.url),
      );
    }
  }

  // Fallback redirect
  return NextResponse.redirect(new URL(next, request.url));
}
