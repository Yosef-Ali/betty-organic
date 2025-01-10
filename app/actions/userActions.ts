'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getUsers() {
  const supabase = await createServerSupabaseClient()
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true })
    if (error) {
      console.error('Supabase error:', error)
      throw new Error(error.message)
    }
    return data
  } catch (error: any) {
    console.error('Unexpected error:', error)
    throw new Error(error.message)
  }
}

export async function updateUserRole(id: string, role: 'customer' | 'admin' | 'sales') {
  const supabase = await createServerSupabaseClient()
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', id)
    if (error) throw error
    revalidatePath('/dashboard/users')
  } catch (error) {
    console.error('Error updating user role:', error)
    throw new Error('Failed to update user role')
  }
}
