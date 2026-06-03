-- =========================================================================
-- CUSTOM HANDOVER SETUP (Triggers on auth.users and storage config)
-- Run this script AFTER executing schema.sql on your Supabase database.
-- =========================================================================

-- 1. Database Triggers on auth.users
-- Since auth.users is in the "auth" schema, these triggers are not dumped by default.
-- They sync Supabase Auth signups and email changes to public.user.

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_auth_user_email_to_public_user();

-- 2. Supabase Storage bucket and RLS policies for book covers
-- Create the book-covers bucket if it doesn't already exist.
INSERT INTO storage.buckets (id, name, public)
VALUES ('book-covers', 'book-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Enable public select/read access to the book-covers bucket
CREATE POLICY "Public Access to Book Covers" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'book-covers');

-- Allow authenticated users to upload/insert files into the book-covers bucket
CREATE POLICY "Authenticated Users Can Upload Book Covers" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'book-covers');

-- Allow users to update/delete their own uploaded files in the book-covers bucket
CREATE POLICY "Users Can Update Their Own Book Covers" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'book-covers' AND (SELECT auth.uid()::text) = owner_id)
  WITH CHECK (bucket_id = 'book-covers' AND (SELECT auth.uid()::text) = owner_id);

CREATE POLICY "Users Can Delete Their Own Book Covers" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'book-covers' AND (SELECT auth.uid()::text) = owner_id);
