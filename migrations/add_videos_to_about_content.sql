-- Add videos column to about_content table
ALTER TABLE public.about_content
ADD COLUMN IF NOT EXISTS videos jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Comment explaining the column purpose
COMMENT ON COLUMN public.about_content.videos IS 'JSON array of video URLs for the about section';
