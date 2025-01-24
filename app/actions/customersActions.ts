'use server';

import { UTApi } from 'uploadthing/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';
type Profile = Database['public']['Tables']['profiles']['Row'];
import { v4 as uuidv4 } from 'uuid';

const utapi = new UTApi();

export async function uploadImage(data: FormData) {
  const supabase = await createClient();
  const file = data.get('file') as File;
  if (!file) {
    throw new Error('No file provided');
  }

  try {
    const { data: uploadData, error } = await supabase.storage
      .from('product-images')
      .upload(`${Date.now()}-${file.name}`, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading image to Supabase:', error);
      throw new Error('Failed to upload image to Supabase');
    }

    const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${uploadData.path}`;
    return fileUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
}

export async function createCustomer(formData: FormData) {
  const supabase = await createClient();
  try {
    // Extract and validate form data
    const name = formData.get('fullName');
    const email = formData.get('email');
    const phone = formData.get('phone');
    const location = formData.get('location');
    const status = formData.get('status');
    const imageUrl = formData.get('imageUrl');

    if (!name || !email) {
      throw new Error('Name and email are required');
    }

    // Generate UUID
    const profileId = uuidv4();

    const { data: profile, error } = await supabase
      .from('profiles')
      .insert({
        id: profileId,
        name: name.toString(),
        email: email.toString(),
        address: location?.toString() || null,
        role: 'customer',
        status: status?.toString() || 'active',
        avatar_url: imageUrl?.toString() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      throw new Error(`Database error: ${error.message}`);
    }

    revalidatePath('/dashboard/customers');
    return profile;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
}

export async function updateCustomer(data: {
  id: string;
  name?: string;
  email?: string;
  address?: string | null;
  status?: string;
  avatar_url?: string | null;
}) {
  const supabase = await createClient();
  try {
    console.log('Updating customer profile with data:', data);
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        name: data.name,
        email: data.email,
        address: data.address,
        status: data.status,
        avatar_url: data.avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id)
      .eq('role', 'customer')
      .select()
      .single();

    if (error) {
      console.error('Supabase error details:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    revalidatePath('/dashboard/customers');
    return profile;
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error;
  }
}

export async function getCustomerImage(customerId: string) {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', customerId)
      .single();

    if (error) {
      console.error('Error fetching customer avatar:', error);
      throw new Error('Failed to fetch customer avatar');
    }

    return data ? data.avatar_url : null;
  } catch (error) {
    console.error('Error fetching customer image:', error);
    throw new Error('Failed to fetch customer image');
  }
}

export async function getCustomers() {
  const supabase = await createClient();
  try {
    // Fetch customers (profiles with role='customer')
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(
        `
        id,
        name,
        email,
        address,
        avatar_url,
        status,
        created_at,
        updated_at,
        orders (
          id,
          total_amount,
          status,
          created_at,
          updated_at
        )
      `,
      )
      .eq('role', 'customer')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customers:', error);
      throw new Error('Failed to fetch customers');
    }

    return profiles || [];
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw new Error('Failed to fetch customers');
  }
}

export async function getCustomer(id: string) {
  const supabase = await createClient();
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(
        `
        id,
        name,
        email,
        address,
        avatar_url,
        status,
        created_at,
        updated_at,
        orders (
          id,
          total_amount,
          status,
          created_at,
          updated_at
        )
      `,
      )
      .eq('id', id)
      .eq('role', 'customer')
      .single();

    if (error) {
      console.error('Error fetching customer:', error);
      throw new Error('Failed to fetch customer');
    }

    return profile;
  } catch (error) {
    console.error('Error fetching customer:', error);
    throw new Error('Failed to fetch customer');
  }
}

export async function deleteCustomer(id: string) {
  const supabase = await createClient();
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)
      .eq('role', 'customer');

    if (error) {
      console.error('Failed to delete customer:', error);
      return { success: false, error: 'Failed to delete customer' };
    }

    revalidatePath('/dashboard/customers');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete customer:', error);
    return { success: false, error: 'Failed to delete customer' };
  }
}

export async function getCustomerById(id: string) {
  const supabase = await createClient();
  try {
    const { data: customer, error } = await supabase
      .from('profiles')
      .select()
      .eq('id', id)
      .single();
    return customer;
  } catch (error) {
    console.error('Error fetching customer:', error);
    return null;
  }
}

export async function searchCustomers(query: string) {
  if (!query) {
    return [];
  }

  const supabase = await createClient();
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, name, email, address, avatar_url')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .eq('role', 'customer')
      .limit(5);

    if (error) {
      console.error('Error searching customers:', error);
      return [];
    }

    return profiles || [];
  } catch (error) {
    console.error('Error searching customers:', error);
    return [];
  }
}
