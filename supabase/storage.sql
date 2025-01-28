-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for avatars bucket
DROP POLICY IF EXISTS "Avatar storage access" ON storage.objects;
CREATE POLICY "Avatar storage access"
ON storage.objects FOR ALL
USING (
  bucket_id = 'avatars'
  AND (
    -- Allow users to manage their own avatars
    (auth.role() = 'authenticated' AND (
      -- Allow access to user's own folder
      (storage.foldername(name))[1] = auth.uid()::text
      -- Allow access to new uploads (when folder doesn't exist yet)
      OR name = auth.uid()::text || '/'
      OR name LIKE auth.uid()::text || '/%'
    ))
    -- Allow admins full access
    OR auth.role() = 'admin'
  )
);

-- Policy for profiles bucket
DROP POLICY IF EXISTS "Profile storage access" ON storage.objects;
CREATE POLICY "Profile storage access"
ON storage.objects FOR ALL
USING (
  bucket_id = 'profiles'
  AND (
    -- Allow users to manage their own profile images
    (auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text)
    -- Allow admins full access
    OR auth.role() = 'admin'
  )
);

-- Policy for products bucket
DROP POLICY IF EXISTS "Product storage access" ON storage.objects;
CREATE POLICY "Product storage access"
ON storage.objects FOR ALL
USING (
  bucket_id = 'products'
  AND (
    -- Allow authenticated users to manage product images
    auth.role() = 'authenticated'
    -- Allow admins full access
    OR auth.role() = 'admin'
  )
);
