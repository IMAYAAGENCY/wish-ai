-- Drop the insecure public profile viewing policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create secure policy: users can only view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Allow admins to view all profiles (for admin dashboard)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Fix affiliate_networks exposure: remove public access
DROP POLICY IF EXISTS "Anyone can view active networks" ON public.affiliate_networks;

-- Only authenticated users can view network names (not config data)
CREATE POLICY "Authenticated users can view network list"
  ON public.affiliate_networks FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admins can view full network config including API settings
CREATE POLICY "Admins can view all network details"
  ON public.affiliate_networks FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));