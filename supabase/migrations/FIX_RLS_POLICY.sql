-- Fix RLS policy to allow users to insert their own customer records
-- Copy and paste this into Supabase SQL Editor and execute

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can insert their own customer data" ON public.customers;

-- Create INSERT policy for customers
CREATE POLICY "Users can insert their own customer data"
    ON public.customers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Note: credits_history policies should already exist from FIX_CUSTOMERS_TABLE.sql
-- If you get an error about credits_history policy, you can ignore it
-- The important part is the customers INSERT policy above

