'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function getCustomerList() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
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

  try {
    const { data: customers, error } = await supabase
      .from('profiles')
      .select('id, name, phone, email')
      .eq('role', 'customer');

    if (error) {
      console.error('Error fetching customer list:', error);
      return []; // Return empty array in case of error
    }

    return customers || [];
  } catch (error) {
    console.error('Unexpected error fetching customer list:', error);
    return []; // Return empty array in case of error
  }
}

export async function updateCustomerPhone(customerId: string, phone: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
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

  try {
    // Validate phone number format
    const phoneRegex = /^\+251\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return {
        success: false,
        error: 'Invalid phone number format. Please use Ethiopian format (+251xxxxxxxxx)'
      };
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        phone: phone,
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId)
      .eq('role', 'customer')
      .select('id, name, phone');

    if (error) {
      console.error('Error updating customer phone:', error);
      return {
        success: false,
        error: 'Failed to update customer phone number'
      };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        error: 'Customer not found or unauthorized'
      };
    }

    console.log('✅ Customer phone updated successfully:', data[0]);

    return {
      success: true,
      data: data[0]
    };

  } catch (error) {
    console.error('Unexpected error updating customer phone:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while updating phone number'
    };
  }
}
