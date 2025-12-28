# 环境变量更新指南

## OpenRouter API Key

新的 API Key: `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`

---

## 1. 更新 Zeabur 环境变量

### 步骤：

1. **登录 Zeabur**
   - 访问: https://zeabur.com
   - 进入你的项目

2. **找到 Worker 服务**
   - 在项目列表中找到 worker 服务
   - 点击进入服务详情

3. **更新环境变量**
   - 点击 "Variables" 或"环境变量"标签
   - 找到或添加以下变量：

   ```bash
   OPENAI_API_KEY=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
   ```

   - 可以删除或保持以下变量（代码会自动使用默认值）：
   ```bash
   OPENAI_BASE_URL=https://openrouter.ai/api/v1  # 可选，代码有默认值
   ```

4. **保存并重启**
   - 点击"Save"保存
   - Zeabur 会自动重启服务

---

## 2. 更新 Vercel 环境变量

### 步骤：

1. **登录 Vercel**
   - 访问: https://vercel.com
   - 进入你的项目

2. **进入设置**
   - 点击项目顶部的 "Settings"

3. **找到环境变量**
   - 左侧菜单点击 "Environment Variables"

4. **添加/更新变量**
   
   添加以下环境变量：
   
   ```bash
   名称: OPENAI_API_KEY
   值: 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
   适用环境: ✓ Production ✓ Preview ✓ Development
   ```

   可选添加（如果需要自定义 API 地址）:
   ```bash
   名称: OPENAI_BASE_URL  
   值: https://openrouter.ai/api/v1
   适用环境: ✓ Production ✓ Preview ✓ Development  
   ```

5. **重新部署**
   - 回到 "Deployments" 页面
   - 点击最新部署旁的 "..." 按钮
   - 选择 "Redeploy"
   - 或直接推送新代码触发自动部署

---

## 3. 本地开发环境

更新 `.env.local` 文件：

```bash
# OpenRouter API
OPENAI_API_KEY=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
OPENAI_BASE_URL=https://openrouter.ai/api/v1  # 可选

# Supabase (保持不变)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_STORAGE_BUCKET=guide_images
```

---

## 4. 验证配置

### 本地验证：

```bash
cd worker
./venv/bin/python -c "
import os
from dotenv import load_dotenv
load_dotenv('../.env.local')

print('API Key:', os.getenv('OPENAI_API_KEY')[:20] + '...')
print('Base URL:', os.getenv('OPENAI_BASE_URL', 'https://openrouter.ai/api/v1'))
"
```

### 检查 Zeabur 日志：

部署后查看日志，应该看到：
```
🔌 Using OpenRouter API at https://openrouter.ai/api/v1
```

### 检查 Vercel 日志：

在 Vercel Functions 日志中，确认环境变量已加载。

---

## 重要说明

1. **不需要 YouTube Cookies** - 新版本完全跳过 YouTube 信息获取
2. **不需要字幕** - 使用纯 Vision Mode 分析视频
3. **OpenRouter 计费** - 按模型使用量计费，确保账户有余额
4. **模型优先级**:
   - `openai/gpt-4o` (最佳质量)
   - `openai/gpt-4o-mini` (备用，更快更便宜)
   - `anthropic/claude-3.5-sonnet` (第三备选)

---

## 故障排除

### 如果仍然报错：

1. **确认 API Key 正确**
   - 检查是否复制完整
   - 确认没有多余空格

2. **查看 OpenRouter 账户**
   - 访问: https://openrouter.ai
   - 检查余额和使用限制

3. **重启服务**
   - Zeabur: 重新部署
   - Vercel: Redeploy
   - 本地: 重启 worker 进程
