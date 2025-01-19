import { User as SupabaseUser } from '@supabase/supabase-js'

export interface CustomUserMetadata {
  name?: string;
  // Add other custom metadata fields here
  avatar_url?: string;
  role?: 'admin' | 'customer' | 'sales';
}

export type User = SupabaseUser & {
  user_metadata: CustomUserMetadata;
}
