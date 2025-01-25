'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function getCustomerList() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          if (typeof cookies.get === 'function') {
            return cookies.get(name)?.value;
          }
          return undefined;
        },
      },
    },
  );

  try {
    const { data: customers, error } = await supabase
      .from('profiles')
      .select('id, name')
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
