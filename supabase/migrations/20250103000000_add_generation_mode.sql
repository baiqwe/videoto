-- Add generation_mode field to projects table
-- This allows users to choose between text-only and text-with-images modes

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS generation_mode text 
CHECK (generation_mode IN ('text_only', 'text_with_images')) 
DEFAULT 'text_with_images';

-- Add comment
COMMENT ON COLUMN public.projects.generation_mode IS 
'Generation mode: text_only (structured text only, no screenshots) or text_with_images (text + screenshots)';

