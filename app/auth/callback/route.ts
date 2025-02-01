import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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

  const supabase = createRouteHandlerClient({ cookies });
  try {
    const { data, error: sessionError } =
      await supabase.auth.exchangeCodeForSession(code);
    if (sessionError) {
      console.error('Session exchange error:', sessionError);
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/login?error=session_exchange&error_description=${sessionError.message}`,
      );
    }

    // Log successful authentication
    console.log('Authentication successful:', {
      userId: data.session?.user.id,
      provider: data.session?.user.app_metadata.provider,
    });

    // On successful authentication, redirect to dashboard or homepage
    return NextResponse.redirect(`${requestUrl.origin}/`);
  } catch (error) {
    console.error('Unexpected error in callback:', error);
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/login?error=unexpected&error_description=An unexpected error occurred`,
    );
  }
}
