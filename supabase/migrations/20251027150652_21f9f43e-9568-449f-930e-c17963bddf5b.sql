-- Security fix: Ensure user_id is always populated in user_searches and user_favorites
-- This prevents orphaned records that could bypass RLS policies

-- First, update any existing NULL user_id values (if any) to prevent migration failure
-- This shouldn't happen in practice, but ensures clean migration
UPDATE public.user_searches SET user_id = auth.uid() WHERE user_id IS NULL;
UPDATE public.user_favorites SET user_id = auth.uid() WHERE user_id IS NULL;

-- Add NOT NULL constraints to prevent future NULL values
ALTER TABLE public.user_searches 
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.user_favorites 
  ALTER COLUMN user_id SET NOT NULL;