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

      try {
        if (session?.provider === 'google') {
          // For Google auth, ensure we have a valid session first
          if (!session.access_token || !session.refresh_token) {
            console.error('Missing session tokens for Google auth');
            throw new Error('Invalid session state');
          }

          // Import using correct relative path from callback directory
          let createGoogleUserProfile;
          try {
            const authActions = await import('../actions/authActions');
            createGoogleUserProfile = authActions.createGoogleUserProfile;
          } catch (importError) {
            console.error('Failed to import auth actions:', importError);
            throw new Error('Authentication configuration error');
          }

          // Add user metadata from Google
          const userWithMetadata = {
            ...user,
            user_metadata: {
              ...user.user_metadata,
              full_name:
                user.user_metadata?.full_name || user.email?.split('@')[0],
              avatar_url: user.user_metadata?.avatar_url,
            },
          };

          const result = await createGoogleUserProfile(userWithMetadata);

          if (result.error) {
            console.error('Google profile creation failed:', result.error);
            throw new Error(result.error);
          }

          // Ensure session is properly set after profile creation
          const { data: sessionData, error: sessionError } =
            await supabase.auth.getSession();
          if (sessionError || !sessionData.session) {
            console.error('Session validation failed:', sessionError);
            throw new Error('Session validation failed');
          }
        } else {
          // For email auth, handle profile creation directly
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          const { error: profileError } = await supabase
            .from('profiles')
            .upsert(
              {
                id: user.id,
                email: user.email,
                name:
                  user.user_metadata?.full_name || user.email?.split('@')[0],
                role: existingProfile?.role || 'customer',
                status: 'active',
                auth_provider: 'email',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                onConflict: 'id',
              },
            );

          if (profileError) throw profileError;
        }

        return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
      } catch (error) {
        console.error('Profile creation error:', error);
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
