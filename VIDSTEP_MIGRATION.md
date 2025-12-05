# VidStep 迁移完成说明

本文档说明了从 Raphael Starter Kit (中文名字生成器) 到 VidStep (视频转图文工具) 的完整迁移。

## ✅ 已完成的更改

### 1. 数据库迁移

**文件**: `supabase/migrations/20250101000000_init_vidstep.sql`

- ✅ 删除了旧的表：`generated_names`, `generation_batches`, `name_generation_logs`, `saved_names`, `popular_names`
- ✅ 创建了新表：
  - `projects`: 存储视频处理任务
  - `steps`: 存储生成的步骤（包含截图路径）
- ✅ 保留了核心表：`customers`, `subscriptions`, `credits_history`, `ip_rate_limits`

**注意**: 运行迁移后，需要在 Supabase Storage 中创建一个名为 `guide_images` 的公开 bucket。

### 2. API 路由

**删除的 API**:
- ❌ `app/api/chinese-names/`
- ❌ `app/api/generation-batches/`
- ❌ `app/api/generation-history/`
- ❌ `app/api/saved-names/`

**新增的 API**:
- ✅ `app/api/projects/create/route.ts` - 创建新项目
- ✅ `app/api/projects/[id]/route.ts` - 获取/更新项目详情
- ✅ `app/api/projects/route.ts` - 获取用户的所有项目

### 3. 前端组件

**新增组件**:
- ✅ `components/product/generator/video-input-form.tsx` - 视频输入表单

**更新的组件**:
- ✅ `components/dashboard/my-projects-card.tsx` - 项目列表卡片（替换了 my-names-card）

### 4. 页面更新

**首页** (`app/page.tsx`):
- ✅ 完全重写，从名字生成器改为视频输入界面
- ✅ 集成了 `VideoInputForm` 组件
- ✅ 更新了所有文案和功能说明

**结果页面** (`app/guides/[id]/page.tsx`):
- ✅ 新建页面，显示项目状态和步骤列表
- ✅ 支持实时轮询更新状态
- ✅ 支持导出 Markdown 和 HTML

**Dashboard** (`app/dashboard/page.tsx`):
- ✅ 更新为显示项目列表
- ✅ 移除了名字相关的组件

### 5. 配置更新

**支付配置** (`config/subscriptions.ts`):
- ✅ 更新了 `CREDITS_TIERS`:
  - Basic: $9 for 50 Credits (~5 videos)
  - Pro: $29 for 200 Credits (~20 videos)

## 🚧 待完成的工作

### Python Worker (独立服务)

根据技术文档，需要创建一个独立的 Python Worker 来处理视频：

1. **功能需求**:
   - 监听 Supabase 数据库中的 `pending` 状态项目
   - 使用 `yt-dlp` 下载 YouTube 视频
   - 调用 Gemini 1.5 Pro API 分析视频并提取步骤
   - 使用 FFmpeg 在指定时间戳截图
   - 上传截图到 Supabase Storage
   - 更新项目状态为 `completed`

2. **部署建议**:
   - Railway / Fly.io / AWS EC2
   - 需要安装: Python, yt-dlp, ffmpeg, google-generativeai

3. **示例代码结构** (参考文档中的 Python 代码)

### 环境变量

确保以下环境变量已配置：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CREEM_API_KEY`
- `CREEM_WEBHOOK_SECRET`
- `CREEM_API_URL`
- `NEXT_PUBLIC_SITE_URL`

### Supabase Storage

1. 在 Supabase Dashboard 中创建 bucket: `guide_images`
2. 设置为公开访问（Public）
3. 配置存储策略

## 📝 使用说明

### 创建项目流程

1. 用户登录后访问首页
2. 输入 YouTube URL
3. 可选：输入项目标题
4. 点击 "Generate Guide" (消耗 10 credits)
5. 系统创建项目，状态为 `pending`
6. Python Worker 处理视频（异步）
7. 用户可以在 `/guides/[id]` 页面查看进度
8. 完成后显示步骤列表和截图

### 积分计算

- 默认：10 credits 每个视频
- 实际消耗会根据视频时长调整（10 credits/分钟，最少 10 credits）
- Worker 处理完成后会更新实际的 `credits_cost`

## 🔧 开发建议

1. **测试流程**:
   - 先测试 API 创建项目功能
   - 手动在数据库中插入测试数据验证前端显示
   - 开发 Python Worker 时先在本地测试

2. **错误处理**:
   - API 已包含基本的错误处理
   - Worker 需要处理视频下载失败、AI 分析失败等情况
   - 失败时更新项目状态为 `failed` 并记录错误信息

3. **性能优化**:
   - 考虑使用 Supabase Realtime 替代轮询
   - 图片压缩和优化
   - 缓存视频元数据

## 📚 相关文档

- [VidStep 产品需求文档](./VIDSTEP_PRD.md) (如果存在)
- [Raphael Starter Kit 原始文档](./README.md)
- [Supabase 文档](https://supabase.com/docs)
- [Creem.io 文档](https://creem.io/docs)

## ⚠️ 注意事项

1. **数据迁移**: 如果已有生产数据，需要先备份
2. **API 兼容性**: 旧的 API 路由已删除，确保没有其他地方引用
3. **产品 ID**: 更新 `config/subscriptions.ts` 中的 Creem 产品 ID
4. **Worker 部署**: Python Worker 需要独立部署，不能运行在 Vercel 上

---

**迁移完成日期**: 2025-01-01
**版本**: VidStep v1.0

