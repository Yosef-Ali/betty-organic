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
    const { error } = await supabase.from('customers').insert({
      id: data.id,
      full_name: data.fullName,
      email: data.email,
      phone: data.phone || null,
      location: data.location || null,
      image_url: data.imageUrl || null,
      status: data.status === 'active',
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
      .from('customers')
      .update({
        full_name: data.fullName,
        email: data.email,
        phone: data.phone || null,
        location: data.location || null,
        image_url: data.imageUrl || null,
        status: data.status === 'active',
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
      .from('customers')
      .select('image_url')
      .eq('id', id)
      .single();

    // Delete image from storage if exists
    if (customer?.image_url) {
      const path = customer.image_url.split('/').pop();
      if (path) {
        await supabase.storage.from('customers').remove([`customers/${path}`]);
      }
    }

    // Delete customer record
    const { error } = await supabase.from('customers').delete().eq('id', id);

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
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data
      ? {
          id: data.id,
          fullName: data.full_name,
          email: data.email,
          phone: data.phone || '',
          location: data.location || '',
          imageUrl: data.image_url || '',
          status: data.status ? 'active' : 'inactive',
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
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching customers:', error);
      return [];
    }

    return (
      data?.map(customer => ({
        id: customer.id,
        full_name: customer.full_name,
        email: customer.email,
        phone: customer.phone || '',
        location: customer.location || '',
        imageUrl: customer.image_url || '',
        status: customer.status ? 'active' : 'inactive',
      })) || []
    );
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
}
