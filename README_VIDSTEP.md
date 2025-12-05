# VidStep - 视频转图文工具

> Turn any video into a visual step-by-step guide in seconds.

VidStep 是一个基于 AI 的视频分析工具，可以自动从 YouTube 视频中提取关键步骤，生成包含截图和描述的图文指南。

## ✨ 功能特性

- 🎬 **YouTube 视频支持**: 直接输入 YouTube URL
- 🤖 **AI 智能分析**: 使用 Gemini 1.5 Pro 自动识别关键步骤
- 📸 **自动截图**: 在关键时间点自动提取高清截图
- 📝 **结构化输出**: 生成包含标题、描述和时间戳的步骤指南
- 📤 **多种导出**: 支持 Markdown 和 HTML 格式导出
- 💳 **积分系统**: 基于视频时长的灵活计费（10 credits/分钟）

## 🏗️ 技术栈

### 前端
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (认证和数据库)

### 后端
- **Next.js API Routes**
- **Supabase PostgreSQL**
- **Supabase Storage**

### Worker
- **Python 3.9+**
- **yt-dlp** (视频下载)
- **FFmpeg** (视频处理)
- **Gemini 1.5 Pro** (AI 分析)
- **Supabase Python Client**

## 📁 项目结构

```
raphael-starterkit-v1/
├── app/                    # Next.js 应用
│   ├── api/               # API 路由
│   │   └── projects/      # 项目相关 API
│   ├── guides/            # 结果页面
│   ├── dashboard/         # 用户仪表板
│   └── page.tsx           # 首页
├── components/            # React 组件
│   ├── product/generator/ # 视频输入表单
│   └── dashboard/        # Dashboard 组件
├── worker/               # Python Worker
│   ├── main.py           # Worker 主程序
│   ├── requirements.txt  # Python 依赖
│   └── .env              # Worker 环境变量
├── supabase/
│   └── migrations/       # 数据库迁移
└── .env.local            # 前端环境变量
```

## 🚀 快速开始

### 前置要求

- Node.js 18+
- Python 3.9+
- FFmpeg
- Supabase 账户
- Gemini API Key

### 安装步骤

1. **克隆仓库**
```bash
git clone <repository-url>
cd raphael-starterkit-v1
```

2. **安装前端依赖**
```bash
npm install
```

3. **安装 Worker 依赖**
```bash
cd worker
pip3 install -r requirements.txt
```

4. **安装 FFmpeg**
```bash
# macOS
brew install ffmpeg

# Ubuntu
sudo apt-get install ffmpeg
```

5. **配置环境变量**

创建 `.env.local` (前端):
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_key
```

创建 `worker/.env`:
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_key
STORAGE_BUCKET=guide_images
```

6. **数据库迁移**

在 Supabase SQL Editor 中执行 `supabase/migrations/EXECUTE_THIS.sql`

7. **创建 Storage Bucket**

在 Supabase Dashboard 中创建名为 `guide_images` 的公开 bucket

8. **启动应用**

前端:
```bash
npm run dev
```

Worker (新终端):
```bash
cd worker
python3 main.py
```

## 📖 使用指南

### 创建项目

1. 访问 http://localhost:3000
2. 登录账户
3. 输入 YouTube URL
4. 可选：输入项目标题
5. 点击 "Generate Guide"
6. 等待处理完成（2-5 分钟）

### 查看结果

- 在 Dashboard 查看所有项目
- 点击项目查看详细步骤
- 导出为 Markdown 或 HTML

### 导出指南

在项目详情页面：
- **Copy Markdown**: 复制 Markdown 格式到剪贴板
- **Download Markdown**: 下载 .md 文件
- **Download HTML**: 下载 .html 文件

## 🔧 开发

### 项目结构说明

- `app/api/projects/`: 项目相关 API
  - `create/route.ts`: 创建项目
  - `[id]/route.ts`: 获取/更新项目
  - `route.ts`: 获取用户所有项目

- `worker/main.py`: Python Worker 主程序
  - 轮询数据库查找待处理项目
  - 下载视频
  - AI 分析
  - 提取截图
  - 上传到 Storage

### 数据库 Schema

**projects 表**:
- `id`: UUID
- `user_id`: 用户 ID
- `title`: 项目标题
- `video_source_url`: 视频 URL
- `status`: pending/processing/completed/failed
- `credits_cost`: 积分消耗

**steps 表**:
- `id`: UUID
- `project_id`: 项目 ID
- `step_order`: 步骤顺序
- `title`: 步骤标题
- `description`: 步骤描述
- `timestamp_seconds`: 时间戳
- `image_path`: 图片路径

## 🐛 故障排除

### Worker 无法启动
- 检查 FFmpeg 是否安装: `ffmpeg -version`
- 检查 Python 依赖: `pip3 list`
- 检查环境变量: `cat worker/.env`

### 项目一直 pending
- 检查 Worker 是否运行
- 查看 Worker 日志
- 检查 Supabase 连接

### 图片无法显示
- 确认 Storage bucket 为 Public
- 检查 bucket 名称是否为 `guide_images`

## 📚 文档

- `QUICK_START.md` - 快速开始指南
- `SETUP_INSTRUCTIONS.md` - 详细设置说明
- `SETUP_STATUS.md` - 当前设置状态
- `VIDSTEP_MIGRATION.md` - 迁移文档
- `worker/README.md` - Worker 使用说明

## 🚢 部署

### 前端 (Vercel)

1. 连接 GitHub 仓库
2. 配置环境变量
3. 部署

### Worker (Railway/Fly.io)

1. 创建新项目
2. 设置工作目录为 `worker/`
3. 配置环境变量
4. 设置启动命令: `python3 main.py`

## 📝 许可证

[你的许可证]

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**开发完成**: 2025-01-01
**版本**: v1.0.0

