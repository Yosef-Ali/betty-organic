'use server'

import { createClient } from 'lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getUsers() {
  try {
    const supabase = await createClient();
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
    const supabase = await createClient();
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

export async function getUserById(id: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching user by ID:', error);
      throw new Error('Failed to fetch user');
    }

    return data;
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return null;
  }
}
