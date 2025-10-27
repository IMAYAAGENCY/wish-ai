-- Security fix: Remove redundant anonymous blocking policy
-- The existing 'Users can view own profile' and 'Admins can view all profiles' 
-- policies already require authentication (auth.uid()), which inherently blocks anonymous access

DROP POLICY IF EXISTS "Block anonymous access to profiles" ON public.profiles;