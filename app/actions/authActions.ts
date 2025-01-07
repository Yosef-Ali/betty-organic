'use server'

import { createClient } from "@/lib/supabase/server"
import { SignUpFormType, LoginFormType, ResetFormType } from "@/lib/definitions"
import { redirect } from "next/navigation"

export async function signup(formData: SignUpFormType) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        name: formData.name,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  // Check if email verification is required
  if (data?.user?.identities?.length === 0) {
    return { success: true, message: 'Please check your email to verify your account.' }
  }

  // If no verification required, redirect to home
  redirect('/')
}

export async function login(formData: LoginFormType) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/')
}

export async function resetPassword(formData: ResetFormType) {
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}
