-- Migration: create notifications table

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text,
  metadata jsonb,
  user_id uuid,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Optional index for user lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
