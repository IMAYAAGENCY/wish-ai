-- Security fix: Explicitly block anonymous access to profiles table
-- This ensures unauthenticated users cannot access any profile data

CREATE POLICY "Block anonymous access to profiles"
  ON public.profiles
  FOR SELECT
  TO anon
  USING (false);