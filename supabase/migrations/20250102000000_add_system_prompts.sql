-- 创建存储系统提示词的表
CREATE TABLE IF NOT EXISTS public.system_prompts (
    key text PRIMARY KEY, -- 比如 'default_analysis_prompt'
    content text NOT NULL, -- 具体的 Prompt 内容
    description text, -- 备注，比如"针对教程类视频优化"
    is_active boolean DEFAULT true,
    updated_at timestamptz DEFAULT now()
);

-- 开启 RLS (虽然主要给 Worker 用，但保持安全习惯)
ALTER TABLE public.system_prompts ENABLE ROW LEVEL SECURITY;

-- 允许 Service Role (Worker) 管理，允许所有用户读取（方便调试）
CREATE POLICY "Service role manages prompts" ON public.system_prompts
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable read access for all users" ON public.system_prompts
    FOR SELECT USING (true);

-- 插入默认的 Prompt (从 worker/main.py 中提取的完整 Prompt)
INSERT INTO public.system_prompts (key, content, description)
VALUES (
    'default_analysis_prompt', 
    'Analyze this video comprehensively and create a structured article-style guide.

Video Information:
- URL: {video_url}
- Duration: {duration_formatted} ({duration_seconds:.1f} seconds)

Your task:
1. First, provide a comprehensive summary of the entire video (2-3 paragraphs)
2. Then, break down the content into 4-10 key sections that form a cohesive article
3. For each section, identify if it needs a screenshot (core/visual moments)

Return a JSON object with this structure:
{{
    "summary": "A comprehensive 2-3 paragraph summary of the entire video content, covering main topics, key points, and overall message.",
    "sections": [
        {{
            "section_order": 1,
            "title": "Section title (clear and descriptive)",
            "content": "Detailed paragraph content for this section. Should be 2-4 sentences, written as part of an article. Focus on explaining concepts, insights, or key information from this part of the video.",
            "timestamp_seconds": 15.5,
            "needs_screenshot": true
        }},
        {{
            "section_order": 2,
            "title": "Another section",
            "content": "More detailed content...",
            "timestamp_seconds": 120.0,
            "needs_screenshot": false
        }}
    ]
}}

Guidelines:
1. Summary should capture the essence of the entire video
2. Sections should flow logically as an article, not just a list of steps
3. Each section should have substantial content (2-4 sentences minimum)
4. Mark needs_screenshot=true for:
   - Visual demonstrations
   - Important UI/interface moments
   - Key concepts that benefit from visual aid
   - Core action moments
5. Mark needs_screenshot=false for:
   - Explanatory/narrative sections
   - Introduction/overview parts
   - Summary/conclusion sections
6. Aim for 4-10 sections depending on video length (roughly 1 section per 2-5 minutes)
7. Timestamps should point to the most representative moment of each section
8. Write content as article paragraphs, not step-by-step instructions

Return ONLY valid JSON, no markdown, no code blocks, no explanations.', 
    'Default prompt for video analysis and article generation'
)
ON CONFLICT (key) DO UPDATE SET
    content = EXCLUDED.content,
    description = EXCLUDED.description,
    updated_at = now();

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_system_prompts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_system_prompts_updated_at
    BEFORE UPDATE ON public.system_prompts
    FOR EACH ROW
    EXECUTE FUNCTION update_system_prompts_updated_at();

