import { Database } from '@/types';
import { SupabaseClient } from '@supabase/supabase-js';

export type TypedSupabaseClient = SupabaseClient<Database>;

export type Profile = Database['public']['Tables']['profiles']['Row'];

export interface AuthError {
  message: string;
  status?: number;
}

export interface SupabaseConfig {
  auth: {
    persistSession: boolean;
    detectSessionInUrl: boolean;
    flowType: 'pkce' | 'implicit';
    autoRefreshToken: boolean;
    debug: boolean;
  };
  cookies: {
    name?: string;
    lifetime?: number;
    domain?: string;
    path?: string;
    sameSite?: string;
  };
}
