'use server';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

export async function createClient() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
      throw new Error('Database configuration error');
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
      throw new Error('Database configuration error');
    }

    const client = createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false // Don't persist session in server environment
        },
        db: {
          schema: 'public'
        }
      }
    );

    // Test the connection
    const { error } = await client.from('about_content').select('id').limit(1);
    if (error) {
      console.error('Failed to connect to Supabase:', error.message);
      throw new Error('Database connection error');
    }

    return client;
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    throw new Error('Failed to initialize database connection');
  }
}
