'use server'

import { UTApi } from "uploadthing/server";
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase/supabaseClient';
import { Customer } from '../../types';
import { v4 as uuidv4 } from 'uuid';

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
    // Extract and validate form data
    const fullName = formData.get('fullName');
    const email = formData.get('email');
    const phone = formData.get('phone');
    const location = formData.get('location');
    const status = formData.get('status');
    const imageUrl = formData.get('imageUrl');

    const customerId = uuidv4(); // Generate UUID

    const { data: customer, error } = await supabase
      .from('customers')
      .insert({
        id: customerId,
        full_name: fullName,
        email: email || '',
        phone: phone || null,
        location: location || null,
        status: status || 'active',
        image_url: imageUrl || null
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw new Error(`Database error: ${error.message}`);
    }

    revalidatePath('/dashboard/customers');
    return customer;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
}

export async function updateCustomer(data: Customer) {
  try {
    console.log('Updating customer with data:', data);
    const { data: customer, error } = await supabase
      .from('customers')
      .update({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        location: data.location,
        status: data.status,
        image_url: data.imageUrl
      })
      .eq('id', data.id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error details:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    revalidatePath('/dashboard/customers');
    return customer;
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error;
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
