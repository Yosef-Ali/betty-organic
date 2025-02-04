-- Create product-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name)
VALUES ('product-images', 'product-images')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for product-images bucket
DROP POLICY IF EXISTS "Product images storage access" ON storage.objects;
CREATE POLICY "Product images storage access"
ON storage.objects FOR ALL
USING (
  bucket_id = 'product-images'
  AND (
    -- Allow public read access
    request_method = 'GET'
    -- Allow authenticated users to manage product images
    OR (auth.role() = 'authenticated' AND (
      request_method = 'POST'
      OR request_method = 'PUT'
      OR request_method = 'DELETE'
    ))
    -- Allow admins full access
    OR auth.role() = 'admin'
  )
);

-- Grant public access to product-images bucket
GRANT ALL ON BUCKET product-images TO authenticated;
GRANT SELECT ON BUCKET product-images TO anon;
