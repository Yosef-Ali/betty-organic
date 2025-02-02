'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Helper function to create Supabase client
function createClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookies().set(name, value, options);
        },
        remove(name: string, options: CookieOptions) {
          cookies().set(name, '', { ...options, maxAge: 0 });
        },
      },
    },
  );
}

export async function signIn(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signUp(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
}

export async function signInWithGoogle() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });
  return { data, error };
}

export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function resetPassword(email: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`,
  });
  return { data, error };
}

export async function createGoogleUserProfile(user: any) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookies().set(name, value, options);
        },
        remove(name: string, options: any) {
          cookies().set(name, '', { ...options, maxAge: 0 });
        },
      },
    },
  );

  // Check for existing profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    // 'PGRST116' = no rows found
    console.error('Profile lookup error:', error);
    return { error };
  }

  // Create profile if missing or update if role is missing
  if (!profile || !profile.role) {
    const { error: upsertError } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        email: user.email,
        role: 'customer',
      },
      {
        onConflict: 'id',
      },
    );

    if (upsertError) {
      console.error('Profile upsert error:', upsertError);
      return { error: upsertError };
    }
  }

  return { error: null };
}
