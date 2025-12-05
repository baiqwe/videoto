-- Fix: Create customers, credits_history, and subscriptions tables
-- Copy and paste this entire file into Supabase SQL Editor and execute

CREATE TABLE IF NOT EXISTS public.customers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    creem_customer_id text NOT NULL UNIQUE,
    email text NOT NULL,
    name text,
    country text,
    credits integer DEFAULT 0 NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT customers_email_match CHECK (email = lower(email)),
    CONSTRAINT credits_non_negative CHECK (credits >= 0)
);

CREATE TABLE IF NOT EXISTS public.credits_history (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    amount integer NOT NULL,
    type text NOT NULL CHECK (type IN ('add', 'subtract')),
    description text,
    creem_order_id text,
    created_at timestamptz DEFAULT now() NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    creem_subscription_id text NOT NULL UNIQUE,
    creem_product_id text NOT NULL,
    status text NOT NULL CHECK (status IN ('incomplete', 'expired', 'active', 'past_due', 'canceled', 'unpaid', 'paused', 'trialing')),
    current_period_start timestamptz NOT NULL,
    current_period_end timestamptz NOT NULL,
    canceled_at timestamptz,
    trial_end timestamptz,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS customers_user_id_idx ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS customers_creem_customer_id_idx ON public.customers(creem_customer_id);
CREATE INDEX IF NOT EXISTS subscriptions_customer_id_idx ON public.subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS credits_history_customer_id_idx ON public.credits_history(customer_id);
CREATE INDEX IF NOT EXISTS credits_history_created_at_idx ON public.credits_history(created_at);

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS handle_customers_updated_at ON public.customers;
CREATE TRIGGER handle_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER handle_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own customer data"
    ON public.customers FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own customer data"
    ON public.customers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customer data"
    ON public.customers FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage customer data"
    ON public.customers FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their own subscriptions"
    ON public.subscriptions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.customers
            WHERE customers.id = subscriptions.customer_id
            AND customers.user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage subscriptions"
    ON public.subscriptions FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their own credits history"
    ON public.credits_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.customers
            WHERE customers.id = credits_history.customer_id
            AND customers.user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage credits history"
    ON public.credits_history FOR ALL
    USING (auth.role() = 'service_role');

GRANT ALL ON public.customers TO service_role;
GRANT ALL ON public.credits_history TO service_role;
GRANT ALL ON public.subscriptions TO service_role;

