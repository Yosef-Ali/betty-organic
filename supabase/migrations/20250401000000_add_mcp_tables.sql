-- Create a new table for storing MCP interactions
CREATE TABLE IF NOT EXISTS public.mcp_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request JSONB NOT NULL,
  response JSONB NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now() NOT NULL,
  model TEXT NOT NULL,
  profile_id UUID REFERENCES public.profiles(id),
  tags TEXT[],
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_mcp_interactions_timestamp ON public.mcp_interactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_mcp_interactions_profile_id ON public.mcp_interactions(profile_id);
CREATE INDEX IF NOT EXISTS idx_mcp_interactions_model ON public.mcp_interactions(model);
CREATE INDEX IF NOT EXISTS idx_mcp_interactions_tags ON public.mcp_interactions USING GIN(tags);

-- Add RLS policies
ALTER TABLE public.mcp_interactions ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own interactions
CREATE POLICY "Users can view their own MCP interactions" ON public.mcp_interactions
  FOR SELECT
  USING (auth.uid() = profile_id);

-- Allow users to create their own interactions
CREATE POLICY "Users can create their own MCP interactions" ON public.mcp_interactions
  FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- Allow admins to view all interactions
CREATE POLICY "Admins can view all MCP interactions" ON public.mcp_interactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create a view for MCP interaction analytics
CREATE OR REPLACE VIEW public.mcp_interaction_analytics AS
SELECT
  date_trunc('day', timestamp) AS day,
  model,
  COUNT(*) AS interaction_count,
  AVG((response->'usage'->>'total_tokens')::integer) AS avg_tokens
FROM
  public.mcp_interactions
GROUP BY
  day, model
ORDER BY
  day DESC, model;

-- Grant appropriate permissions
GRANT SELECT ON public.mcp_interaction_analytics TO authenticated;
GRANT SELECT, INSERT ON public.mcp_interactions TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.mcp_interactions_id_seq TO authenticated;