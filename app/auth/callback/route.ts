import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

function setCookie(name: string, value: string, options: Partial<ResponseCookie>) {
  const cookieStore = cookies();
  (cookieStore as any).set(name, value, options);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (!code) {
    console.error('No code provided in callback');
    return NextResponse.redirect(new URL('/auth/error?error=no_code', requestUrl));
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

    // Set session cookies
    const response = NextResponse.redirect(new URL(next, requestUrl));

    // Set auth cookies with proper configuration
    response.cookies.set('sb-access-token', authData.session.access_token, {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      httpOnly: true,
    });

    if (authData.session.refresh_token) {
      response.cookies.set('sb-refresh-token', authData.session.refresh_token, {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
      });
    }

    // Check if user profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', authData.session.user.id)
      .single();

    // Create or update user profile, preserving existing role if present
    const profileData = {
      id: authData.session.user.id,
      email: authData.session.user.email!,
      name: authData.session.user.user_metadata?.full_name || authData.session.user.email?.split('@')[0] || 'User',
      role: existingProfile?.role || 'customer',
      status: existingProfile?.status || 'active',
      auth_provider: authData.session.user.app_metadata?.provider || 'email',
      updated_at: new Date().toISOString(),
    };

    if (!existingProfile) {
      profileData['created_at'] = new Date().toISOString();
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' })
      .select()
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return NextResponse.redirect(
        new URL(`/auth/error?error=${encodeURIComponent('profile_error')}`, requestUrl)
      );
    }

    // Set role in cookie
    response.cookies.set('userRole', profileData.role, {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
    });

    return response;
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(
      new URL(`/auth/error?error=${encodeURIComponent('unexpected_error')}`, requestUrl)
    );
  }
}
