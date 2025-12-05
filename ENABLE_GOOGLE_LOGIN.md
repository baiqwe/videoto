# 在 Supabase 中启用 Google 登录 - 详细步骤

## 📋 完整流程概览

1. 在 Google Cloud Console 创建 OAuth 2.0 凭据
2. 在 Supabase Dashboard 中配置 Google 提供商
3. 设置重定向 URL
4. 恢复前端代码中的 Google 登录按钮

---

## 步骤 1: 在 Google Cloud Console 创建 OAuth 凭据

### 1.1 访问 Google Cloud Console

1. 打开 [Google Cloud Console](https://console.cloud.google.com/)
2. 使用你的 Google 账户登录

### 1.2 创建或选择项目

1. 点击顶部项目选择器
2. 点击 **"新建项目"** 或选择现有项目
3. 如果创建新项目：
   - 项目名称：例如 "VidStep"
   - 点击 **"创建"**
   - 等待项目创建完成（可能需要几秒钟）

### 1.3 配置 OAuth 同意屏幕

1. 在左侧菜单中，进入 **"API 和服务"** > **"OAuth 同意屏幕"**
2. 选择用户类型：
   - **外部**（推荐，适合大多数应用）
   - 点击 **"创建"**
3. 填写应用信息：
   - **应用名称**: VidStep（或你喜欢的名称）
   - **用户支持电子邮件**: 选择你的邮箱
   - **开发者联系信息**: 输入你的邮箱
   - 点击 **"保存并继续"**
4. 作用域（Scopes）：
   - 默认作用域通常足够，直接点击 **"保存并继续"**
5. 测试用户（如果选择"外部"）：
   - 可以暂时跳过，点击 **"保存并继续"**
   - 然后点击 **"返回到信息中心"**

### 1.4 创建 OAuth 2.0 客户端 ID

1. 在左侧菜单中，进入 **"API 和服务"** > **"凭据"**
2. 点击顶部 **"+ 创建凭据"** > **"OAuth 客户端 ID"**
3. 如果提示配置同意屏幕，按照上面的步骤完成
4. 选择应用类型：
   - **应用类型**: 选择 **"Web 应用"**
5. 填写名称：
   - **名称**: VidStep Web Client（或你喜欢的名称）
6. 添加授权重定向 URI：
   - 点击 **"+ 添加 URI"**
   - 输入以下 URI（**重要：必须完全一致**）：
     ```
     https://tujfhzkxrckgkwsedlcu.supabase.co/auth/v1/callback
     ```
   - 如果将来要部署到生产环境，也需要添加生产环境的 URL：
     ```
     https://your-domain.com/auth/callback
     ```
7. 点击 **"创建"**
8. **重要**: 复制以下信息（稍后需要）：
   - **客户端 ID**（Client ID）- 类似：`123456789-abcdefg.apps.googleusercontent.com`
   - **客户端密钥**（Client Secret）- 类似：`GOCSPX-xxxxxxxxxxxxx`
   - ⚠️ **客户端密钥只显示一次**，请立即保存！

---

## 步骤 2: 在 Supabase Dashboard 中配置 Google 提供商

### 2.1 登录 Supabase Dashboard

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目：**tujfhzkxrckgkwsedlcu**

### 2.2 进入认证设置

1. 在左侧菜单中，点击 **"Authentication"**（认证）
2. 点击 **"Providers"**（提供商）标签

### 2.3 启用 Google 提供商

1. 在提供商列表中，找到 **"Google"**
2. 点击 **"Google"** 卡片或开关
3. 在配置页面中：
   - **Enable Google Sign In**: 打开开关（Toggle ON）
   - **Client ID (for OAuth)**: 粘贴从 Google Cloud Console 复制的**客户端 ID**
   - **Client Secret (for OAuth)**: 粘贴从 Google Cloud Console 复制的**客户端密钥**
4. 点击 **"Save"**（保存）

### 2.4 配置重定向 URL

1. 在 **"Authentication"** 页面，点击 **"URL Configuration"** 标签
2. 在 **"Redirect URLs"** 部分：
   - 点击 **"+ Add URL"**
   - 添加以下 URL：
     ```
     http://localhost:3000/auth/callback
     ```
   - 如果将来要部署，也添加生产环境 URL：
     ```
     https://your-domain.com/auth/callback
     ```
3. 点击 **"Save"**（保存）

---

## 步骤 3: 恢复前端代码中的 Google 登录按钮

### 3.1 恢复登录页面

编辑 `app/(auth-pages)/sign-in/page.tsx`，找到被注释的 Google 登录代码，取消注释：

```tsx
// 删除注释标记，恢复代码
<div className="relative">
  <div className="absolute inset-0 flex items-center">
    <span className="w-full border-t" />
  </div>
  <div className="relative flex justify-center text-xs uppercase">
    <span className="bg-background px-2 text-muted-foreground">
      Or continue with
    </span>
  </div>
</div>
<form action={signInWithGoogle}>
  <Button
    type="submit"
    variant="outline"
    className="w-full flex items-center justify-center gap-2"
  >
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      {/* Google logo SVG */}
    </svg>
    Sign in with Google
  </Button>
</form>
```

### 3.2 恢复注册页面

同样编辑 `app/(auth-pages)/sign-up/page.tsx`，取消注释 Google 登录代码。

---

## 步骤 4: 测试 Google 登录

### 4.1 重启开发服务器

如果开发服务器正在运行，重启它：

```bash
# 在终端中按 Ctrl+C 停止
# 然后重新启动
npm run dev
```

### 4.2 测试登录

1. 访问 http://localhost:3000/sign-in
2. 点击 **"Sign in with Google"** 按钮
3. 应该会跳转到 Google 登录页面
4. 选择 Google 账户并授权
5. 应该会重定向回应用并成功登录

---

## ⚠️ 常见问题

### 问题 1: "redirect_uri_mismatch" 错误

**原因**: 重定向 URI 不匹配

**解决**:
- 检查 Google Cloud Console 中的重定向 URI 是否完全一致
- 检查 Supabase 中的重定向 URL 配置
- 确保没有多余的空格或斜杠

### 问题 2: "invalid_client" 错误

**原因**: 客户端 ID 或密钥错误

**解决**:
- 重新检查并复制客户端 ID 和密钥
- 确保在 Supabase 中粘贴时没有多余空格

### 问题 3: Google 登录按钮点击后没有反应

**原因**: 前端代码可能没有正确恢复

**解决**:
- 检查浏览器控制台是否有错误
- 确认代码已取消注释
- 重启开发服务器

### 问题 4: 登录后重定向到错误页面

**原因**: 重定向 URL 配置不正确

**解决**:
- 在 Supabase Dashboard 中检查 URL Configuration
- 确保添加了 `http://localhost:3000/auth/callback`

---

## 📝 检查清单

完成以下所有步骤：

- [ ] 在 Google Cloud Console 创建了项目
- [ ] 配置了 OAuth 同意屏幕
- [ ] 创建了 OAuth 2.0 客户端 ID
- [ ] 添加了重定向 URI: `https://tujfhzkxrckgkwsedlcu.supabase.co/auth/v1/callback`
- [ ] 复制了客户端 ID 和密钥
- [ ] 在 Supabase 中启用了 Google 提供商
- [ ] 在 Supabase 中配置了客户端 ID 和密钥
- [ ] 在 Supabase 中添加了重定向 URL: `http://localhost:3000/auth/callback`
- [ ] 恢复了前端代码中的 Google 登录按钮
- [ ] 重启了开发服务器
- [ ] 测试了 Google 登录功能

---

## 🎉 完成！

如果所有步骤都完成，Google 登录应该可以正常工作了！

**提示**: 
- 保存好客户端密钥，它只显示一次
- 生产环境部署时，记得添加生产环境的重定向 URL
- 如果遇到问题，查看浏览器控制台和 Supabase 日志

