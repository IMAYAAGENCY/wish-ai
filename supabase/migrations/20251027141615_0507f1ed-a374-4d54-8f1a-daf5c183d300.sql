-- Security fix: Remove sensitive credential storage from affiliate_networks table
-- API credentials should ONLY be stored in Supabase secrets, never in database

-- Drop the config column that could store sensitive data
ALTER TABLE public.affiliate_networks DROP COLUMN IF EXISTS config;

-- Add a non-sensitive settings column for public configuration only
ALTER TABLE public.affiliate_networks ADD COLUMN settings jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.affiliate_networks.settings IS 'Non-sensitive public settings only. API credentials MUST be stored in Supabase secrets/vault.';

COMMENT ON TABLE public.affiliate_networks IS 'Affiliate network metadata. Credentials stored in Supabase secrets: AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY, AMAZON_PARTNER_TAG, ADMITAD_CLIENT_ID, ADMITAD_CLIENT_SECRET, etc.';