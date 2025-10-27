-- Create affiliate clicks tracking table
CREATE TABLE public.affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID,
  affiliate_link TEXT NOT NULL,
  network TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- Users can view their own clicks
CREATE POLICY "Users can view own clicks"
ON public.affiliate_clicks
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own clicks
CREATE POLICY "Users can insert own clicks"
ON public.affiliate_clicks
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admins can view all clicks
CREATE POLICY "Admins can view all clicks"
ON public.affiliate_clicks
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create commissions tracking table
CREATE TABLE public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  affiliate_click_id UUID REFERENCES public.affiliate_clicks(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending',
  network TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own commissions
CREATE POLICY "Users can view own commissions"
ON public.commissions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all commissions
CREATE POLICY "Admins can view all commissions"
ON public.commissions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can manage commissions
CREATE POLICY "Admins can manage commissions"
ON public.commissions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create indexes for better performance
CREATE INDEX idx_affiliate_clicks_user_id ON public.affiliate_clicks(user_id);
CREATE INDEX idx_affiliate_clicks_created_at ON public.affiliate_clicks(created_at);
CREATE INDEX idx_commissions_user_id ON public.commissions(user_id);
CREATE INDEX idx_commissions_created_at ON public.commissions(created_at);
CREATE INDEX idx_user_searches_created_at ON public.user_searches(created_at);