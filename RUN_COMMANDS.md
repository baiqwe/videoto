# 运行命令参考

## ⚠️ 重要：必须在正确的目录下运行

所有命令都需要在项目根目录下运行：
```bash
cd /Users/fanqienigehamigua/Documents/vidstep/raphael-starterkit-v1
```

## 🚀 启动前端开发服务器

```bash
cd /Users/fanqienigehamigua/Documents/vidstep/raphael-starterkit-v1
npm run dev
```

**应该看到**:
```
✓ Ready in X seconds
○ Local: http://localhost:3000
```

## 🐍 启动 Python Worker

```bash
cd /Users/fanqienigehamigua/Documents/vidstep/raphael-starterkit-v1/worker
python3 main.py
```

**应该看到**:
```
🚀 VidStep Worker started
   Supabase URL: https://tujfhzkxrckgkwsedlcu.supabase.co
   Storage Bucket: guide_images
   Temp Directory: /tmp/vidstep_worker

Waiting for projects to process...
```

## 📋 常用命令

### 前端
```bash
# 进入项目目录
cd /Users/fanqienigehamigua/Documents/vidstep/raphael-starterkit-v1

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm run start

# 安装依赖
npm install
```

### Worker
```bash
# 进入 worker 目录
cd /Users/fanqienigehamigua/Documents/vidstep/raphael-starterkit-v1/worker

# 启动 worker
python3 main.py

# 安装 Python 依赖
pip3 install -r requirements.txt
```

## 🔍 检查当前目录

如果不确定在哪个目录，运行：
```bash
pwd
```

应该显示：
```
/Users/fanqienigehamigua/Documents/vidstep/raphael-starterkit-v1
```

## ⚠️ 常见错误

### 错误: "Missing script: 'dev'"

**原因**: 在错误的目录下运行命令

**解决**:
```bash
# 确保在项目根目录
cd /Users/fanqienigehamigua/Documents/vidstep/raphael-starterkit-v1
npm run dev
```

### 错误: "command not found: npm"

**原因**: Node.js 未安装或不在 PATH 中

**解决**:
```bash
# 检查 Node.js
node --version
npm --version

# 如果未安装，安装 Node.js
# macOS: brew install node
```

### 错误: "Port 3000 is already in use"

**原因**: 端口被占用

**解决**:
```bash
# 查找占用端口的进程
lsof -ti:3000

# 杀死进程（替换 PID）
kill -9 <PID>

# 或使用其他端口
PORT=3001 npm run dev
```

---

**提示**: 始终确保在正确的目录下运行命令！

