'use server'

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';

export async function getUsers() {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select();

    if (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }

    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error('Failed to fetch users');
  }
}

export async function deleteUser(id: string) {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete user:', error);
      return { success: false, error: 'Failed to delete user' };
    }
    revalidatePath('/dashboard/users');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete user:', error);
    return { success: false, error: 'Failed to delete user' };
  }
}
