import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

function setCookie(name: string, value: string, options: { path: string; secure: boolean; sameSite: 'lax' | 'strict' | 'none'; maxAge: number; httpOnly?: boolean }) {
  const cookieStore = cookies();
  (cookieStore as any).set(name, value, options);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';

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
    } satisfies Partial<ResponseCookie>);

    if (authData.session.refresh_token) {
      setCookie('sb-refresh-token', authData.session.refresh_token, {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      } satisfies Partial<ResponseCookie>);
    }

    // Check if user profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.session.user.id)
      .single();

    // Create or update user profile, preserving existing role if present
    const profileData = {
      id: authData.session.user.id,
      email: authData.session.user.email!,
      name: authData.session.user.user_metadata?.full_name || authData.session.user.email?.split('@')[0] || 'User',
      role: existingProfile?.role || 'customer',
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profileData)
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return NextResponse.redirect(new URL('/auth/error', requestUrl));
    }

    return NextResponse.redirect(new URL(next, requestUrl));
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(new URL('/auth/error', requestUrl));
  }
}
