-- Drop existing policy if it exists
DROP POLICY IF EXISTS "User access" ON "knowledge_base";
DROP POLICY IF EXISTS "Users can manage their own entries" ON "knowledge_base";

-- Enable RLS
ALTER TABLE "knowledge_base" ENABLE ROW LEVEL SECURITY;

-- Create separate policies for different operations
CREATE POLICY "Users can read entries"
ON "knowledge_base"
FOR SELECT
USING (true);  -- Anyone can read entries

CREATE POLICY "Users can create their own entries"
ON "knowledge_base"
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entries"
ON "knowledge_base"
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entries"
ON "knowledge_base"
FOR DELETE
USING (auth.uid() = user_id);
