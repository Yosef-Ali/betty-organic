'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteUser(id: string) {
  const supabase = await createClient()
  try {
    const { error } = await supabase.from('profiles').delete().eq('id', id)
    if (error) throw error
    revalidatePath('/dashboard/users')
  } catch (error) {
    console.error('Error deleting user:', error)
    throw new Error('Failed to delete user')
  }
}
