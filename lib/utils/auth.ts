import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export async function getSession() {
  const supabase = createServerComponentClient({ cookies });
  try {
    // Use getUser instead of getSession for better security
    // getUser verifies with the Supabase Auth server
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    // If we need the session as well, we can still get it
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

export async function getUser() {
  const supabase = createServerComponentClient({ cookies });
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}
