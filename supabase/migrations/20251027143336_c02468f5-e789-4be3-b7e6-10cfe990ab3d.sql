-- Security fix: Add restrictive policy to explicitly deny non-admin modifications
-- This creates a mandatory check that must pass in addition to permissive policies

CREATE POLICY "Only admins can modify social posts"
  ON public.social_posts
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));