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

## 参考链接

- [yt-dlp Cookies 文档](https://github.com/yt-dlp/yt-dlp/wiki/FAQ#how-do-i-pass-cookies-to-yt-dlp)
- [导出 YouTube Cookies](https://github.com/yt-dlp/yt-dlp/wiki/Extractors#exporting-youtube-cookies)

