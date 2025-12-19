# 🚀 快速修复：YouTube Cookie错误

## 问题
```
ERROR: Sign in to confirm you're not a bot
```

## ✅ 解决方案（3步）

### 第1步：重新导出cookies
1. 安装插件：[Get cookies.txt LOCALLY](https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)
2. 登录 youtube.com
3. 点击插件 → Export → 保存为 `worker/cookies.txt`

### 第2步：转换为Base64
```bash
cd worker
python3 encode_cookies.py
```
✅ 自动复制到剪贴板！

### 第3步：更新Zeabur环境变量
1. 打开 Zeabur Dashboard → Worker服务 → Variables
2. **删除**旧变量 `YOUTUBE_COOKIES`
3. **添加**新变量：
   - 名称：`YOUTUBE_COOKIES_B64`
   - 值：粘贴（Cmd+V）
4. **保存并重启**

## 🎯 验证成功

日志应显示：
```
🍪 Using cookies from YOUTUBE_COOKIES_B64 environment variable
📋 Cookie file size: 1563 chars
✅ Downloaded video
```

## ⚠️ 常见错误

| 错误 | 原因 | 解决 |
|------|------|------|
| 仍提示需要cookie | Cookie已过期 | 重新导出最新cookies |
| Failed to decode | Base64格式错误 | 确保完整复制，无多余空格 |
| No cookies found | 环境变量名错误 | 必须是 `YOUTUBE_COOKIES_B64` |

## 🔄 定期维护

- 每3个月更新一次cookies
- 或遇到错误时立即更新

---

💡 **重要**：一定要删除旧的 `YOUTUBE_COOKIES` 变量，只保留 `YOUTUBE_COOKIES_B64`！

📚 详细文档：见 `COOKIES_SETUP_GUIDE.md`
