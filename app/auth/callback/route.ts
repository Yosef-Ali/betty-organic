import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');

  const supabase = createRouteHandlerClient({ cookies });

  try {
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
    } else if (tokenHash && type === 'signup') {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'signup',
      });
      if (error) throw error;
    }

    // Get the user after verification
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Get the session to determine auth provider
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const authProvider = session?.provider || 'email';

      // Check for existing profile to preserve role
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // Create/update profile after successful verification
      const { error: profileError } = await supabase.from('profiles').upsert(
        {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email?.split('@')[0],
          role: existingProfile?.role || 'customer', // Preserve existing role or set default
          status: 'active',
          auth_provider: authProvider, // Use correct provider
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'id',
        },
      );

      if (profileError) {
        console.error('Profile creation error:', profileError);
        return NextResponse.redirect(
          new URL(
            '/auth/error?message=profile_creation_failed',
            requestUrl.origin,
          ),
        );
      }
    }

    return NextResponse.redirect(
      new URL('/auth/success?message=email_verified', requestUrl.origin),
    );
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(
      new URL('/auth/error?message=verification_failed', requestUrl.origin),
    );
  }
}
