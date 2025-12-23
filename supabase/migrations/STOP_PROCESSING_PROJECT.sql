-- 停止所有正在处理中的视频项目
-- 将状态从 'processing' 改为 'failed'

-- 1. 查看当前正在处理的项目
SELECT 
    id,
    title,
    video_source_url,
    status,
    created_at,
    updated_at
FROM public.projects
WHERE status = 'processing'
ORDER BY created_at DESC;

-- 2. 停止所有正在处理的项目（将状态改为 failed）
UPDATE public.projects
SET 
    status = 'failed',
    error_message = 'Manually stopped by user',
    updated_at = NOW()
WHERE status = 'processing';

-- 3. 可选：如果你只想停止特定的项目，使用这个（替换 YOUR_PROJECT_ID）
-- UPDATE public.projects
-- SET 
--     status = 'failed',
--     error_message = 'Manually stopped by user',
--     updated_at = NOW()
-- WHERE id = 'YOUR_PROJECT_ID';

-- 成功提示
DO $$
DECLARE
  stopped_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO stopped_count
  FROM public.projects
  WHERE status = 'failed' 
    AND error_message = 'Manually stopped by user';
  
  RAISE NOTICE 'Successfully stopped % processing project(s).', stopped_count;
END $$;
