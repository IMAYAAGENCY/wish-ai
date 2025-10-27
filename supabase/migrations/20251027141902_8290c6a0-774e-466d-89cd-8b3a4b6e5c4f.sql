-- Security fix: Restrict affiliate_networks access to admins only
-- Remove the overly permissive authenticated user access

DROP POLICY IF EXISTS "Authenticated users can view network list" ON public.affiliate_networks;

-- Ensure admin-only policies exist for full control
DROP POLICY IF EXISTS "Admins can manage networks" ON public.affiliate_networks;

CREATE POLICY "Admins can manage networks"
  ON public.affiliate_networks FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));