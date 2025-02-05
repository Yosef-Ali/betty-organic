import { createBrowserClient } from '@supabase/ssr';

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;
let retryCount = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export const createClient = async () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables');
  }

  if (!supabaseClient) {
    while (retryCount < MAX_RETRIES) {
      try {
        supabaseClient = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        );
        break;
      } catch (error) {
        retryCount++;
        if (retryCount === MAX_RETRIES) {
          throw new Error('Failed to initialize Supabase client after multiple attempts');
        }
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retryCount));
      }
    }
  }
  return supabaseClient;
};
