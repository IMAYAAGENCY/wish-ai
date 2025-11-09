-- Create table for storing user affiliate credentials
CREATE TABLE public.affiliate_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- Enable RLS
ALTER TABLE public.affiliate_credentials ENABLE ROW LEVEL SECURITY;

-- Users can manage their own credentials
CREATE POLICY "Users can view own credentials"
ON public.affiliate_credentials
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credentials"
ON public.affiliate_credentials
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credentials"
ON public.affiliate_credentials
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own credentials"
ON public.affiliate_credentials
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view all credentials
CREATE POLICY "Admins can view all credentials"
ON public.affiliate_credentials
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_affiliate_credentials_updated_at
BEFORE UPDATE ON public.affiliate_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();