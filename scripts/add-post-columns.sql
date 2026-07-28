-- Run this in your Supabase SQL Editor or any Postgres client.
-- This adds the missing columns needed so posts keep their own title, excerpt, and category.

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS excerpt text,
  ADD COLUMN IF NOT EXISTS category text;

-- Backfill existing posts so they do not become blank or mixed together.
UPDATE public.posts
SET title = COALESCE(
  NULLIF(trim(title), ''),
  split_part(COALESCE(content, ''), E'\n', 1),
  'PulseWire story'
)
WHERE title IS NULL OR trim(title) = '';

UPDATE public.posts
SET excerpt = COALESCE(
  NULLIF(trim(excerpt), ''),
  CASE
    WHEN COALESCE(content, '') = '' THEN 'PulseWire story'
    ELSE regexp_replace(COALESCE(content, ''), E'(?s)^.*?\n\s*', '', 1, 1)
  END,
  'PulseWire story'
)
WHERE excerpt IS NULL OR trim(excerpt) = '';

UPDATE public.posts
SET category = COALESCE(NULLIF(trim(category), ''), 'Technology')
WHERE category IS NULL OR trim(category) = '';

ALTER TABLE public.posts
  ALTER COLUMN category SET DEFAULT 'Technology';

CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts (category);
