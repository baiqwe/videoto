-- 修复新用户积分触发器
-- 确保函数定义正确且触发器已绑定到auth.users表

-- ==========================================
-- 步骤 1: 重新创建 handle_new_user 函数（30积分版本）
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- 使用 ON CONFLICT DO NOTHING 防止重复插入导致触发器失败
  INSERT INTO public.customers (
    user_id,
    email,
    credits,
    creem_customer_id,
    created_at,
    updated_at,
    metadata
  ) VALUES (
    NEW.id,
    NEW.email,
    30, -- 新用户赠送30积分
    'auto_' || NEW.id::text,
    NOW(),
    NOW(),
    jsonb_build_object(
      'source', 'auto_registration',
      'initial_credits', 30,
      'registration_date', NOW()
    )
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- 插入历史记录（防止重复）
  INSERT INTO public.credits_history (
    customer_id,
    amount,
    type,
    description,
    created_at
  ) 
  SELECT id, 30, 'add', '🎉 新用户注册福利 (30积分)', NOW()
  FROM public.customers 
  WHERE user_id = NEW.id
  AND NOT EXISTS (
      SELECT 1 FROM public.credits_history 
      WHERE customer_id = public.customers.id 
      AND description = '🎉 新用户注册福利 (30积分)'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 步骤 2: 强制重建触发器
-- ==========================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 步骤 3: 验证触发器已正确创建
-- ==========================================
DO $$
DECLARE
    trigger_count integer;
    function_exists boolean;
BEGIN
    -- 检查触发器是否存在
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created'
    AND event_object_table = 'users'
    AND event_object_schema = 'auth';
    
    -- 检查函数是否存在
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'handle_new_user'
    ) INTO function_exists;
    
    IF trigger_count > 0 AND function_exists THEN
        RAISE NOTICE '✅ 触发器已成功重建并绑定到 auth.users 表';
        RAISE NOTICE '✅ handle_new_user 函数已更新（30积分版本）';
        RAISE NOTICE '✅ 新用户注册时将自动获得30积分';
    ELSIF function_exists AND trigger_count = 0 THEN
        RAISE WARNING '⚠️  函数存在但触发器未创建';
    ELSIF NOT function_exists THEN
        RAISE EXCEPTION '❌ 函数创建失败';
    ELSE
        RAISE EXCEPTION '❌ 触发器创建失败';
    END IF;
END $$;
