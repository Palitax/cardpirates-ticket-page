-- Migration: Create tickets and staff_members tables for scanning system

-- Create staff_members table linked to auth.users
CREATE TABLE IF NOT EXISTS public.staff_members (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'staff' CHECK (role IN ('staff', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(255) NOT NULL,
  holder_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'checked_in')),
  checked_in_at TIMESTAMP WITH TIME ZONE,
  conflict_duplicate BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Policies for staff_members
CREATE POLICY "Allow authenticated users to read staff list" ON public.staff_members
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policies for tickets
-- 1. Allow public inserts (so that the mock frontend checkout can insert tickets)
CREATE POLICY "Allow public inserts for mock purchases" ON public.tickets
  FOR INSERT WITH CHECK (true);

-- 2. Allow public select of tickets (so customers can see their tickets by ID, and staff can fetch them)
CREATE POLICY "Allow public reads of tickets" ON public.tickets
  FOR SELECT USING (true);

-- 3. Allow staff members to update tickets (perform check-ins)
CREATE POLICY "Allow staff to update tickets" ON public.tickets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.staff_members
      WHERE staff_members.id = auth.uid()
    )
  );
