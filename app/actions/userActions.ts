'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type User = {
  id: string
  name?: string
  full_name?: string
  email: string
  role?: string
  imageUrl?: string
  status: string
  lastActive?: string
  createdAt: Date
  updatedAt: Date
}

export async function getUsers(): Promise<User[]> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    if (!data) {
      return []
    }

    // Transform the data to match the User type
    return data.map(user => ({
      id: user.id,
      name: user.name,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      imageUrl: user.image_url,
      status: user.status || 'active',
      lastActive: user.last_active,
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at)
    }))
  } catch (error) {
    console.error('Error in getUsers:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch users')
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
      console.error('Delete error:', error)
      throw new Error(`Failed to delete user: ${error.message}`)
    }

    revalidatePath('/dashboard/users')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteUser:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to delete user')
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
