import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createGoogleUserProfile } from '../actions/authActions';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  // Log the incoming request details
  console.log('Auth callback received:', {
    url: request.url,
    code: code ? 'present' : 'missing',
    error,
    error_description,
  });

  if (error || error_description) {
    console.error('OAuth error:', { error, error_description });
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/login?error=${
        error || 'unknown'
      }&error_description=${error_description || 'Authentication failed'}`,
    );
  }

  if (!code) {
    console.error('No code received in callback');
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/login?error=no_code`,
    );
  }

  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set(name, value, options);
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set(name, '', { ...options, maxAge: 0 });
        },
      },
    },
  );

  try {
    const { data, error: sessionError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (sessionError) {
      console.error('Session exchange error:', sessionError);
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/login?error=session_exchange&error_description=${sessionError.message}`,
      );
    }

    if (!data.session) {
      console.error('No session data received');
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/login?error=no_session`,
      );
    }

    // Handle Google login profile creation
    if (data.session.user.app_metadata.provider === 'google') {
      const { error: profileError } = await createGoogleUserProfile(
        data.session.user,
      );
      if (profileError) {
        console.error('Profile creation failed:', profileError);
        // Continue anyway since auth was successful
      }
    }

    // Redirect to dashboard after successful authentication
    const response = NextResponse.redirect(`${requestUrl.origin}/dashboard`);

    // Set secure cookies for session
    response.cookies.set({
      name: 'sb-access-token',
      value: data.session.access_token,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: data.session.expires_in,
    });

    response.cookies.set({
      name: 'sb-refresh-token',
      value: data.session.refresh_token,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: data.session.expires_in,
    });

    console.log('Authentication successful:', {
      userId: data.session.user.id,
      provider: data.session.user.app_metadata.provider,
    });

    return response;
  } catch (error) {
    console.error('Unexpected error in callback:', error);
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/login?error=unexpected&error_description=An unexpected error occurred`,
    );
  }
}
