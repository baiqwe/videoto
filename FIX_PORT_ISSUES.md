# 修复端口占用和 CSS 加载错误

## 问题描述

1. **端口被占用**: Next.js 自动切换到其他端口（3001, 3002, 3003...）
2. **CSS 404 错误**: 浏览器尝试从错误的端口加载 CSS 文件

## 原因

- 有多个 Next.js 开发服务器实例在运行
- 浏览器缓存了旧的端口号
- `.next` 缓存目录可能损坏

## 解决方案

### 步骤 1: 清理所有端口（已完成）

```bash
# 停止所有占用端口的进程
lsof -ti:3000,3001,3002,3003,3004 | xargs kill -9
```

### 步骤 2: 清理 Next.js 缓存（已完成）

```bash
cd /Users/fanqienigehamigua/Documents/vidstep/raphael-starterkit-v1
rm -rf .next
```

### 步骤 3: 重新启动服务器

```bash
cd /Users/fanqienigehamigua/Documents/vidstep/raphael-starterkit-v1
npm run dev
```

**应该看到**:
```
✓ Ready in X seconds
○ Local: http://localhost:3000
```

### 步骤 4: 清除浏览器缓存

1. 按 `Cmd+Shift+R` (Mac) 或 `Ctrl+Shift+R` (Windows) 硬刷新
2. 或使用无痕模式访问
3. 或清除浏览器缓存

## 如果仍然有问题

### 检查是否有多个进程

```bash
# 查看所有 node 进程
ps aux | grep node

# 如果有多个，手动停止
kill -9 <PID>
```

### 使用固定端口

如果端口一直被占用，可以指定固定端口：

```bash
PORT=3000 npm run dev
```

### 检查防火墙

确保防火墙没有阻止端口 3000。

## 预防措施

1. **启动前检查端口**:
   ```bash
   lsof -ti:3000
   # 如果有输出，说明端口被占用
   ```

2. **使用单一终端窗口**: 避免在多个终端中启动多个服务器

3. **正确停止服务器**: 使用 `Ctrl+C` 停止，不要直接关闭终端

---

**提示**: 如果问题持续，尝试重启电脑或使用不同的端口。

