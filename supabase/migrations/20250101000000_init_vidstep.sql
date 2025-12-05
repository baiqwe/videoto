-- VidStep Migration: Clean up old tables and create new tables for video-to-guide conversion

-- Step 1: Drop old Chinese Names related tables
DROP TABLE IF EXISTS public.generated_names CASCADE;
DROP TABLE IF EXISTS public.generation_batches CASCADE;
DROP TABLE IF EXISTS public.name_generation_logs CASCADE;
DROP TABLE IF EXISTS public.saved_names CASCADE;
DROP TABLE IF EXISTS public.popular_names CASCADE;

-- Drop related functions
DROP FUNCTION IF EXISTS public.update_popular_name_stats(text, text) CASCADE;

-- Note: We keep customers, subscriptions, credits_history, ip_rate_limits tables
-- as they are still needed for the VidStep application

-- Step 2: Create Projects table (stores video processing tasks)
CREATE TABLE public.projects (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title text,
    video_source_url text NOT NULL, -- YouTube URL or file path
    video_duration_seconds integer,
    status text CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    error_message text,
    credits_cost integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Step 3: Create Steps table (stores generated steps from video)
CREATE TABLE public.steps (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    step_order integer NOT NULL, -- Step order: 1, 2, 3, ...
    title text,
    description text,
    timestamp_seconds float NOT NULL, -- Video timestamp in seconds
    image_path text, -- Supabase Storage path (e.g., "projects/123/step_1.jpg")
    created_at timestamptz DEFAULT now()
);

-- Step 4: Create indexes for performance
CREATE INDEX projects_user_id_idx ON public.projects(user_id);
CREATE INDEX projects_status_idx ON public.projects(status);
CREATE INDEX projects_created_at_idx ON public.projects(created_at DESC);

CREATE INDEX steps_project_id_idx ON public.steps(project_id);
CREATE INDEX steps_step_order_idx ON public.steps(project_id, step_order);

-- Step 5: Create updated_at trigger for projects
CREATE TRIGGER handle_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Step 6: Create RLS policies

-- Projects policies
CREATE POLICY "Users can view their own projects"
    ON public.projects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
    ON public.projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
    ON public.projects FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all projects"
    ON public.projects FOR ALL
    USING (auth.role() = 'service_role');

-- Steps policies
CREATE POLICY "Users can view steps of their own projects"
    ON public.steps FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = steps.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert steps for their own projects"
    ON public.steps FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = steps.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update steps of their own projects"
    ON public.steps FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = steps.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete steps of their own projects"
    ON public.steps FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = steps.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage all steps"
    ON public.steps FOR ALL
    USING (auth.role() = 'service_role');

-- Step 7: Grant permissions to service role
GRANT ALL ON public.projects TO service_role;
GRANT ALL ON public.steps TO service_role;

-- Note: After running this migration, you need to:
-- 1. Create a public bucket named 'guide_images' in Supabase Storage
-- 2. Set the bucket to public access for reading images

