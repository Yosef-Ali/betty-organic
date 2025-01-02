import { createBrowserClient } from '@supabase/ssr';
import { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const browserClient = createBrowserClient<Database>(supabaseUrl, supabaseKey);

export const getAuthenticatedClient = async () => {
  const { data: { session }, error } = await browserClient.auth.getSession();
  if (error || !session) {
    throw new Error('Not authenticated');
  }
  return browserClient;
};
