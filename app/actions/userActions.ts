'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { User } from '@supabase/supabase-js';

const getSupabaseClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
};

export async function getUsers() {
  const supabase = await getSupabaseClient();

  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, name, email, role, status, avatar_url')
      .eq('role', 'admin');

    if (error) {
      console.error('Error fetching user list:', error);
      return [];
    }

    return users || [];
  } catch (error) {
    console.error('Unexpected error fetching users:', error);
    return [];
  }
}

export async function getUserById(id: string) {
  const supabase = await getSupabaseClient();

  try {
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    return user;
  } catch (error) {
    console.error('Unexpected error fetching user:', error);
    return null;
  }
}

export async function updateUser(id: string, data: Partial<User>) {
  const supabase = await getSupabaseClient();

  try {
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', id);

    if (error) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error updating user:', error);
    return { success: false, error: 'Unexpected error' };
  }
}

export async function updateUserRole(id: string, role: string) {
  const supabase = await getSupabaseClient();

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', id);

    if (error) {
      console.error('Error updating user role:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error updating user role:', error);
    return { success: false, error: 'Unexpected error updating role' };
  }
}

export async function updateProfile(userId: string, data: {
  name?: string;
  email?: string;
  avatar_url?: string;
}) {
  const supabase = await getSupabaseClient();

  try {
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', userId);

    if (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error updating profile:', error);
    return { success: false, error: 'Unexpected error updating profile' };
  }
}

export async function deleteUser(id: string) {
  const supabase = await getSupabaseClient();

  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting user:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error deleting user:', error);
    return { success: false, error: 'Unexpected error' };
  }
}
