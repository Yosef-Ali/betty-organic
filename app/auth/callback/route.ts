import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface ProfileData {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'sales' | 'admin';
  status: string;
  auth_provider: string;
  updated_at: string;
  created_at?: string;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';
  const provider = requestUrl.searchParams.get('provider');

  if (!code) {
    console.error('Missing auth code');
    return NextResponse.redirect(
      new URL('/auth/error?error=invalid_request&message=Missing required authentication parameters', requestUrl)
    );
  }

  try {
    const supabase = await createClient();

    // Exchange the code for a session
    const { data: authData, error: authError } = await supabase.auth.exchangeCodeForSession(code);

    if (authError || !authData.session) {
      console.error('Auth error:', authError);
      return NextResponse.redirect(
        new URL(`/auth/error?error=${encodeURIComponent(authError?.message || 'session_error')}`, requestUrl)
      );
    }

    const user = authData.session.user;
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, role, status')
      .eq('id', user.id)
      .single();

    // Handle profile creation/update
    const profileData: ProfileData = {
      id: user.id,
      email: user.email!,
      name: provider === 'google'
        ? user.user_metadata?.full_name
        : (user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'),
      role: existingProfile?.role || 'customer',
      status: existingProfile?.status || 'active',
      auth_provider: user.app_metadata?.provider || 'email',
      updated_at: new Date().toISOString(),
    };

    if (!existingProfile) {
      profileData.created_at = new Date().toISOString();
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profileData)
      .select()
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return NextResponse.redirect(
        new URL(`/auth/error?error=${encodeURIComponent('profile_error')}`, requestUrl)
      );
    }

    // Ensure session is persisted and cookies are set
    if (provider === 'google') {
      const response = NextResponse.redirect(new URL(next, requestUrl));
      const { access_token, refresh_token } = authData.session;

      // Set auth cookies with appropriate security settings
      response.cookies.set('sb-access-token', access_token, {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        httpOnly: true
      });

      if (refresh_token) {
        response.cookies.set('sb-refresh-token', refresh_token, {
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 1 week
          httpOnly: true
        });
      }

      return response;
    }

    return NextResponse.redirect(new URL(next, requestUrl));
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(
      new URL(`/auth/error?error=${encodeURIComponent('unexpected_error')}`, requestUrl)
    );
  }
}
