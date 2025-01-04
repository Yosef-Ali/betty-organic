import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function signIn(provider: 'email' | 'google' | 'magiclink', credentials?: { email: string; password?: string }) {
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
  const { error } = await supabase.auth.signOut()
  return { error }
}
