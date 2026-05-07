-- ============================================================================
-- Contact form submissions table (used by store contact page)
-- Run after 20260209000000_complete_schema.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Public can insert (form submit); only admins can read
CREATE POLICY "Anyone can submit contact form"
  ON public.contact_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can view contact submissions"
  ON public.contact_submissions FOR SELECT
  USING (public.is_admin_or_staff());

CREATE INDEX idx_contact_submissions_created_at ON public.contact_submissions (created_at DESC);
