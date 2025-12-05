# VidStep 快速开始指南

## ✅ 已完成的配置

1. ✅ 环境变量文件已创建 (`.env.local` 和 `worker/.env`)
2. ✅ SQL 迁移文件已准备 (`supabase/migrations/EXECUTE_THIS.sql`)

## 📋 接下来需要手动完成的步骤

### 步骤 1: 执行数据库迁移（重要！）

1. 打开 Supabase Dashboard: https://supabase.com/dashboard/project/tujfhzkxrckgkwsedlcu
2. 点击左侧菜单的 **SQL Editor**
3. 点击 **New Query**
4. 打开文件 `supabase/migrations/EXECUTE_THIS.sql`
5. **复制整个文件内容**（从第 1 行到第 126 行）
6. 粘贴到 SQL Editor 中
7. 点击 **Run** 按钮（或按 `Cmd/Ctrl + Enter`）
8. 应该看到 "Success. No rows returned" 或类似的成功消息

### 步骤 2: 创建 Storage Bucket（重要！）

1. 在 Supabase Dashboard 中，点击左侧菜单的 **Storage**
2. 点击 **New bucket** 按钮
3. 填写信息：
   - **Name**: `guide_images` （必须完全一致）
   - **Public bucket**: ✅ **必须勾选**（这样前端才能访问图片）
   - 其他选项可以保持默认
4. 点击 **Create bucket**

### 步骤 3: 安装依赖

**前端依赖**:
```bash
cd /Users/fanqienigehamigua/Documents/vidstep/raphael-starterkit-v1
npm install
```

**Python Worker 依赖**:
```bash
cd worker
pip3 install -r requirements.txt
```

**系统依赖 (FFmpeg)**:
```bash
# macOS
brew install ffmpeg

# 验证安装
ffmpeg -version
```

### 步骤 4: 启动应用

**终端 1 - 启动前端**:
```bash
cd /Users/fanqienigehamigua/Documents/vidstep/raphael-starterkit-v1
npm run dev
```

**终端 2 - 启动 Worker**:
```bash
cd /Users/fanqienigehamigua/Documents/vidstep/raphael-starterkit-v1/worker
python3 main.py
```

## 🎯 验证设置

### 验证数据库表

在 Supabase SQL Editor 中执行：
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('projects', 'steps');
```

应该返回 2 行。

### 验证 Storage Bucket

在 Supabase Dashboard 的 Storage 页面，应该能看到 `guide_images` bucket，并且显示为 **Public**。

### 验证环境变量

检查文件是否存在：
```bash
# 前端环境变量
ls -la .env.local

# Worker 环境变量
ls -la worker/.env
```

## 🚀 开始使用

1. 访问 http://localhost:3000
2. 注册/登录账户
3. 输入 YouTube URL（例如：`https://www.youtube.com/watch?v=dQw4w9WgXcQ`）
4. 点击 "Generate Guide"
5. 等待 Worker 处理（通常需要 2-5 分钟）
6. 在项目页面查看结果

## ⚠️ 常见问题

### Worker 报错 "FFmpeg not found"
```bash
# macOS
brew install ffmpeg

# 验证
which ffmpeg
```

### Worker 报错 "Module not found"
```bash
cd worker
pip3 install -r requirements.txt
```

### 前端无法显示图片
- 检查 Storage bucket 是否设置为 **Public**
- 检查 bucket 名称是否为 `guide_images`（完全一致）

### 项目一直显示 "pending"
- 检查 Worker 是否正在运行
- 检查 Worker 日志是否有错误
- 检查 `.env` 文件中的配置是否正确

## 📝 下一步

- 查看 `SETUP_INSTRUCTIONS.md` 获取详细说明
- 查看 `VIDSTEP_MIGRATION.md` 了解迁移详情
- 查看 `worker/README.md` 了解 Worker 部署

---

**提示**: 如果遇到问题，检查：
1. Supabase 连接是否正常
2. 环境变量是否正确配置
3. Worker 日志中的错误信息

