CREATE TABLE IF NOT EXISTS public.knowledge_base (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    question text NOT NULL,
    response text NOT NULL,
    suggestions text[] DEFAULT ARRAY[]::text[],
    links jsonb DEFAULT '[]'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Set up RLS policies
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read knowledge_base"
    ON public.knowledge_base
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert knowledge_base"
    ON public.knowledge_base
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete knowledge_base"
    ON public.knowledge_base
    FOR DELETE
    TO authenticated
    USING (true);
