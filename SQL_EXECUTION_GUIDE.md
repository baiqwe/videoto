# SQL 执行指南

## ⚠️ 重要提示

Supabase SQL Editor 对某些注释格式可能有问题。请使用 **`EXECUTE_THIS_CLEAN.sql`** 文件，这个文件已经移除了所有注释。

## 📋 执行步骤

### 方法 1: 使用清理后的 SQL 文件（推荐）

1. 打开 Supabase Dashboard: https://supabase.com/dashboard/project/tujfhzkxrckgkwsedlcu
2. 点击左侧菜单的 **SQL Editor**
3. 点击 **New Query**
4. 打开文件 `supabase/migrations/EXECUTE_THIS_CLEAN.sql`
5. **复制整个文件内容**（从第 1 行到文件结尾，共约 100 行）
6. 粘贴到 SQL Editor 中
7. 点击 **Run** 按钮（或按 `Cmd/Ctrl + Enter`）
8. 应该看到 "Success. No rows returned" 或类似的成功消息

### 方法 2: 分步执行（如果方法 1 失败）

如果一次性执行有问题，可以分步执行：

#### 步骤 1: 删除旧表
```sql
DROP TABLE IF EXISTS public.generated_names CASCADE;
DROP TABLE IF EXISTS public.generation_batches CASCADE;
DROP TABLE IF EXISTS public.name_generation_logs CASCADE;
DROP TABLE IF EXISTS public.saved_names CASCADE;
DROP TABLE IF EXISTS public.popular_names CASCADE;
DROP FUNCTION IF EXISTS public.update_popular_name_stats(text, text) CASCADE;
```

#### 步骤 2: 创建 projects 表
```sql
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
```

#### 步骤 3: 创建 steps 表
```sql
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
```

#### 步骤 4: 创建索引
```sql
CREATE INDEX projects_user_id_idx ON public.projects(user_id);
CREATE INDEX projects_status_idx ON public.projects(status);
CREATE INDEX projects_created_at_idx ON public.projects(created_at DESC);
CREATE INDEX steps_project_id_idx ON public.steps(project_id);
CREATE INDEX steps_step_order_idx ON public.steps(project_id, step_order);
```

#### 步骤 5: 创建触发器
```sql
CREATE TRIGGER handle_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
```

#### 步骤 6: 启用 RLS
```sql
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.steps ENABLE ROW LEVEL SECURITY;
```

#### 步骤 7: 创建 RLS 策略（一次性执行）
```sql
CREATE POLICY "Users can view their own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage all projects" ON public.projects FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Users can view steps of their own projects" ON public.steps FOR SELECT USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = steps.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can insert steps for their own projects" ON public.steps FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = steps.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update steps of their own projects" ON public.steps FOR UPDATE USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = steps.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete steps of their own projects" ON public.steps FOR DELETE USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = steps.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Service role can manage all steps" ON public.steps FOR ALL USING (auth.role() = 'service_role');
```

#### 步骤 8: 授予权限
```sql
GRANT ALL ON public.projects TO service_role;
GRANT ALL ON public.steps TO service_role;
```

## ✅ 验证执行结果

执行以下 SQL 验证表是否创建成功：

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('projects', 'steps');
```

应该返回 2 行：
- `projects`
- `steps`

## 🐛 常见错误

### 错误: "syntax error at or near "-""
- **原因**: SQL Editor 可能不支持某些注释格式
- **解决**: 使用 `EXECUTE_THIS_CLEAN.sql` 文件（已移除所有注释）

### 错误: "relation already exists"
- **原因**: 表已经存在
- **解决**: 先执行 DROP TABLE 语句，或忽略此错误继续

### 错误: "function does not exist"
- **原因**: `handle_updated_at()` 函数不存在
- **解决**: 这个函数应该在初始迁移中已创建，如果不存在，可以跳过触发器创建

## 📝 注意事项

1. **不要复制注释行**: 只复制 SQL 语句本身
2. **确保完整性**: 如果分步执行，确保所有步骤都执行完成
3. **检查错误**: 如果有错误，查看错误信息并相应调整
4. **备份数据**: 如果数据库中有重要数据，建议先备份

---

**推荐**: 使用 `EXECUTE_THIS_CLEAN.sql` 文件，它已经移除了所有可能导致问题的注释。

