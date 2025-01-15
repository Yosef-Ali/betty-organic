'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth';

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
  const supabase = await createClient();
  const session = await getServerSession();
  const userId = session?.user?.id;

  if (!userId) {
    return { error: 'Unauthorized' };
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: name,
        email: email,
        avatar_url: image,
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating profile:', error);
      return { error: error.message };
    }

    revalidatePath('/dashboard/profile');
    return { success: true };
  } catch (error) {
    console.error('Unexpected error updating profile:', error);
    return { error: 'Failed to update profile' };
  }
}
