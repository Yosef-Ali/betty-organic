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
  const returnTo = requestUrl.searchParams.get('returnTo');
  const next = returnTo || '/dashboard';

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

    // Create or update user profile
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', authData.session.user.id)
      .single();

    const profileData = {
      id: authData.session.user.id,
      email: authData.session.user.email!,
      name: authData.session.user.user_metadata?.full_name || authData.session.user.email?.split('@')[0] || 'User',
      role: existingProfile?.role || 'customer',
      status: existingProfile?.status || 'active',
      auth_provider: authData.session.user.app_metadata?.provider || 'email',
      updated_at: new Date().toISOString(),
      created_at: existingProfile ? undefined : new Date().toISOString(),
    };

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

    // Create response with redirect
    const response = NextResponse.redirect(new URL(next, requestUrl));

    // Set session cookie
    await supabase.auth.setSession({
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
    });

    // Check for pending order in session storage
    if (next.includes('/marketing')) {
      response.headers.set('X-Check-Pending-Order', 'true');
    }

    return response;
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(
      new URL(`/auth/error?error=${encodeURIComponent('unexpected_error')}`, requestUrl)
    );
  }
}
