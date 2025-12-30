# YouTube Cookies 配置指南

## 问题说明

YouTube 现在要求登录验证来防止机器人访问。如果你的视频处理失败并显示 "Sign in to confirm you're not a bot" 错误，你需要配置 YouTube cookies。

## 方法 1: 使用浏览器导出 Cookies（推荐）

### 步骤 1: 安装 yt-dlp（如果还没有）

```bash
pip install yt-dlp
```

### 步骤 2: 从浏览器导出 Cookies

#### Chrome/Edge:
```bash
yt-dlp --cookies-from-browser chrome --cookies cookies.txt "https://www.youtube.com/watch?v=VIDEO_ID"
```

#### Firefox:
```bash
yt-dlp --cookies-from-browser firefox --cookies cookies.txt "https://www.youtube.com/watch?v=VIDEO_ID"
```

#### Safari:
```bash
yt-dlp --cookies-from-browser safari --cookies cookies.txt "https://www.youtube.com/watch?v=VIDEO_ID"
```

### 步骤 3: 将 Cookies 转换为 Base64

```bash
# 在 macOS/Linux
base64 -i cookies.txt | tr -d '\n' > cookies_b64.txt

# 在 Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("cookies.txt")) | Out-File -Encoding ASCII cookies_b64.txt
```

### 步骤 4: 配置环境变量

在 Zeabur 环境变量中添加：

```
YOUTUBE_COOKIES_B64=<从 cookies_b64.txt 复制的内容>
```

## 方法 2: 使用 Netscape 格式 Cookies

### 步骤 1: 使用浏览器扩展导出

1. 安装浏览器扩展（如 "Get cookies.txt LOCALLY"）
2. 访问 YouTube 并登录
3. 导出 cookies 为 Netscape 格式

### 步骤 2: 转换为 Base64

```bash
base64 -i cookies.txt | tr -d '\n' > cookies_b64.txt
```

### 步骤 3: 配置环境变量

```
YOUTUBE_COOKIES_B64=<base64 内容>
```

## 方法 3: 手动配置（临时方案）

如果无法配置 cookies，可以：

1. **等待几分钟** - YouTube 的验证可能是临时的
2. **尝试不同的视频** - 某些视频可能不需要验证
3. **使用有公开字幕的视频** - 更容易访问

## 验证配置

配置完成后，检查日志应该显示：

```
🍪 Using cookies from YOUTUBE_COOKIES_B64 (decoded to /tmp/youtube_cookies.txt)
✅ Metadata extracted successfully with cookies
```

## 常见问题

### Q: Cookies 过期了怎么办？
A: Cookies 通常有效期为几周到几个月。过期后需要重新导出。

### Q: 为什么还是失败？
A: 
- 确保 cookies 是从已登录 YouTube 的浏览器导出的
- 检查 base64 编码是否正确（没有换行符）
- 尝试使用不同的浏览器导出 cookies

### Q: 可以不用 cookies 吗？
A: 对于某些公开视频可能可以，但 YouTube 越来越严格，建议配置 cookies。

## 故障排除：Cookies 一直失败

如果配置了 cookies 但仍然失败，按以下步骤排查：

### 步骤 1: 测试 Cookies 是否有效

使用诊断工具测试 cookies：

```bash
# 测试本地 cookies 文件
python worker/test_cookies.py cookies.txt

# 测试 base64 编码的 cookies
python worker/test_cookies.py --base64 "YOUR_BASE64_STRING"
```

如果测试失败，说明 cookies 无效，需要重新导出。

### 步骤 2: 检查 Cookies 格式

确保 cookies 是 **Netscape 格式**，第一行应该是：
```
# Netscape HTTP Cookie File
```

### 步骤 3: 重新导出 Cookies

1. **确保浏览器已登录 YouTube**
   - 打开浏览器，访问 youtube.com
   - 确认已登录你的账户

2. **使用最新方法导出**
   ```bash
   # 更新 yt-dlp 到最新版本
   pip install --upgrade yt-dlp
   
   # 重新导出 cookies
   yt-dlp --cookies-from-browser chrome --cookies cookies.txt "https://www.youtube.com"
   ```

3. **验证 cookies 文件**
   ```bash
   # 检查文件大小（应该 > 0）
   ls -lh cookies.txt
   
   # 检查格式
   head -5 cookies.txt
   ```

### 步骤 4: 检查 Base64 编码

```bash
# 正确编码（无换行符）
base64 -i cookies.txt | tr -d '\n' > cookies_b64.txt

# 验证编码
cat cookies_b64.txt | wc -c  # 应该是一个很长的字符串，没有换行
```

### 步骤 5: 常见错误和解决方案

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `Sign in to confirm you're not a bot` | Cookies 过期或无效 | 重新导出 cookies |
| `Cookie file is empty` | Base64 解码失败 | 检查编码是否正确 |
| `Cookie file doesn't appear to be in Netscape format` | 格式不对 | 使用 yt-dlp 导出 |
| `Cookie authentication failed` | Cookies 已过期 | 重新导出 |

### 步骤 6: 替代方案

如果 cookies 一直失败，可以尝试：

1. **使用不同的浏览器导出**
   - Chrome → Firefox → Safari
   - 某些浏览器导出的 cookies 可能更稳定

2. **等待并重试**
   - YouTube 可能有临时限制
   - 等待 10-15 分钟后重试

3. **使用代理/VPN**
   - 某些地区可能更容易访问
   - 配置 yt-dlp 使用代理

4. **联系支持**
   - 如果所有方法都失败，可能是 YouTube 政策变化
   - 考虑使用其他视频平台

## 参考链接

- [yt-dlp Cookies 文档](https://github.com/yt-dlp/yt-dlp/wiki/FAQ#how-do-i-pass-cookies-to-yt-dlp)
- [导出 YouTube Cookies](https://github.com/yt-dlp/yt-dlp/wiki/Extractors#exporting-youtube-cookies)
- [yt-dlp GitHub Issues](https://github.com/yt-dlp/yt-dlp/issues) - 查找类似问题

