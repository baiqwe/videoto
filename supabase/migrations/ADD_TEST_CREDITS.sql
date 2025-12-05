-- Add 500 test credits to user: 04f69fe5-af7d-482f-afb2-522bfa12f21b
-- Copy and paste this into Supabase SQL Editor and execute
-- Note: This uses service_role permissions, so it will work even with RLS enabled

-- First, check if customer record exists and create/update it
DO $$
DECLARE
    v_user_id uuid := '04f69fe5-af7d-482f-afb2-522bfa12f21b'::uuid;
    v_customer_id uuid;
    v_user_email text;
    v_current_credits integer;
    v_creem_customer_id text := 'test_user_04f69fe5-af7d-482f-afb2-522bfa12f21b';
BEGIN
    -- Get user email
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = v_user_id;
    
    IF v_user_email IS NULL THEN
        v_user_email := 'test@example.com';
    END IF;
    
    -- Check if customer exists
    SELECT id, credits INTO v_customer_id, v_current_credits
    FROM public.customers
    WHERE user_id = v_user_id;
    
    IF v_customer_id IS NULL THEN
        -- Create new customer record
        INSERT INTO public.customers (
            user_id,
            creem_customer_id,
            email,
            credits,
            created_at,
            updated_at,
            metadata
        )
        VALUES (
            v_user_id,
            v_creem_customer_id,
            v_user_email,
            500,
            now(),
            now(),
            '{"source": "test_credits", "added_by": "admin"}'::jsonb
        )
        RETURNING id INTO v_customer_id;
        
        v_current_credits := 500;
    ELSE
        -- Update existing customer
        UPDATE public.customers
        SET 
            credits = COALESCE(credits, 0) + 500,
            updated_at = now()
        WHERE id = v_customer_id
        RETURNING credits INTO v_current_credits;
    END IF;
    
    -- Record the credit addition in history
    INSERT INTO public.credits_history (
        customer_id,
        amount,
        type,
        description,
        created_at,
        metadata
    )
    VALUES (
        v_customer_id,
        500,
        'add',
        'Test credits added by admin',
        now(),
        jsonb_build_object(
            'source', 'admin_test',
            'credits_before', v_current_credits - 500,
            'credits_after', v_current_credits
        )
    );
    
    RAISE NOTICE 'Added 500 credits to user. Customer ID: %, New Credits: %', v_customer_id, v_current_credits;
END $$;

-- Verify the credits were added
SELECT 
    c.id,
    c.user_id,
    c.email,
    c.credits,
    c.updated_at
FROM public.customers c
WHERE c.user_id = '04f69fe5-af7d-482f-afb2-522bfa12f21b'::uuid;

