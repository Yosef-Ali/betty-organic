-- Add videos array to about_content table using jsonb data type (same as images)
ALTER TABLE public.about_content 
ADD COLUMN IF NOT EXISTS videos jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Comment on the column
COMMENT ON COLUMN public.about_content.videos IS 'Array of video URLs for the about section';