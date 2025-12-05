# 修复 Google 登录回调 Loading 问题

## 问题描述

在 Google 授权页面点击"继续"后，页面一直 loading，无法完成登录。

## 可能的原因

1. **Supabase 重定向 URL 配置不正确**
2. **回调路由处理有问题**
3. **环境变量配置错误**

## 解决方案

### 步骤 1: 检查 Supabase 重定向 URL 配置

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard/project/tujfhzkxrckgkwsedlcu)
2. 进入 **Authentication** > **URL Configuration**
3. 确保 **Redirect URLs** 中包含：
   ```
   http://localhost:3000/auth/callback
   ```
4. 如果不存在，点击 **"+ Add URL"** 添加
5. 点击 **Save**

### 步骤 2: 检查环境变量

确保 `.env.local` 文件中的 `NEXT_PUBLIC_SITE_URL` 正确：

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**重要**: 不要使用 `https://`，本地开发使用 `http://`

### 步骤 3: 检查 Google Cloud Console 重定向 URI

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 进入 **API 和服务** > **凭据**
3. 找到你的 OAuth 2.0 客户端 ID
4. 点击编辑
5. 确保 **授权重定向 URI** 中包含：
   ```
   https://tujfhzkxrckgkwsedlcu.supabase.co/auth/v1/callback
   ```
6. 保存更改

### 步骤 4: 重启开发服务器

```bash
# 停止当前服务器 (Ctrl+C)
# 重新启动
npm run dev
```

### 步骤 5: 清除浏览器缓存

1. 打开浏览器开发者工具 (F12)
2. 右键点击刷新按钮
3. 选择 **"清空缓存并硬性重新加载"**

### 步骤 6: 检查浏览器控制台

1. 打开浏览器开发者工具 (F12)
2. 切换到 **Console** 标签
3. 查看是否有错误信息
4. 切换到 **Network** 标签
5. 查看 `/auth/callback` 请求的状态

## 已修复的代码

我已经更新了 `app/auth/callback/route.ts`，添加了：
- ✅ 错误处理
- ✅ 调试日志
- ✅ 更好的错误重定向

## 验证步骤

1. 清除浏览器缓存
2. 访问 http://localhost:3000/sign-in
3. 点击 "Sign in with Google"
4. 在 Google 授权页面点击"继续"
5. 应该能正常重定向到 Dashboard

## 如果仍然有问题

### 检查浏览器网络请求

1. 打开开发者工具 (F12)
2. 切换到 **Network** 标签
3. 点击 Google 登录
4. 查看 `/auth/callback` 请求：
   - 状态码应该是 `307` 或 `302`（重定向）
   - 如果状态码是 `500` 或 `400`，查看响应内容

### 检查服务器日志

查看终端中开发服务器的输出，看是否有错误信息。

### 手动测试回调 URL

在浏览器中直接访问（替换 `CODE` 为实际的 code）：
```
http://localhost:3000/auth/callback?code=CODE
```

如果这个 URL 能正常工作，说明回调路由没问题，问题可能在 OAuth 流程的其他部分。

## 常见错误

### 错误: "redirect_uri_mismatch"

**原因**: Google Cloud Console 中的重定向 URI 与 Supabase 配置不匹配

**解决**: 
- 确保 Google Cloud Console 中的 URI 是: `https://tujfhzkxrckgkwsedlcu.supabase.co/auth/v1/callback`
- 确保 Supabase 中的 URI 是: `http://localhost:3000/auth/callback`

### 错误: "No authorization code provided"

**原因**: Google 没有正确返回授权码

**解决**: 
- 检查 Google Cloud Console 配置
- 确保 OAuth 同意屏幕已配置完成

### 页面一直 Loading

**原因**: 可能是网络问题或回调处理超时

**解决**:
- 检查网络连接
- 查看浏览器控制台错误
- 尝试使用无痕模式

---

**提示**: 如果问题持续，查看浏览器控制台和服务器日志中的具体错误信息。

