-- Add AI verification columns to posts and trusted-post counters to profiles
ALTER TABLE IF EXISTS posts
  ADD COLUMN IF NOT EXISTS ai_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ai_verification TEXT;

ALTER TABLE IF EXISTS profiles
  ADD COLUMN IF NOT EXISTS trusted_posts_count INT DEFAULT 0;

-- Ensure badges and user_badges tables exist (they're included in community_schema.sql but re-create safely)
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  criteria JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, badge_id)
);
