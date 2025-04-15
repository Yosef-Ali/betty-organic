import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    },
    // Add retry options for more resilient connections
    timeout: 60000, // Longer timeout (60 seconds)
    headers: {
      'X-Client-Info': 'betty-organic-app' // Custom client identifier
    }
  },
  // Global error handler for all Supabase operations
  global: {
    fetch: (...args) => {
      // @ts-ignore
      return fetch(...args).catch(err => {
        console.error('Supabase fetch error:', err);
        throw err;
      });
    },
    // Add debug info in headers instead
    headers: process.env.NODE_ENV === 'development'
      ? { 'X-Debug-Mode': 'true' }
      : undefined
  }
});

// Add a utility function to check if Realtime is enabled for the project
export async function checkRealtimeEnabled() {
  try {
    // Create a temporary channel to test if Realtime is working
    const testChannel = supabase.channel('realtime-test');

    return new Promise<boolean>((resolve) => {
      let timeout: NodeJS.Timeout;

      // Set timeout for 5 seconds - if we don't get a response by then, 
      // assume Realtime is not working
      timeout = setTimeout(() => {
        try {
          supabase.removeChannel(testChannel).catch(e => {
            console.log('Non-critical error removing test channel:', e);
          });
        } catch (e) { }
        console.log('Realtime connection timed out - might be disabled');
        resolve(false);
      }, 5000);

      // Try to subscribe
      testChannel.subscribe((status) => {
        clearTimeout(timeout);

        if (status === 'SUBSCRIBED') {
          console.log('Realtime is enabled and working');
          // Clean up the test channel
          try {
            supabase.removeChannel(testChannel).catch(e => {
              console.log('Non-critical error removing test channel:', e);
            });
          } catch (e) { }
          resolve(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.log(`Realtime subscription test failed with status: ${status}`);
          resolve(false);
        }
      });
    });
  } catch (err) {
    console.error('Exception checking realtime status:', err);
    return false;
  }
}

// Cache check result to avoid repeated checks
let realtimeEnabledCache: { value: boolean | null; timestamp: number } = {
  value: null,
  timestamp: 0
};

// Add function to get realtime status with caching (reduces API calls)
export async function getRealtimeStatus() {
  // If we have a cached result that's less than 1 hour old, use it
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;

  if (realtimeEnabledCache.value !== null &&
    (now - realtimeEnabledCache.timestamp) < ONE_HOUR) {
    return realtimeEnabledCache.value;
  }

  // Otherwise check and update cache
  const result = await checkRealtimeEnabled();
  realtimeEnabledCache = { value: result, timestamp: now };
  return result;
}
