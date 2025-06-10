'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { User } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';

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
    },
  );
};

export async function getUsers() {
  const supabase = await getSupabaseClient();

  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, name, email, role, status, avatar_url');

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
    // Verify current user has admin permissions
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' };
    }

    const { error } = await supabase.from('profiles').update(data).eq('id', id);

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

export async function updateProfile(
  userId: string,
  data: {
    name?: string;
    email?: string;
    avatar_url?: string;
  },
) {
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

export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  role?: 'admin' | 'sales' | 'customer'; // Make role optional with default
  status?: 'active' | 'inactive';
}) {
  try {
    // Verify current user has admin permissions
    const supabase = await getSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' };
    }

    // Use admin client for creating users
    const supabaseAdmin = createAdminClient();

    // Create the user account
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      return { success: false, error: 'Failed to create user account' };
    }

    // Create the profile using admin client to bypass RLS
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: authData.user.id,
      email: data.email,
      name: data.name,
      role: data.role || 'customer', // Default to customer if no role specified
      status: data.status || 'active',
    });

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      // Try to clean up the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return { success: false, error: profileError.message };
    }

    return { success: true, data: authData.user };
  } catch (error) {
    console.error('Unexpected error creating user:', error);
    return { success: false, error: 'Unexpected error creating user' };
  }
}

export async function deleteUser(id: string) {
  const supabase = await getSupabaseClient();

  try {
    // Verify current user has admin permissions
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' };
    }

    // Use admin client to delete user from both auth and profiles
    const supabaseAdmin = createAdminClient();
    
    // Delete from profiles first
    const { error: profileError } = await supabaseAdmin.from('profiles').delete().eq('id', id);
    if (profileError) {
      console.error('Error deleting user profile:', profileError);
      return { success: false, error: profileError.message };
    }

    // Delete from auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authError) {
      console.error('Error deleting auth user:', authError);
      return { success: false, error: authError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error deleting user:', error);
    return { success: false, error: 'Unexpected error' };
  }
}
