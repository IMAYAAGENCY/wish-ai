-- Security fix: Explicitly block public/anonymous access to affiliate_networks
-- This table contains API credentials and must never be accessible without authentication

CREATE POLICY "Deny public access to affiliate networks"
  ON public.affiliate_networks
  FOR ALL
  TO anon
  USING (false);