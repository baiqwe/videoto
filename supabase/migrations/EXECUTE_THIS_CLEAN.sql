DROP TABLE IF EXISTS public.generated_names CASCADE;
DROP TABLE IF EXISTS public.generation_batches CASCADE;
DROP TABLE IF EXISTS public.name_generation_logs CASCADE;
DROP TABLE IF EXISTS public.saved_names CASCADE;
DROP TABLE IF EXISTS public.popular_names CASCADE;

DROP FUNCTION IF EXISTS public.update_popular_name_stats(text, text) CASCADE;

CREATE TABLE public.projects (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title text,
    video_source_url text NOT NULL,
    video_duration_seconds integer,
    status text CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    error_message text,
    credits_cost integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.steps (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    step_order integer NOT NULL,
    title text,
    description text,
    timestamp_seconds float NOT NULL,
    image_path text,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX projects_user_id_idx ON public.projects(user_id);
CREATE INDEX projects_status_idx ON public.projects(status);
CREATE INDEX projects_created_at_idx ON public.projects(created_at DESC);

CREATE INDEX steps_project_id_idx ON public.steps(project_id);
CREATE INDEX steps_step_order_idx ON public.steps(project_id, step_order);

CREATE TRIGGER handle_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.steps ENABLE ROW LEVEL SECURITY;

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

GRANT ALL ON public.projects TO service_role;
GRANT ALL ON public.steps TO service_role;

