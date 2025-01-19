'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth';
import { Session } from 'next-auth';

export async function getUsers() {
  const supabase = await createClient()
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('name', { ascending: true })
    if (error) {
      console.error('Supabase error:', JSON.stringify(error, null, 2))
      throw new Error(error.message || 'An error occurred while fetching users')
    }
    return data
  } catch (error: any) {
    console.error('Unexpected error:', JSON.stringify(error, null, 2))
    throw new Error(error.message || 'An unexpected error occurred')
  }
}

export async function updateUserRole(id: string, role: 'customer' | 'admin' | 'sales') {
  const supabase = await createClient()
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', id)
    revalidatePath('/dashboard/users')
    return { error }
  } catch (error) {
    console.error('Error updating user role:', error)
    return { error: error as Error }
  }
}

export async function updateProfile({ name, email, image }: { name: string, email: string, image: string }) {
  const supabase = await createClient();
  const session = await getServerSession() as Session;
  const userId = session?.user?.email;

  if (!userId) {
    return { error: 'Unauthorized' };
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        name: name,
        email: email,
        avatar_url: image,
      })
      .eq('email', userId);

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

export async function deleteUser(id: string) {
  const supabase = await createClient();
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);
    if (error) throw error;
    revalidatePath('/dashboard/users');
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error('Failed to delete user');
  }
}

export async function getUserById(id: string) {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase error:', JSON.stringify(error, null, 2));
      throw new Error(error.message || 'An error occurred while fetching user');
    }

    return data;
  } catch (error: any) {
    console.error('Unexpected error:', JSON.stringify(error, null, 2));
    throw new Error(error.message || 'An unexpected error occurred');
  }
}
