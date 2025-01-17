'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getUsers() {
  const supabase = await createClient()
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
  const supabase = await createClient()
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

export async function updateProfile({ name, email, image }: { name: string, email: string, image: string }) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: name,
        avatar_url: image,
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    // Update user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        full_name: name,
        avatar_url: image
      }
    });

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath('/dashboard/profile');
    return { success: true };
  } catch (error) {
    console.error('Profile update error:', error);
    return { success: false, error: 'An error occurred while updating profile' };
  }
}
