'use server'

import { createClient } from 'lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getUsers() {
  const supabase = await createClient()
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('RLS Policy Error:', {
        message: error.message,
        code: error.code,
        details: 'Check RLS policies in Supabase dashboard'
      })

      if (error.code === '42P17') {
        throw new Error('RLS Policy Error: Infinite recursion detected. Please check your RLS policies in Supabase dashboard')
      }

      throw new Error(`Failed to fetch users: ${error.message}`)
    }

    return users || []
  } catch (error) {
    console.error('Error fetching users:', error)
    throw new Error('Failed to fetch users')
  }
}

export async function deleteUser(id: string) {
  const supabase = await createClient()
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Failed to delete user:', error)
      return { success: false, error: 'Failed to delete user' }
    }

    revalidatePath('/dashboard/users')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete user:', error)
    return { success: false, error: 'Failed to delete user' }
  }
}
