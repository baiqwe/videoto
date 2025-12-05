# VidStep Python Worker

这个 Python Worker 负责处理视频项目，包括下载、分析和截图。

## 功能

1. **视频下载**: 使用 `yt-dlp` 从 YouTube 下载视频
2. **AI 分析**: 使用 Gemini 1.5 Pro 分析视频并提取关键步骤
3. **截图提取**: 使用 FFmpeg 在指定时间戳提取高清截图
4. **存储上传**: 上传截图到 Supabase Storage
5. **状态更新**: 更新项目状态到数据库

## 安装

```bash
cd worker
pip install -r requirements.txt
```

## 配置

1. 复制 `.env.example` 为 `.env`:
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，填入你的配置：
```bash
SUPABASE_URL=https://tujfhzkxrckgkwsedlcu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
STORAGE_BUCKET=guide_images
```

## 运行

```bash
python main.py
```

Worker 会持续运行，每 5 秒检查一次是否有待处理的项目。

## 系统要求

- Python 3.8+
- FFmpeg (需要单独安装)
  - macOS: `brew install ffmpeg`
  - Ubuntu: `sudo apt-get install ffmpeg`
  - Windows: 从 [FFmpeg官网](https://ffmpeg.org/download.html) 下载

## 部署

### Railway

1. 创建新项目
2. 连接 GitHub 仓库
3. 设置环境变量
4. 设置启动命令: `cd worker && python main.py`

### Fly.io

1. 创建 `fly.toml` 配置文件
2. 设置环境变量
3. 部署: `flyctl deploy`

### AWS EC2

1. 创建 EC2 实例
2. 安装依赖: Python, FFmpeg, pip packages
3. 使用 systemd 或 supervisor 运行 worker
4. 配置环境变量

## 故障排除

### FFmpeg 未找到
确保 FFmpeg 已安装并在 PATH 中:
```bash
ffmpeg -version
```

### 视频下载失败
检查网络连接和 YouTube URL 是否有效。

### Gemini API 错误
检查 API key 是否正确，以及是否有足够的配额。

### Supabase 连接失败
检查 URL 和 Service Role Key 是否正确。

