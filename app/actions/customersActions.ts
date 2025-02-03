'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import { getUser } from './auth';
import { Customer } from '@/lib/types/supabase';

interface CreateCustomerData {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  imageUrl?: string | null;
  status: 'active' | 'inactive';
}

export async function createCustomer(data: CreateCustomerData) {
  const supabase = createClient();

  try {
    const { error } = await supabase.from('profiles').insert({
      id: data.id,
      name: data.fullName,
      email: data.email,
      address: data.location || null,
      avatar_url: data.imageUrl || null,
      role: 'customer',
      status: data.status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      throw error;
    }

    revalidatePath('/dashboard/customers');
    return { success: true };
  } catch (error) {
    console.error('Error in createCustomer:', error);
    throw error;
  }
}

export async function updateCustomer(data: CreateCustomerData) {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        name: data.fullName,
        email: data.email,
        address: data.location || null,
        avatar_url: data.imageUrl || null,
        status: data.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id);

    if (error) {
      throw error;
    }

    revalidatePath('/dashboard/customers');
    return { success: true };
  } catch (error) {
    console.error('Error in updateCustomer:', error);
    throw error;
  }
}

export async function deleteCustomer(id: string) {
  const supabase = createClient();

  try {
    // Get customer data to delete image if exists
    const { data: customer } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', id)
      .single();

    // Delete image from storage if exists
    if (customer?.avatar_url) {
      const path = customer.avatar_url.split('/').pop();
      if (path) {
        await supabase.storage.from('avatars').remove([path]);
      }
    }

    // Delete customer record
    const { error } = await supabase.from('profiles').delete().eq('id', id);

    if (error) {
      throw error;
    }

    revalidatePath('/dashboard/customers');
    return { success: true };
  } catch (error) {
    console.error('Error in deleteCustomer:', error);
    throw error;
  }
}

export async function getCustomer(id: string) {
  const supabase = createClient();

  try {
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
          location: data.address || '',
          imageUrl: data.avatar_url || '',
          status: data.status || 'inactive',
        }
      : null;
  } catch (error) {
    console.error('Error in getCustomer:', error);
    throw error;
  }
}

export async function getCustomers() {
  const supabase = createClient();

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
      data?.map(customer => ({
        id: customer.id,
        full_name: customer.name,
        email: customer.email,
        location: customer.address || '',
        imageUrl: customer.avatar_url || '',
        status: customer.status || 'inactive',
      })) || []
    );
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
}
