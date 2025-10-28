-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily blog post generation at 2 AM UTC
SELECT cron.schedule(
  'generate-daily-blog-posts',
  '0 2 * * *', -- Every day at 2 AM UTC
  $$
  SELECT
    net.http_post(
        url:='https://sgotbrbtbbectimwqvfq.supabase.co/functions/v1/generate-blog-posts',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnb3RicmJ0YmJlY3RpbXdxdmZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0Mzc2MTgsImV4cCI6MjA3NzAxMzYxOH0.RmJULPVgYICm_8IcAplltlleHQ3TLIA0IAf4fEfKF98"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);