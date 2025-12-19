# 方案B：通过环境变量配置YouTube Cookies（推荐）

## ✅ 优势

- **安全性高**：不将敏感信息提交到Git
- **易于更新**：直接在Zeabur面板修改环境变量
- **符合最佳实践**：敏感数据与代码分离

---

## 📋 操作步骤

### 1. 导出Cookies文件

#### 选项A：使用浏览器插件（推荐）
1. 安装Chrome插件：[Get cookies.txt LOCALLY](https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)
2. 登录 youtube.com
3. 点击插件图标 → Export cookies
4. 复制导出的文本内容

#### 选项B：手动导出
1. 打开YouTube → F12开发者工具 → Application/应用 → Cookies
2. 复制所有cookie（但插件更简单）

---

### 2. 在Zeabur配置环境变量

#### 步骤：
1. 登录 [Zeabur Dashboard](https://zeabur.com)
2. 选择您的Worker服务
3. 点击 **Variables（环境变量）**
4. 添加新变量：
   - **变量名**: `YOUTUBE_COOKIES`
   - **值**: 粘贴您导出的完整cookies.txt内容

   ```
   示例格式：
   # Netscape HTTP Cookie File
   .youtube.com    TRUE    /    TRUE    1735689600    CONSENT    YES+...
   .youtube.com    TRUE    /    FALSE   1735689600    VISITOR_INFO1_LIVE    ABC123...
   ```

5. 点击**保存并重启服务**

---

### 3. 验证配置

推送代码后，查看Worker日志应显示：
```
📥 Downloading video and subtitles from: https://...
   🍪 Using cookies from environment variable  ✅
```

如果显示：
```
⚠️  No cookies found. YouTube may block requests.
```
则说明环境变量未正确设置。

---

## 🔄 定期更新Cookies

YouTube cookies通常6-12个月过期。如果遇到认证错误：

1. 重新导出最新cookies
2. 更新Zeabur环境变量 `YOUTUBE_COOKIES`
3. 重启Worker服务

---

## 🛠️ 本地开发

本地开发时，代码会自动回退到读取 `worker/cookies.txt` 文件：

```bash
# 在worker目录创建cookies.txt
cd worker
# 粘贴你导出的cookies内容
nano cookies.txt
```

**注意**：`worker/cookies.txt` 已在 `.gitignore` 中忽略，不会提交到Git。

---

## 🔒 安全提示

- ⚠️ **永远不要将cookies内容提交到公开仓库**
- 🔐 Zeabur的环境变量是加密存储的
- 🔄 定期轮换cookies（建议每3个月）
- 🚫 如果cookies泄露，立即在YouTube账号中登出所有设备

---

## ❓ 故障排查

### 问题1：仍然提示"Sign in to confirm you're not a bot"

**原因**：环境变量格式错误或cookies过期

**解决**：
1. 确认环境变量名称完全是 `YOUTUBE_COOKIES`（区分大小写）
2. 确认粘贴了**完整**的cookies文件内容（包括注释行）
3. 重新导出最新的cookies

### 问题2：Worker日志显示"Failed to write cookies from env"

**原因**：可能是特殊字符编码问题

**解决**：
1. 使用Base64编码cookies内容：
   ```bash
   cat cookies.txt | base64 > cookies_base64.txt
   ```
2. 修改代码解码（可选，通常不需要）

---

## 📊 方案对比

| 特性 | 方案A（提交到Git） | 方案B（环境变量） |
|------|-------------------|------------------|
| 安全性 | ⚠️ 低（敏感信息在代码库） | ✅ 高（加密存储） |
| 更新便捷性 | ⚠️ 需重新commit推送 | ✅ 直接修改env |
| 适用场景 | 私有仓库+个人项目 | 生产环境推荐 |
| 轮换难度 | 中等 | 简单 |

**推荐**：生产环境使用方案B，本地开发可用方案A的本地文件。

---

## ✅ 完成确认

配置完成后，尝试生成一个Guide，如果成功下载YouTube视频即表示配置正确！
