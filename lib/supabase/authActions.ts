import { cookies } from 'next/headers';
import { createServerClient } from './server';

export async function loginAction(values: { email: string; password: string }) {
  const cookieStore = cookies();
  const supabase = createServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: values.email,
    password: values.password,
  });

  if (error) {
    return { error: error.message };
  }

  // Ensure session cookie is set properly
  if (data.session) {
    const { error: cookieError } = await supabase.auth.setSession(data.session);
    if (cookieError) {
      return { error: cookieError.message };
    }
  }

  const redirectTo = cookieStore.get('redirectUrl')?.value || '/dashboard';
  cookieStore.delete('redirectUrl');

  return { redirectTo };
}
