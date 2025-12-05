# VidStep 设置步骤

## ✅ 步骤 1: 执行数据库迁移

1. 打开 Supabase Dashboard: https://supabase.com/dashboard
2. 选择你的项目
3. 进入 **SQL Editor**
4. 点击 **New Query**
5. 打开文件 `supabase/migrations/EXECUTE_THIS.sql`
6. **复制整个文件内容**（从 `-- VidStep Migration` 开始到文件结尾）
7. 粘贴到 SQL Editor
8. 点击 **Run** 或按 `Cmd/Ctrl + Enter`
9. 应该看到 "Success. No rows returned"

## ✅ 步骤 2: 创建 Storage Bucket

由于无法直接通过 API 创建 Storage bucket，请手动操作：

1. 在 Supabase Dashboard 中，点击左侧菜单的 **Storage**
2. 点击 **New bucket**
3. 填写信息：
   - **Name**: `guide_images`
   - **Public bucket**: ✅ **勾选**（重要！）
   - **File size limit**: 可以留空或设置（如 10MB）
   - **Allowed MIME types**: 可以留空或设置为 `image/jpeg,image/png`
4. 点击 **Create bucket**

### 设置 Bucket 策略（可选但推荐）

1. 在 Storage 页面，点击 `guide_images` bucket
2. 进入 **Policies** 标签
3. 创建新策略：

**策略名称**: `Public read access`
**策略定义**:
```sql
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'guide_images');
```

## ✅ 步骤 3: 验证设置

### 验证表是否创建成功

在 SQL Editor 中执行：
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('projects', 'steps');
```

应该返回 2 行：`projects` 和 `steps`

### 验证 Bucket 是否存在

在 Storage 页面，应该能看到 `guide_images` bucket

## ✅ 步骤 4: 配置环境变量

在项目根目录创建 `.env.local` 文件（如果还没有）：

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tujfhzkxrckgkwsedlcu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1amZoemt4cmNrZ2t3c2VkbGN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3Njg4OTIsImV4cCI6MjA4MDM0NDg5Mn0.qNU0WBUfvIqKtf8Ue4pOvZ2hfHiJQZ5-lj04-kUdThk
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1amZoemt4cmNrZ2t3c2VkbGN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDc2ODg5MiwiZXhwIjoyMDgwMzQ0ODkyfQ.8l9jUSuXLfje2-fFZKxACu8j60mjh4DfWJGLrAx1EpU

# Gemini API Configuration
GEMINI_API_KEY=AIzaSyD1aTF390stpgi4p17LMOi6cX20tC2su6c

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Creem Configuration (update these with your actual values)
CREEM_API_KEY=your_creem_api_key_here
CREEM_WEBHOOK_SECRET=your_creem_webhook_secret_here
CREEM_API_URL=https://test-api.creem.io/v1

# Payment Success Redirect URL
CREEM_SUCCESS_URL=http://localhost:3000/dashboard
```

## ✅ 步骤 5: 安装依赖

```bash
# 安装 Next.js 依赖
npm install

# 安装 Python Worker 依赖
cd worker
pip install -r requirements.txt
```

## ✅ 步骤 6: 配置 Worker

在 `worker/` 目录创建 `.env` 文件：

```bash
cd worker
cat > .env << EOF
SUPABASE_URL=https://tujfhzkxrckgkwsedlcu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1amZoemt4cmNrZ2t3c2VkbGN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDc2ODg5MiwiZXhwIjoyMDgwMzQ0ODkyfQ.8l9jUSuXLfje2-fFZKxACu8j60mjh4DfWJGLrAx1EpU
GEMINI_API_KEY=AIzaSyD1aTF390stpgi4p17LMOi6cX20tC2su6c
STORAGE_BUCKET=guide_images
EOF
```

## ✅ 步骤 7: 启动应用

### 启动前端（终端 1）
```bash
npm run dev
```

### 启动 Worker（终端 2）
```bash
cd worker
python main.py
```

## 🎉 完成！

现在你可以：
1. 访问 http://localhost:3000
2. 登录账户
3. 输入 YouTube URL 创建项目
4. Worker 会自动处理视频

## ⚠️ 注意事项

1. **FFmpeg 必须安装**: Worker 需要 FFmpeg 来处理视频
   - macOS: `brew install ffmpeg`
   - Ubuntu: `sudo apt-get install ffmpeg`

2. **Worker 需要持续运行**: 确保 Worker 进程一直运行，否则项目不会被处理

3. **Storage Bucket 必须是公开的**: 否则前端无法显示图片

