# 修复 Google 登录错误

## 错误信息

```
{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}
```

这个错误表示 Supabase 中的 Google OAuth 提供商没有启用。

## 解决方案

### 方案 1: 在 Supabase 中启用 Google 登录（推荐，如果要用 Google 登录）

#### 步骤 1: 在 Google Cloud Console 创建 OAuth 凭据

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Google+ API：
   - 进入 **API 和服务** > **库**
   - 搜索 "Google+ API" 并启用
4. 创建 OAuth 2.0 客户端 ID：
   - 进入 **API 和服务** > **凭据**
   - 点击 **创建凭据** > **OAuth 客户端 ID**
   - 应用类型选择 **Web 应用**
   - 添加授权重定向 URI：
     ```
     https://tujfhzkxrckgkwsedlcu.supabase.co/auth/v1/callback
     ```
   - 复制 **客户端 ID** 和 **客户端密钥**

#### 步骤 2: 在 Supabase 中配置 Google 登录

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard/project/tujfhzkxrckgkwsedlcu)
2. 进入 **Authentication** > **Providers**
3. 找到 **Google** 提供商
4. 点击 **Enable Google**
5. 填写：
   - **Client ID (for OAuth)**: 粘贴从 Google Cloud Console 复制的客户端 ID
   - **Client Secret (for OAuth)**: 粘贴客户端密钥
6. 点击 **Save**

#### 步骤 3: 配置重定向 URL

在 Supabase Dashboard 中：
1. 进入 **Authentication** > **URL Configuration**
2. 设置 **Redirect URLs**:
   ```
   http://localhost:3000/auth/callback
   https://your-domain.com/auth/callback
   ```

### 方案 2: 暂时隐藏 Google 登录按钮（快速解决）

如果暂时不想配置 Google 登录，可以隐藏 Google 登录按钮。

#### 修改登录页面

编辑 `app/(auth-pages)/sign-in/page.tsx`，注释掉或删除 Google 登录部分：

```tsx
// 注释掉或删除这部分
{/* 
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
  <Button ...>
    Sign in with Google
  </Button>
</form>
*/}
```

#### 修改注册页面

同样编辑 `app/(auth-pages)/sign-up/page.tsx`，注释掉 Google 登录部分。

## 推荐操作

### 如果暂时不需要 Google 登录

使用**方案 2**，快速隐藏按钮，用户可以使用邮箱/密码登录。

### 如果需要 Google 登录功能

使用**方案 1**，按照步骤配置 Google OAuth。

## 验证

### 方案 1 验证

配置完成后：
1. 刷新登录页面
2. 点击 "Sign in with Google"
3. 应该能正常跳转到 Google 登录页面

### 方案 2 验证

隐藏按钮后：
1. 刷新登录页面
2. Google 登录按钮应该不再显示
3. 可以使用邮箱/密码正常登录

---

**提示**: 如果暂时不需要 Google 登录，建议使用方案 2，等需要时再配置。

