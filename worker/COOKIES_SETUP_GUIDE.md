# 🔧 YouTube Cookie 配置指南（最新 - 2025年12月）

## ⚠️ 重要更新

YouTube现在对cookie格式要求更严格。如果你遇到"Sign in to confirm you're not a bot"错误，请使用**Base64编码方式**配置cookies。

---

## 🚀 推荐方法：使用 Base64 编码（解决换行符问题）

### 为什么需要Base64？

Zeabur等平台的环境变量可能会破坏cookies.txt中的换行符，导致YouTube认证失败。Base64编码可以完美避免这个问题。

### 📋 配置步骤

#### 1. 导出最新的YouTube Cookies

使用Chrome插件：[Get cookies.txt LOCALLY](https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)

1. 登录 youtube.com（确保能正常观看视频）
2. 点击插件图标 → **Export for "youtube.com"**
3. 将导出的内容保存为 `worker/cookies.txt`

#### 2. 转换为Base64格式

在worker目录运行：

```bash
cd worker
python3 encode_cookies.py
```

脚本会自动：
- 读取 `cookies.txt`
- 转换为Base64格式
- 复制到剪贴板（macOS）
- 保存到 `cookies_base64.txt`

#### 3. 在Zeabur配置环境变量

1. 登录 [Zeabur Dashboard](https://zeabur.com)
2. 选择你的 **Worker 服务**
3. 点击 **Variables（环境变量）**
4. 添加新变量：
   - **变量名**: `YOUTUBE_COOKIES_B64`
   - **值**: 粘贴刚才复制的Base64字符串
5. **删除旧变量** `YOUTUBE_COOKIES`（如果存在）
6. 点击**保存并重启服务**

---

## ✅ 验证配置

部署后，查看Worker日志，应该显示：

```
📥 Downloading video and subtitles from: https://...
   🍪 Using cookies from YOUTUBE_COOKIES_B64 environment variable
   📋 Cookie file size: 1563 chars
[youtube] Extracting URL: ...
✅ Downloaded video: ...
```

如果仍然失败，检查：

1. **Cookie是否最新**：重新导出cookies（建议用无痕模式登录YouTube后导出）
2. **是否删除了旧变量**：确保只有 `YOUTUBE_COOKIES_B64`，没有 `YOUTUBE_COOKIES`
3. **是否重启了服务**：修改环境变量后必须重启

---

## 📊 环境变量优先级

代码按以下顺序查找cookies：

1. ✅ **YOUTUBE_COOKIES_B64** (Base64编码) - 推荐
2. **YOUTUBE_COOKIES** (纯文本) - 可能有换行符问题
3. `/data/cookies.txt` (Zeabur持久化存储挂载)
4. `/app/cookies.txt` (容器内部)
5. `cookies.txt` (本地开发)

---

## 🔄 Cookie更新频率

- YouTube cookies通常 **6-12个月过期**
- 建议每 **3个月更新一次**
- 如果遇到认证错误，立即更新

### 快速更新流程：

```bash
# 1. 重新导出cookies到 worker/cookies.txt
# 2. 重新编码
cd worker
python3 encode_cookies.py

# 3. 复制到剪贴板后，更新Zeabur环境变量
```

---

## 🛡️ 安全提示

- ⚠️ **永远不要将cookies提交到Git**
- 🔐 定期轮换cookies（每3个月）
- 🚫 如果cookies泄露，立即在YouTube登出所有设备
- ✅ Base64只是编码，不是加密（不要以为很安全）

---

## 🐛 故障排查

### 问题1：仍然提示 "Sign in to confirm you're not a bot"

**可能原因**：
1. Cookie已过期或无效
2. YouTube检测到服务器IP（Zeabur的IP可能被标记）
3. Cookie格式仍有问题

**解决方案**：
```bash
# 1. 使用无痕模式重新登录YouTube并导出cookies
# 2. 确保cookie包含这些关键字段：
#    - __Secure-3PSID
#    - __Secure-3PAPISID
#    - VISITOR_INFO1_LIVE
#    - VISITOR_PRIVACY_METADATA

# 3. 验证Base64编码正确
python3 -c "
import base64
with open('cookies_base64.txt', 'r') as f:
    b64 = f.read().strip()
    decoded = base64.b64decode(b64).decode('utf-8')
    print('✅ Decoded cookies preview:')
    print(decoded[:200])
"
```

### 问题2：Worker日志显示 "Failed to decode base64 cookies"

**解决**：
- 确保复制的Base64字符串完整（没有多余空格或换行）
- 重新运行 `python3 encode_cookies.py`

### 问题3：YouTube频繁要求验证

**说明**：YouTube可能对Zeabur的服务器IP有限制。

**备选方案**：
1. 考虑使用代理服务器（设置 `HTTPS_PROXY` 环境变量）
2. 使用 [Cobalt API](https://github.com/wukko/cobalt) 作为主要下载方式（另见 `COBALT_API_GUIDE.md`）

---

## 📞 需要帮助？

如果按照以上步骤仍无法解决，请检查：

1. ✅ 是否使用最新的 `main.py`（包含Base64支持）
2. ✅ 是否在正常浏览器中能访问YouTube视频
3. ✅ 导出的cookies是否包含所有必需字段

---

## ✨ 本地开发

本地开发时，代码会自动读取 `worker/cookies.txt`：

```bash
cd worker
# 将导出的cookies粘贴到这个文件
nano cookies.txt

# 直接运行worker（本地不需要Base64）
python3 main.py
```

**注意**：`cookies.txt` 和 `cookies_base64.txt` 已在 `.gitignore` 中，不会提交到Git。
