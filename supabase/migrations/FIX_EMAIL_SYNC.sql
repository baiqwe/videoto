-- 将 customers 表中的邮箱恢复为 auth.users 表中的正确邮箱
-- 这会将所有 customer 记录的邮箱同步为用户注册时的邮箱

-- 方法1: 更新所有不匹配的邮箱
UPDATE public.customers c
SET email = au.email,
    updated_at = NOW()
FROM auth.users au
WHERE c.user_id = au.id
  AND c.email != au.email;

-- 查询：检查更新后的结果（可选）
-- SELECT 
--   c.user_id,
--   c.email as customer_email,
--   au.email as auth_email,
--   c.email = au.email as emails_match
-- FROM public.customers c
-- JOIN auth.users au ON c.user_id = au.id;

-- 成功提示
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM public.customers c
  JOIN auth.users au ON c.user_id = au.id
  WHERE c.email = au.email;
  
  RAISE NOTICE 'Email sync complete! % customer records now match their auth.users email.', updated_count;
END $$;
