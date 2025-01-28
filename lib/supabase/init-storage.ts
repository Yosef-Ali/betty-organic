import { createClient } from '@supabase/supabase-js';

export async function initializeStorage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const profilesBucketExists = buckets?.some(bucket => bucket.name === 'profiles');

    if (!profilesBucketExists) {
      // Create the profiles bucket with public access
      const { data, error } = await supabase.storage.createBucket('profiles', {
        public: true,
        fileSizeLimit: 5242880, // 5MB in bytes
        allowedMimeTypes: ['image/*']
      });

      if (error) {
        throw error;
      }

      console.log('Created profiles bucket:', data);
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
    throw error;
  }
}
