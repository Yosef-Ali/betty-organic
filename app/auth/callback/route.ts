import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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
  const next = returnTo || '/dashboard'; // Redirect to dashboard after OAuth

  if (!code) {
    console.error('Missing auth code');
    return NextResponse.redirect(
      new URL('/auth/error?error=invalid_request&message=Missing required authentication parameters', requestUrl)
    );
  }

  try {
    const cookieStore = await cookies();
    
    // Create response first to modify cookies
    const response = NextResponse.redirect(new URL(next, requestUrl));
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
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
              maxAge: 0,
            });
          },
        },
      }
    );

    // Exchange the code for a session
    const { data: authData, error: authError } = await supabase.auth.exchangeCodeForSession(code);

    if (authError || !authData.session) {
      console.error('Auth error:', authError);
      return NextResponse.redirect(
        new URL(`/auth/error?error=${encodeURIComponent(authError?.message || 'session_error')}`, requestUrl)
      );
    }

    // Get the auth provider from session
    const authProvider = authData.session.user.app_metadata?.provider || 'email';

    // Check for existing profile
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('role, status, created_at')
      .eq('id', authData.session.user.id)
      .single();

    const profileData = {
      id: authData.session.user.id,
      email: authData.session.user.email!,
      name: authData.session.user.user_metadata?.full_name || authData.session.user.email?.split('@')[0] || 'User',
      role: existingProfile?.role || 'customer', // Preserve existing role
      status: existingProfile?.status || 'active',
      auth_provider: authProvider,
      updated_at: new Date().toISOString(),
      created_at: existingProfile?.created_at || new Date().toISOString(),
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profileData, {
        onConflict: 'id',
        ignoreDuplicates: false, // Ensure update happens
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return NextResponse.redirect(
        new URL(`/auth/error?error=${encodeURIComponent('profile_error')}`, requestUrl)
      );
    }

    // Response was already created above with proper cookie handling
    // The session should be automatically set by exchangeCodeForSession with SSR client

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
