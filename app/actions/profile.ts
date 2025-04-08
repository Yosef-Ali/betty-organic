'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

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
