-- migration: add manual_payments table

CREATE TABLE IF NOT EXISTS manual_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  email text NOT NULL,
  full_name text NOT NULL,
  amount numeric NOT NULL,
  receipt_url text NULL,
  note text NULL,
  status varchar(32) NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_by uuid NULL,
  approved_at timestamptz NULL,
  audit jsonb DEFAULT '{}'::jsonb
);

-- index for quick lookup
CREATE INDEX IF NOT EXISTS idx_manual_payments_status ON manual_payments (status);
CREATE INDEX IF NOT EXISTS idx_manual_payments_email ON manual_payments (email);
