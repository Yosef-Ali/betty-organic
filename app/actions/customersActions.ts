'use server'

import { UTApi } from "uploadthing/server";
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { Customer } from '../../types';

const utapi = new UTApi();

export async function uploadImage(data: FormData) {
  const file = data.get("file") as File;
  if (!file) {
    throw new Error("No file provided");
  }

  try {
    const { data: uploadData, error } = await supabase.storage
      .from('product-images')
      .upload(`${Date.now()}-${file.name}`, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error("Error uploading image to Supabase:", error);
      throw new Error("Failed to upload image to Supabase");
    }

    const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${uploadData.path}`;
    return fileUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw new Error("Failed to upload image");
  }
}

export async function createCustomer(formData: FormData) {
  try {
    const imageUrl = formData.get('imageUrl') as string | null;
    const { data: customer, error } = await supabase
      .from('customers')
      .insert({
        full_name: formData.get('fullName') as string,
        email: (formData.get('email') as string) || '',
        phone: (formData.get('phone') as string) || '',
        location: (formData.get('location') as string) || '',
        status: formData.get('status') as 'active' | 'inactive',
        image_url: imageUrl,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating customer:', error);
      throw new Error('Failed to create customer');
    }
    revalidatePath('/dashboard/customers');
    return customer;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw new Error('Failed to create customer');
  }
}

export async function updateCustomer(data: Customer) {
  try {
    const { data: customer, error } = await supabase
      .from('customers')
      .update({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        location: data.location,
        status: data.status,
        image_url: data.image_url,
      })
      .eq('id', data.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating customer:', error);
      throw new Error('Failed to update customer');
    }
    revalidatePath('/dashboard/customers');
    return customer;
  } catch (error) {
    console.error('Error updating customer:', error);
    throw new Error('Failed to update customer');
  }
}

export async function getCustomerImage(customerId: string) {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('image_url')
      .eq('id', customerId)
      .single();

    if (error) {
      console.error('Error fetching customer image:', error);
      throw new Error('Failed to fetch customer image');
    }

    return data ? data.image_url : null;
  } catch (error) {
    console.error('Error fetching customer image:', error);
    throw new Error('Failed to fetch customer image');
  }
}

export async function getCustomers() {
  try {
    const { data: customers, error } = await supabase
      .from('customers')
      .select();

    if (error) {
      console.error('Error fetching customers:', error);
      throw new Error('Failed to fetch customers');
    }

    return customers;
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw new Error('Failed to fetch customers');
  }
}

export async function getCustomer(id: string) {
  try {
    const { data: customer, error } = await supabase
      .from('customers')
      .select()
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching customer:', error);
      throw new Error('Failed to fetch customer');
    }

    return customer;
  } catch (error) {
    console.error('Error fetching customer:', error);
    throw new Error('Failed to fetch customer');
  }
}

export async function deleteCustomer(id: string) {
  try {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

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
  try {
    const { data: customer, error } = await supabase
      .from('customers')
      .select()
      .eq('id', id)
      .single();
    return customer; // This line is crucial
  } catch (error) {
    console.error('Error fetching customer:', error);
    return null;
  }
}

export async function searchCustomers(query: string) {
  if (!query) {
    return [];
  }

  try {
    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, full_name, phone, image_url')
      .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`)
      .limit(5);

    if (error) {
      console.error('Error in searchCustomers:', error);
      return [];
    }

    if (!customers || !Array.isArray(customers)) {
      console.error('Unexpected result from Supabase query:', customers);
      return [];
    }

    const result = customers.map(customer => ({
      ...customer,
      fullName: customer.full_name.toLowerCase().includes(query.toLowerCase())
        ? customer.full_name
        : customer.full_name,
    }));

    console.log('Processed result:', result);
    return result;
  } catch (error) {
    console.error('Error in searchCustomers:', error);
    return [];
  }
}
