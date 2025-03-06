-- Create google_reviews table
CREATE TABLE IF NOT EXISTS google_reviews (
  id BIGSERIAL PRIMARY KEY,
  author_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  source VARCHAR(20) DEFAULT 'google',
  approved BOOLEAN DEFAULT true,
  profile_photo_url TEXT,
  UNIQUE(author_name, content) -- Prevent duplicate reviews
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_google_reviews_created_at ON google_reviews(created_at DESC);

-- Add index for filtering by approval status
CREATE INDEX IF NOT EXISTS idx_google_reviews_approved ON google_reviews(approved);

-- Grant access to authenticated users
ALTER TABLE google_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all users"
  ON google_reviews
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert to service role only"
  ON google_reviews
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Allow update to service role only"
  ON google_reviews
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
