'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Helper function to get Supabase client
async function getSupabaseClient() {
  return createClient(); // Uses server client which handles cookies
}

export async function getCustomers() {
  const supabase = await getSupabaseClient();
  try {
    const { data: customers, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'customer');

    if (error) {
      console.error('Error fetching customers:', error.message);
      return [];
    }

    return customers;
  } catch (error: any) {
    console.error('Exception fetching customers:', error.message);
    return [];
  }
}

export async function getProfile(userId: string) {
  if (!userId) {
    console.error('getProfile called without userId');
    return null;
  }

  const supabase = await getSupabaseClient();
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // Ignore 'not found' error
      console.error('Error fetching profile:', error.message);
      return null; // Return null on actual error
    }

    return profile; // Return profile data or null if not found
  } catch (error: any) {
    console.error('Exception fetching profile:', error.message);
    return null;
  }
}

/**
 * Update user profile information
 */
export async function updateUserProfile(profileData: {
  name?: string;
  phone?: string;
  address?: string;
}) {
  const supabase = await getSupabaseClient();

  try {
    // First get the current user to ensure they're updating their own profile
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Authentication required to update profile:', userError);
      return {
        success: false,
        error: 'Authentication required to update profile'
      };
    }

    // Prepare update data, only include fields that are provided
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (profileData.name !== undefined) {
      updateData.name = profileData.name;
    }

    if (profileData.phone !== undefined) {
      updateData.phone = profileData.phone;
    }

    if (profileData.address !== undefined) {
      updateData.address = profileData.address;
    }

    // Update the profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return {
        success: false,
        error: `Failed to update profile: ${updateError.message}`
      };
    }

    // Revalidate paths that might show profile data
    revalidatePath('/dashboard/profile');
    revalidatePath('/');

    return {
      success: true
    };
  } catch (error: any) {
    console.error('Exception updating profile:', error.message);
    return {
      success: false,
      error: `An unexpected error occurred: ${error.message}`
    };
  }
}
