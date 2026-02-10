-- Blocklist of emails from students who were permanently removed.
-- Used to prevent the same email from signing up again.
-- Only service role (backend) can read/write; no RLS policies for anon/authenticated.

CREATE TABLE IF NOT EXISTS public.removed_student_emails (
  email text PRIMARY KEY,
  removed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.removed_student_emails ENABLE ROW LEVEL SECURITY;

-- No policies: anon and authenticated cannot read or write.
-- Service role bypasses RLS and can insert (on remove) and select (on signup check).

COMMENT ON TABLE public.removed_student_emails IS 'Emails of permanently removed students; signup with these emails is blocked.';
