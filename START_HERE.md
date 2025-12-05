# 🚀 VidStep 启动指南

## ✅ 设置完成确认

恭喜！你已经完成了所有必要的设置：

- ✅ 数据库迁移已执行
- ✅ Storage bucket `guide_images` 已创建
- ✅ 环境变量已配置
- ✅ 依赖已安装

## 🎯 启动应用

### 步骤 1: 启动前端服务器

打开**终端 1**，运行：

```bash
cd /Users/fanqienigehamigua/Documents/vidstep/raphael-starterkit-v1
npm run dev
```

等待看到：
```
✓ Ready in X seconds
○ Local: http://localhost:3000
```

### 步骤 2: 启动 Python Worker

打开**终端 2**（新终端窗口），运行：

```bash
cd /Users/fanqienigehamigua/Documents/vidstep/raphael-starterkit-v1/worker
python3 main.py
```

你应该看到：
```
🚀 VidStep Worker started
   Supabase URL: https://tujfhzkxrckgkwsedlcu.supabase.co
   Storage Bucket: guide_images
   Temp Directory: /tmp/vidstep_worker

Waiting for projects to process...
```

**重要**: Worker 需要持续运行，不要关闭这个终端窗口。

### 步骤 3: 访问应用

在浏览器中打开: **http://localhost:3000**

## 🧪 测试流程

### 1. 注册/登录账户

- 如果还没有账户，点击 "Sign Up" 注册
- 如果已有账户，点击 "Sign In" 登录

### 2. 创建第一个项目

1. 在首页输入一个 YouTube URL（例如：`https://www.youtube.com/watch?v=dQw4w9WgXcQ`）
2. 可选：输入项目标题
3. 点击 "Generate Guide (10 Credits)"
4. 系统会扣除 10 credits（如果余额不足，需要先购买 credits）

### 3. 查看处理状态

- 创建项目后，会自动跳转到项目详情页面
- 页面会显示 "Processing Video" 状态
- 页面每 5 秒自动刷新状态

### 4. 查看结果

- 处理完成后（通常 2-5 分钟），页面会显示：
  - 步骤列表
  - 每个步骤的截图
  - 步骤描述和时间戳
- 可以导出为 Markdown 或 HTML

## 📊 监控 Worker

在 Worker 终端中，你会看到处理日志：

```
Processing project: <project-id>
Video URL: https://www.youtube.com/watch?v=...
Downloading video from: ...
Analyzing video with Gemini AI...
Extracting screenshot at 00:05...
Uploading screenshot_5.jpg to Supabase Storage...
✅ Project <project-id> completed successfully!
   Steps created: 5
   Credits cost: 10
```

## ⚠️ 常见问题

### Worker 报错 "FFmpeg not found"

```bash
brew install ffmpeg
```

然后重启 Worker。

### 项目一直显示 "pending"

- 检查 Worker 是否正在运行
- 查看 Worker 终端中的错误信息
- 检查 `worker/.env` 文件配置是否正确

### 前端无法连接

- 确认前端服务器正在运行（终端 1）
- 检查浏览器控制台是否有错误
- 确认 `.env.local` 文件存在且配置正确

### 图片无法显示

- 确认 Storage bucket `guide_images` 设置为 **Public**
- 检查 Worker 日志中是否有上传错误

## 🎉 成功标志

当你看到以下内容时，说明一切正常：

1. **前端**: 可以访问 http://localhost:3000 并看到首页
2. **Worker**: 终端显示 "Waiting for projects to process..."
3. **创建项目**: 可以成功创建项目并看到 "pending" 状态
4. **处理完成**: 项目状态变为 "completed"，显示步骤和截图

## 📝 下一步

- 尝试处理不同的 YouTube 视频
- 测试导出功能（Markdown/HTML）
- 查看 Dashboard 中的项目列表
- 根据需要调整积分套餐配置

---

**提示**: 如果遇到任何问题，检查：
1. Worker 终端日志
2. 浏览器控制台（F12）
3. Supabase Dashboard 中的项目数据

祝使用愉快！🎬

