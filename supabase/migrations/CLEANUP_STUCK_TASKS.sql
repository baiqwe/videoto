-- 问题1: 清理被 Cloudflare 拦截的卡住任务
-- 将所有 processing 状态的项目标记为 failed

UPDATE public.projects
SET 
    status = 'failed',
    error_message = 'Worker crashed due to Cloudflare 502 error - please retry',
    updated_at = NOW()
WHERE status = 'processing';

-- 查看更新结果
SELECT 
    id,
    title,
    status,
    error_message,
    created_at
FROM public.projects
ORDER BY created_at DESC
LIMIT 10;
