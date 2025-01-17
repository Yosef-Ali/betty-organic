'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

export async function getUsers() {
  try {
    const supabase = await createClient()

    // First get the current user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('Session error:', sessionError)
      throw new Error('Authentication required')
    }

    if (!session) {
      throw new Error('No active session')
    }

    // First get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        role,
        status
      `)
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('Database error:', profilesError)
      throw new Error(profilesError.message)
    }

    if (!profiles) {
      return []
    }

    // Get the current user's data to check role
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    const isAdmin = currentUser?.user_metadata?.role === 'admin'

    // Get users from auth.users table
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError && isAdmin) {
      console.error('Auth error:', authError)
      // Continue with profiles only if auth users fetch fails
    }

    // Combine profile and auth data
    return profiles.map(profile => {
      const authUser = authUsers?.users?.find(u => u.id === profile.id)
      return {
        id: profile.id,
        name: profile.name || authUser?.email?.split('@')[0] || 'Unnamed User',
        email: authUser?.email || '',
        role: profile.role || 'customer',
        status: profile.status || 'active'
      }
    })

  } catch (error: any) {
    console.error('Error in getUsers:', error)
    throw error instanceof Error ? error : new Error('Failed to fetch users')
  }
}

export async function getUserById(id: string) {
  try {
    const supabase = await createClient()

    // First verify session
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      throw new Error('Authentication required')
    }

    // Get profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        role,
        status
      `)
      .eq('id', id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return null
    }

    if (!profile) {
      return null
    }

    // Get auth user data if admin
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    const isAdmin = currentUser?.user_metadata?.role === 'admin'

    let email = ''
    if (isAdmin) {
      const { data: authUser } = await supabase.auth.admin.getUserById(id)
      if (authUser) {
        email = authUser.email || ''
      }
    }

    return {
      id: profile.id,
      name: profile.name || email?.split('@')[0] || 'Unnamed User',
      email,
      role: profile.role || 'customer',
      status: profile.status || 'active'
    }
  } catch (error) {
    console.error('Error in getUserById:', error)
    return null
  }
}

export async function updateUserRole(id: string, role: 'customer' | 'admin' | 'sales') {
  let supabase;

  try {
    supabase = await createClient()
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error)
    throw new Error('Database connection failed')
  }

  try {
    // First verify session
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      throw new Error('Authentication required')
    }

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

export async function deleteUser(id: string) {
  let supabase;

  try {
    supabase = await createClient()
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error)
    throw new Error('Database connection failed')
  }

  try {
    // First verify session
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      throw new Error('Authentication required')
    }

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)

    if (error) throw error
    revalidatePath('/dashboard/users')
  } catch (error) {
    console.error('Error deleting user:', error)
    throw new Error('Failed to delete user')
  }
}

export async function updateProfile({ name, email, image }: { name: string, email: string, image: string }) {
  let supabase;

  try {
    // Initialize Supabase client
    supabase = await createClient()
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error)
    throw new Error('Database connection failed')
  }

  try {
    // First verify session
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      throw new Error('Authentication required')
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Only update the user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      email: email !== user.email ? email : undefined, // Only update email if changed
      data: {
        full_name: name,
        avatar_url: image
      }
    });

    if (updateError) {
      console.error('Error updating user:', updateError);
      return { success: false, error: updateError.message };
    }

    // Update the profile record with basic info
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error('Error updating profile:', profileError);
      // Don't return error here as the main update was successful
    }

    revalidatePath('/dashboard/profile');
    return { success: true };
  } catch (error) {
    console.error('Profile update error:', error);
    return { success: false, error: 'An error occurred while updating profile' };
  }
}
