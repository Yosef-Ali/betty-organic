'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface ProfileData {
  id?: string;
  fullName: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  imageUrl?: string | null;
  status: 'active' | 'inactive';
  role: string;
}

interface Profile {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  role: string;
  status: string | null;
  created_at: string | null;
  updated_at: string;
  auth_provider: string | null;
  phone: string | null;
}

export async function updateProfile(data: ProfileData) {
  const supabase = await createClient();

  try {
    if (!data || !data.fullName || !data.email) {
      throw new Error('Name and email are required');
    }

    const updateData = {
      id: data.id || '', // Ensure id is always a string
      name: data.fullName.trim(),
      email: data.email.trim(),
      address: data.location?.trim() || null,
      avatar_url: data.imageUrl || null,
      status: data.status || 'active',
      role: data.role,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('profiles')
      .upsert(updateData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/customers');
    return { success: true };
  } catch (error) {
    console.error('Error in updateProfile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getProfile(id: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      fullName: data.name,
      email: data.email,
      phone: data.phone || '',
      location: data.address || '',
      imageUrl: data.avatar_url || '',
      status: data.status || 'inactive',
      role: data.role || 'customer',
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error in getProfile:', error);
    return null;
  }
}

export async function getCustomers() {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'customer')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching customers:', error);
      return [];
    }

    return (
      data?.map(profile => ({
        id: profile.id,
        fullName: profile.name,
        email: profile.email,
        phone: profile.phone || '',
        location: profile.address || '',
        imageUrl: profile.avatar_url || '',
        status: profile.status || 'inactive',
      })) || []
    );
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
}

export async function getCustomer(id: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .eq('role', 'customer')
      .single();

    if (error) {
      throw error;
    }

    return data
      ? {
        id: data.id,
        fullName: data.name,
        email: data.email,
        phone: data.phone || '',
        location: data.address || '',
        imageUrl: data.avatar_url || '',
        status: profile.status || 'inactive',
      }
      : null;
  } catch (error) {
    console.error('Error in getCustomer:', error);
    throw error;
  }
}

export async function searchCustomers(query: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'customer')
      .or(
        `name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`,
      )
      .order('name');

    if (error) {
      console.error('Supabase error searching customers:', error);
      return [];
    }

    return (
      data?.map(profile => ({
        id: profile.id,
        fullName: profile.name,
        email: profile.email,
        phone: profile.phone || '',
        location: profile.address || '',
        imageUrl: profile.avatar_url || '',
        status: profile.status || 'inactive',
      })) || []
    );
  } catch (error) {
    console.error('Error searching customers:', error);
    return [];
  }
}
