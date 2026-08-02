-- FLEVO Contact Messages Table Migration
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS contact_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  email      text,
  phone      text,
  message    text NOT NULL,
  status     text DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert only"
  ON contact_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "admin read"
  ON contact_messages FOR SELECT
  USING (auth.role() = 'authenticated');
