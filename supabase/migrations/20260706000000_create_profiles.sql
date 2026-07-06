-- Migration: Create Profiles table for checkout metadata
-- This table stores whether the customer is a private person or a business,
-- along with company name, VAT number, and pre-fill address details.

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_customer_id VARCHAR(255) UNIQUE NOT NULL,
  user_type VARCHAR(50) CHECK (user_type IN ('private', 'business')),
  company_name VARCHAR(255),
  vat_number VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  address_line_1 VARCHAR(255),
  address_line_2 VARCHAR(255),
  city VARCHAR(255),
  zip_code VARCHAR(100),
  country VARCHAR(100),
  phone VARCHAR(100),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public reads and writes for simplicity in storefront access
-- In production, you should restrict this to authenticated users or key-based checks
CREATE POLICY "Allow public reads" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Allow public inserts" ON public.profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public updates" ON public.profiles
  FOR UPDATE USING (true);
