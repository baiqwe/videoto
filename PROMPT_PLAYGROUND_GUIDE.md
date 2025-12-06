# Prompt Playground 使用指南

## 功能概述

Prompt Playground 是一个实时 Prompt 调试工具，允许你在网页上直接编辑 AI 系统 Prompt，无需重启 Worker 或重新部署代码。修改后立即生效，实现真正的"热更新"。

## 快速开始

### 步骤 1: 执行数据库迁移

在 Supabase SQL Editor 中执行以下迁移文件：

**文件路径**: `supabase/migrations/20250102000001_add_system_configs.sql`

这个迁移会：
- 创建 `system_configs` 表
- 设置 RLS 策略（允许所有用户读取，认证用户可更新）
- 插入默认的 Prompt 配置
- 创建自动更新 `updated_at` 的触发器

### 步骤 2: 访问 Prompt Playground

1. 登录到 VidStep Dashboard
2. 在 **Account Details** 部分，点击 **🎨 AI Prompt Playground** 按钮
3. 或者直接访问：`http://localhost:3000/dashboard/prompt`

### 步骤 3: 编辑 Prompt

1. 在文本编辑器中修改 Prompt 内容
2. 可以编辑描述（可选）
3. 点击 **Save & Update Live Prompt** 保存
4. 下次 Worker 处理视频时，会自动使用新的 Prompt

## Prompt 变量占位符

在 Prompt 中可以使用以下变量：

- `{video_url}` - 视频的 URL
- `{duration_formatted}` - 格式化的时长（如 "05:30"）
- `{duration_seconds:.1f}` - 时长（秒数，保留一位小数）
- `{duration_seconds}` - 时长（秒数）

**重要提示**：
- JSON 示例中的大括号使用双大括号 `{{ }}`，这样不会被 Python 的字符串替换误解析
- 例如：`{{"key": "value"}}` 在替换变量后会变成 `{"key": "value"}`

## 工作原理

1. **前端编辑**: 在网页上编辑 Prompt，保存到 `system_configs` 表
2. **Worker 加载**: Python Worker 每次处理视频时，从数据库读取最新的 Prompt
3. **变量注入**: Worker 将 Prompt 中的占位符替换为实际值
4. **自动回退**: 如果数据库不可用，Worker 使用硬编码的默认 Prompt

## 使用示例

### 示例 1: 修改 Prompt 风格

假设你想让 AI 生成更简洁的内容：

1. 打开 Prompt Playground
2. 找到 Guidelines 部分
3. 修改第 3 条：`"Each section should have substantial content (2-4 sentences minimum)"`
   改为：`"Each section should be concise (1-2 sentences)"`
4. 保存
5. 创建新的视频项目，查看效果

### 示例 2: 调整截图策略

如果你想更频繁地截图：

1. 修改 Guidelines 第 4 条，添加更多需要截图的情况
2. 保存
3. 下次处理视频时，会有更多步骤包含截图

### 示例 3: 针对特定视频类型优化

你可以创建多个 Prompt 版本：

```sql
-- 在 Supabase SQL Editor 中执行
INSERT INTO public.system_configs (key, value, description)
VALUES (
    'gemini_video_prompt_tutorial',
    '你的教程类视频专用 Prompt...',
    'Optimized for tutorial videos'
);
```

然后在 `worker/main.py` 中修改 `get_dynamic_prompt()` 的调用，传入不同的 key。

## 最佳实践

1. **备份 Prompt**: 修改前先复制当前 Prompt 内容
2. **逐步测试**: 每次只修改一小部分，测试效果后再继续
3. **记录变更**: 在描述字段中记录修改原因和日期
4. **版本控制**: 可以考虑在描述中记录版本号，如 "v1.2 - Added screenshot guidelines"

## 故障排除

### 问题：保存后没有生效

**检查清单**：
- 确认保存成功（看到成功提示）
- 检查 Worker 日志，应该看到：`✨ Loaded dynamic prompt from DB: gemini_video_prompt`
- 确认创建的是**新**的视频项目（Worker 在处理时才会加载 Prompt）

### 问题：看到 "Failed to load dynamic prompt"

**可能原因**：
- 数据库连接问题
- RLS 策略配置错误
- `system_configs` 表中没有 `gemini_video_prompt` 记录

**解决方案**：
- 检查 Worker 的 `SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY` 环境变量
- 在 Supabase SQL Editor 中执行迁移文件
- 检查 RLS 策略是否正确设置

### 问题：Prompt 格式化错误

**症状**: Worker 日志显示格式错误

**解决方案**：
- 检查 Prompt 中的变量占位符是否正确（`{video_url}`, `{duration_formatted}` 等）
- 确保 JSON 示例使用双大括号 `{{ }}`
- 查看 Worker 日志中的具体错误信息

## 技术细节

### 数据库表结构

```sql
CREATE TABLE public.system_configs (
    key text PRIMARY KEY,           -- 配置键名
    value text NOT NULL,            -- 配置值（Prompt 内容）
    description text,               -- 描述
    updated_at timestamptz DEFAULT now()  -- 更新时间
);
```

### Worker 代码流程

```python
# 1. 定义默认 Prompt（后备）
default_prompt = "..."

# 2. 从数据库获取最新 Prompt
prompt_template = get_dynamic_prompt(default_prompt, 'gemini_video_prompt')

# 3. 替换变量
prompt = prompt_template.replace('{video_url}', video_url)
prompt = prompt_template.replace('{duration_formatted}', format_time(duration))
# ...

# 4. 发送给 Gemini
response = model.generate_content([prompt, video_file])
```

## 安全注意事项

1. **RLS 策略**: 当前配置允许所有认证用户更新 Prompt。生产环境建议：
   - 只允许特定管理员角色更新
   - 或者通过 API 路由进行权限控制

2. **Prompt 注入**: 确保 Prompt 内容不包含恶意代码（虽然 Worker 只是字符串替换，但仍需注意）

3. **版本控制**: 考虑添加 Prompt 历史记录表，记录每次修改

## 下一步

- [ ] 添加 Prompt 版本历史功能
- [ ] 支持多个 Prompt 模板（针对不同视频类型）
- [ ] 添加 Prompt 测试功能（不实际处理视频，只测试 Prompt 效果）
- [ ] 添加 Prompt 模板库（预设的优化 Prompt）

