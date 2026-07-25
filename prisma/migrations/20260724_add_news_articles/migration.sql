-- Migration: add_news_articles

CREATE TABLE public.news_articles (
  id text PRIMARY KEY,
  title text,
  description text,
  content text,
  image text,
  source text,
  author text,
  published_at timestamptz,
  category text,
  country text,
  url text UNIQUE,
  summary text,
  tldr text,
  seo_title text,
  meta_description text,
  keywords text[],
  tags text[],
  suggested_category text,
  social_caption text,
  imported_at timestamptz DEFAULT now(),
  published boolean DEFAULT false
);
