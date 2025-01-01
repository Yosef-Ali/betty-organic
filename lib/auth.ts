import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function signIn(provider: 'email' | 'google', credentials?: { email: string; password: string }) {
  if (provider === 'email' && credentials) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    })
    return { data, error }
  } else if (provider === 'google') {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    return { data, error }
  }
  return { data: null, error: new Error('Invalid provider') }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}
