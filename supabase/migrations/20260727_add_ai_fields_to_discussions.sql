-- Add AI fields to discussions table
ALTER TABLE IF EXISTS discussions
  ADD COLUMN IF NOT EXISTS ai_summary TEXT,
  ADD COLUMN IF NOT EXISTS suggested_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS moderation JSONB;

-- Update indexes if needed
CREATE INDEX IF NOT EXISTS idx_discussions_ai_summary ON discussions USING gin (to_tsvector('english', coalesce(ai_summary, '')));
CREATE INDEX IF NOT EXISTS idx_discussions_suggested_tags ON discussions USING gin (suggested_tags);
