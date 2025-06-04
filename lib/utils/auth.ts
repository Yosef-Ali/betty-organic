import { createClient } from '@/lib/supabase/server';

// DEPRECATED: Use getUser() directly from @/app/actions/auth instead
export async function getSession() {
  console.warn('⚠️  SECURITY WARNING: This getSession() function is deprecated. Use getUser() from @/app/actions/auth instead.');
  const supabase = await createClient();
  try {
    // Use getUser instead of getSession for better security
    // getUser verifies with the Supabase Auth server
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    // Only get session if user is verified
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
  const supabase = await createClient();
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
