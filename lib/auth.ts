import { createAuthClient } from './auth';

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

export { createAuthClient } from './auth/server'

export async function getSession() {
  const supabase = await createAuthClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function signIn(provider: 'email' | 'google' | 'magiclink', credentials?: { email: string; password?: string }) {
  const supabase = await createAuthClient()

  if (provider === 'email' && credentials?.password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    })
    return { data, error }
  } else if (provider === 'google') {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback'
      }
    })
    return { data, error }
  } else if (provider === 'magiclink' && credentials?.email) {
    const { data, error } = await supabase.auth.signInWithOtp({
      email: credentials.email,
      options: {
        emailRedirectTo: 'http://localhost:3000/auth/callback'
      }
    })
    return { data, error }
  }

  if (provider === 'magiclink') {
    return { data: null, error: new Error('Email is required for magic link authentication') }
  }
  return { data: null, error: new Error('Invalid provider or missing credentials') }
}

export async function signOut() {
  const supabase = await createAuthClient()
  const { error } = await supabase.auth.signOut()
  return { error }
}
