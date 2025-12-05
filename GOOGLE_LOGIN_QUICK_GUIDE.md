# Google 登录快速配置指南

## 🎯 快速步骤

### 1. Google Cloud Console（5分钟）

1. 访问 https://console.cloud.google.com/
2. 创建项目或选择现有项目
3. **API 和服务** > **OAuth 同意屏幕** > 选择"外部" > 填写基本信息 > 保存
4. **API 和服务** > **凭据** > **创建凭据** > **OAuth 客户端 ID**
5. 应用类型：**Web 应用**
6. 授权重定向 URI：添加
   ```
   https://tujfhzkxrckgkwsedlcu.supabase.co/auth/v1/callback
   ```
7. 创建后，**立即复制**：
   - ✅ 客户端 ID
   - ✅ 客户端密钥（只显示一次！）

### 2. Supabase Dashboard（2分钟）

1. 访问 https://supabase.com/dashboard/project/tujfhzkxrckgkwsedlcu
2. **Authentication** > **Providers** > **Google**
3. 启用开关
4. 粘贴：
   - Client ID（从 Google Cloud Console）
   - Client Secret（从 Google Cloud Console）
5. 点击 **Save**

### 3. 配置重定向 URL（1分钟）

1. **Authentication** > **URL Configuration**
2. 添加重定向 URL：
   ```
   http://localhost:3000/auth/callback
   ```
3. 点击 **Save**

### 4. 恢复前端代码（1分钟）

运行以下命令恢复 Google 登录按钮：

```bash
cd /Users/fanqienigehamigua/Documents/vidstep/raphael-starterkit-v1
# 取消注释登录和注册页面中的 Google 登录代码
```

或者手动编辑：
- `app/(auth-pages)/sign-in/page.tsx` - 删除第 92 行的 `{/*` 和第 130 行的 `*/}`
- `app/(auth-pages)/sign-up/page.tsx` - 同样操作

### 5. 测试

1. 重启开发服务器：`npm run dev`
2. 访问 http://localhost:3000/sign-in
3. 点击 "Sign in with Google"
4. 应该能正常跳转到 Google 登录页面

---

## 📋 重要信息

### 你的 Supabase 项目信息
- **项目 URL**: `https://tujfhzkxrckgkwsedlcu.supabase.co`
- **重定向 URI**: `https://tujfhzkxrckgkwsedlcu.supabase.co/auth/v1/callback`

### 本地开发重定向 URL
- `http://localhost:3000/auth/callback`

---

## ⚠️ 常见错误

| 错误 | 原因 | 解决 |
|------|------|------|
| `redirect_uri_mismatch` | URI 不匹配 | 检查 Google Cloud Console 和 Supabase 中的 URI 是否完全一致 |
| `invalid_client` | 客户端 ID/密钥错误 | 重新复制并粘贴，确保没有空格 |
| 按钮点击无反应 | 代码未恢复 | 取消注释前端代码并重启服务器 |

---

## 📚 详细文档

查看 `ENABLE_GOOGLE_LOGIN.md` 获取完整详细步骤。

---

**总耗时**: 约 10 分钟
**难度**: ⭐⭐☆☆☆（简单）

