import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';

  if (!code) {
    return NextResponse.redirect(new URL('/auth/error', requestUrl));
  }

  try {
    const cookieStore = await cookies();
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
    await cookieStore.set('sb-access-token', authData.session.access_token, {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    if (authData.session.refresh_token) {
      await cookieStore.set(
        'sb-refresh-token',
        authData.session.refresh_token,
        {
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30, // 30 days
        },
      );
    }

    // Create or update user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: authData.session.user.id,
          email: authData.session.user.email,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )
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
