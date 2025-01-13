import { createAuthClient } from './auth';
import { serialize } from './utils/serialize';

export type Role = 'customer' | 'sales' | 'admin';

interface AllowedRoles {
  dashboard: Role[];
  orders: Role[];
  settings: Role[];
}

export function checkAccess(userRole: Role, page: keyof AllowedRoles): boolean {
  const allowedRoles: AllowedRoles = {
    dashboard: ['admin', 'sales'],
    orders: ['admin', 'sales', 'customer'],
    settings: ['admin']
  };

  return allowedRoles[page].includes(userRole);
}

export { createAuthClient } from './auth/server';

interface SessionData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export async function getSession(): Promise<SessionData | null> {
  try {
    const supabase = await createAuthClient();

    // Configure session persistence
    supabase.auth.onAuthStateChange((_event, session) => {
      if (typeof window !== 'undefined' && session) {
        // Save session to localStorage
        localStorage.setItem('supabase.auth.token', session.access_token);
      }
    });

    const { data, error } = await supabase.auth.getSession();

    if (error || !data?.session) {
      console.error('Session error:', error);
      return null;
    }

    // Create a plain session object and serialize it
    const sessionData: SessionData = {
      access_token: data.session.access_token ?? '',
      refresh_token: data.session.refresh_token ?? '',
      expires_in: data.session.expires_in ?? 3600,
      expires_at: data.session.expires_at ?? Math.floor(Date.now() / 1000) + 3600,
      user: {
        id: data.session.user.id,
        email: data.session.user.email ?? '',
        role: data.session.user.role ?? 'customer'
      }
    };

    return serialize(sessionData);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('Failed to get session: ' + String(errorMessage));
    return null;
  }
}

export interface AuthError {
  message: string;
}

export interface SignUpResponse {
  error: AuthError | null;
}

export async function signUp(email: string, password: string, name: string): Promise<SignUpResponse> {
  const supabase = await createAuthClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name
      }
    }
  });

  return { error: error ? { message: error.message } : null };
}

export async function signIn(provider: 'email' | 'google' | 'magiclink', credentials?: { email: string; password?: string }) {
  const supabase = await createAuthClient();

  if (provider === 'email' && credentials?.password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    });
    return { data, error };
  } else if (provider === 'google') {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback'
      }
    });
    return { data, error };
  } else if (provider === 'magiclink' && credentials?.email) {
    const { data, error } = await supabase.auth.signInWithOtp({
      email: credentials.email,
      options: {
        emailRedirectTo: 'http://localhost:3000/auth/callback'
      }
    });
    return { data, error };
  }

  if (provider === 'magiclink') {
    return {
      data: null,
      error: { message: 'Email is required for magic link authentication' }
    };
  }
  return {
    data: null,
    error: { message: 'Invalid provider or missing credentials' }
  };
}

export async function signOut() {
  const supabase = await createAuthClient();
  const { error } = await supabase.auth.signOut();
  return { error: error ? { message: error.message } : null };
}
