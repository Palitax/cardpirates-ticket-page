-- Migration: Create newsletter_subscribers table & update tickets table for organizer notification

-- 1. Create newsletter_subscribers table
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  source VARCHAR(50) NOT NULL DEFAULT 'landing_page',
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  unsubscribed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow public inserts and upserts for newsletter signup
CREATE POLICY "Allow public newsletter signup" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public newsletter update" ON public.newsletter_subscribers
  FOR UPDATE USING (true);

CREATE POLICY "Allow public newsletter select" ON public.newsletter_subscribers
  FOR SELECT USING (true);

-- 2. Add organizer_email column to tickets table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tickets' 
    AND column_name = 'organizer_email'
  ) THEN
    ALTER TABLE public.tickets ADD COLUMN organizer_email VARCHAR(255);
  END IF;
END $$;
