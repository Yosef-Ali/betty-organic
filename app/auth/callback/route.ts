import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import { createGoogleUserProfile } from '@/app/auth/actions/authActions';

function setCookie(name: string, value: string, options: { path: string; secure: boolean; sameSite: 'lax' | 'strict' | 'none'; maxAge: number; httpOnly?: boolean }) {
  const cookieStore = cookies();
  (cookieStore as any).set(name, value, options);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (!code) {
    return NextResponse.redirect(new URL('/auth/error', requestUrl));
  }

  try {
    const supabase = await createClient();

    if (!supabase.auth) {
      console.error('Supabase client auth is undefined');
      return NextResponse.redirect(new URL('/auth/error', requestUrl));
    }

    const { data: authData, error: authError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (authError || !authData.session) {
      console.error('Auth error:', authError);
      return NextResponse.redirect(new URL('/auth/error', requestUrl));
    }

    // Set auth cookies
    setCookie('sb-access-token', authData.session.access_token, {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      httpOnly: true,
    } satisfies Partial<ResponseCookie>);

    if (authData.session.refresh_token) {
      setCookie('sb-refresh-token', authData.session.refresh_token, {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
      } satisfies Partial<ResponseCookie>);
    }

    // Set provider in cookie
    setCookie('authProvider', authData.session.user.app_metadata.provider || 'email', {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      httpOnly: true,
    });

    // Create or update user profile
    const { error: profileError } = await createGoogleUserProfile(authData.session.user);

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return NextResponse.redirect(new URL('/auth/error', requestUrl));
    }

    // Set session cookie
    setCookie('session', 'active', {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      httpOnly: true,
    });

    return NextResponse.redirect(new URL(next, requestUrl));
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(new URL('/auth/error', requestUrl));
  }
}
