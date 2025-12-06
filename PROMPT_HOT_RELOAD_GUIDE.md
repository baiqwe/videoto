# Prompt 热更新功能使用指南

## 功能说明

现在 VidStep Worker 支持从 Supabase 数据库动态加载 Prompt，无需重启 Worker 或重新部署代码即可更新 Prompt。

## 步骤 1: 执行数据库迁移

在 Supabase SQL Editor 中执行以下迁移文件：

**文件路径**: `supabase/migrations/20250102000000_add_system_prompts.sql`

这个迁移会：
- 创建 `system_prompts` 表
- 设置 RLS 策略（允许 Service Role 管理，允许所有用户读取）
- 插入默认的 Prompt
- 创建自动更新 `updated_at` 的触发器

## 步骤 2: 验证迁移

执行以下 SQL 查询验证表已创建：

```sql
SELECT key, description, is_active, updated_at 
FROM public.system_prompts;
```

应该能看到一条 `default_analysis_prompt` 记录。

## 步骤 3: 修改 Prompt（热更新）

### 方法 1: 在 Supabase Dashboard 中修改

1. 打开 Supabase Dashboard
2. 进入 **Table Editor** → `system_prompts`
3. 找到 `default_analysis_prompt` 记录
4. 点击编辑，修改 `content` 字段
5. 保存

**下次 Worker 处理新任务时，会自动使用新的 Prompt！**

### 方法 2: 使用 SQL 更新

```sql
UPDATE public.system_prompts
SET 
    content = '你的新 Prompt 内容...',
    description = '更新说明',
    updated_at = now()
WHERE key = 'default_analysis_prompt';
```

## 步骤 4: 创建多个 Prompt 版本

你可以创建多个 Prompt 用于不同场景：

```sql
INSERT INTO public.system_prompts (key, content, description)
VALUES (
    'tutorial_optimized_prompt',
    '针对教程类视频优化的 Prompt...',
    '专门用于软件教程、操作指南类视频'
);

INSERT INTO public.system_prompts (key, content, description)
VALUES (
    'gaming_optimized_prompt',
    '针对游戏视频优化的 Prompt...',
    '专门用于游戏攻略、Boss 战等视频'
);
```

然后在 `worker/main.py` 中修改 `get_system_prompt()` 的调用，传入不同的 `prompt_key`。

## Prompt 模板变量

Prompt 模板支持以下变量（使用 `{variable_name}` 格式）：

- `{video_url}` - 视频 URL
- `{duration_formatted}` - 格式化的时长（如 "05:30"）
- `{duration_seconds}` - 时长（秒数，浮点数）

**重要提示**：
- JSON 示例中的大括号使用双大括号 `{{ }}`，这样不会被 Python 的 `format()` 误解析
- 例如：`{{"key": "value"}}` 在格式化后会变成 `{"key": "value"}`

## 工作原理

1. Worker 每次处理视频时，会调用 `get_system_prompt('default_analysis_prompt')`
2. 函数尝试从 Supabase 数据库读取最新的 Prompt
3. 如果读取成功，使用数据库中的 Prompt
4. 如果读取失败（表不存在、网络问题等），使用硬编码的默认 Prompt 作为后备
5. Prompt 会被格式化，注入视频 URL、时长等变量
6. 格式化后的 Prompt 发送给 Gemini AI

## 调试提示

### 查看 Worker 日志

Worker 启动时会显示：
- `✅ Loaded dynamic prompt from DB: default_analysis_prompt` - 成功从数据库加载
- `⚠️ Failed to load prompt from DB (key: default_analysis_prompt), using default. Error: ...` - 使用默认 Prompt

### 测试 Prompt 更新

1. 修改数据库中的 Prompt
2. 创建一个新的视频项目（或等待 Worker 处理下一个 pending 项目）
3. 查看 Worker 日志，确认使用了新的 Prompt

## 最佳实践

1. **保留默认 Prompt**: 始终保留一个可用的默认 Prompt，作为后备方案
2. **版本控制**: 在 `description` 字段中记录 Prompt 的版本和修改原因
3. **测试新 Prompt**: 先用一个测试视频验证新 Prompt 的效果
4. **备份**: 修改前先备份当前的 Prompt 内容
5. **逐步优化**: 根据实际效果逐步调整 Prompt，而不是一次性大幅修改

## 故障排除

### 问题：Worker 仍然使用旧的 Prompt

**解决方案**:
- 确认数据库中的 `is_active` 字段为 `true`
- 检查 Worker 日志，看是否有错误信息
- 确认 Worker 有权限访问 `system_prompts` 表（需要 Service Role Key）

### 问题：Prompt 格式化错误

**解决方案**:
- 检查 Prompt 中的变量占位符是否正确（`{video_url}`, `{duration_formatted}`, `{duration_seconds}`）
- 确保 JSON 示例使用双大括号 `{{ }}`
- 查看 Worker 日志中的错误信息

### 问题：无法连接到数据库

**解决方案**:
- 检查 `SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY` 环境变量
- 确认 Worker 的网络连接正常
- Worker 会自动回退到硬编码的默认 Prompt

