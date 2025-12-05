# 环境变量配置说明

请在项目根目录创建 `.env.local` 文件，并添加以下配置：

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tujfhzkxrckgkwsedlcu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1amZoemt4cmNrZ2t3c2VkbGN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3Njg4OTIsImV4cCI6MjA4MDM0NDg5Mn0.qNU0WBUfvIqKtf8Ue4pOvZ2hfHiJQZ5-lj04-kUdThk
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1amZoemt4cmNrZ2t3c2VkbGN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDc2ODg5MiwiZXhwIjoyMDgwMzQ0ODkyfQ.8l9jUSuXLfje2-fFZKxACu8j60mjh4DfWJGLrAx1EpU

# Gemini API Configuration
GEMINI_API_KEY=AIzaSyD1aTF390stpgi4p17LMOi6cX20tC2su6c

# Site URL (update this with your actual domain)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Creem Configuration (update these with your actual values)
CREEM_API_KEY=your_creem_api_key_here
CREEM_WEBHOOK_SECRET=your_creem_webhook_secret_here
CREEM_API_URL=https://test-api.creem.io/v1

# Payment Success Redirect URL
CREEM_SUCCESS_URL=http://localhost:3000/dashboard
```

## 配置说明

1. **Supabase**: 已配置完成
2. **Gemini API**: 已配置完成
3. **Creem**: 需要从 Creem.io 获取实际的 API Key 和 Webhook Secret
4. **Site URL**: 部署到生产环境时更新为实际域名

