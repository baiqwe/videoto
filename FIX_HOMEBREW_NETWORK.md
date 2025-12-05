# 修复 Homebrew 网络连接问题

## 问题诊断

从错误信息看：
- `Connection reset by peer` - 连接被重置
- `Operation timed out` - 操作超时
- `unable to access 'https://github.com/Homebrew/brew/'` - 无法访问 GitHub

这是典型的网络连接问题，在中国大陆访问 GitHub 经常遇到。

## 解决方案

### 方案 1: 使用国内镜像（推荐）

**步骤 1: 中断当前安装**

在终端中按 `Ctrl + C` 中断当前安装。

**步骤 2: 使用国内镜像安装**

```bash
/bin/bash -c "$(curl -fsSL https://gitee.com/ineo6/homebrew-install/raw/master/install.sh)"
```

这个镜像使用 Gitee，速度会快很多。

**步骤 3: 配置 PATH**

安装完成后，配置 PATH：

```bash
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**步骤 4: 验证安装**

```bash
brew --version
```

**步骤 5: 安装 FFmpeg**

```bash
brew install ffmpeg
```

### 方案 2: 配置 Git 使用代理（如果已有代理）

如果你有可用的代理：

```bash
# 设置 Git 代理（替换为你的代理地址）
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890

# 然后重新运行安装脚本
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 方案 3: 清理后重试

如果安装过程中断，可能需要清理：

```bash
# 清理可能的残留
sudo rm -rf /usr/local/Homebrew
sudo rm -rf /usr/local/bin/brew
sudo rm -rf /usr/local/etc/brew
sudo rm -rf /usr/local/var/homebrew

# 使用国内镜像重新安装
/bin/bash -c "$(curl -fsSL https://gitee.com/ineo6/homebrew-install/raw/master/install.sh)"
```

## 推荐操作流程

1. **中断当前安装**: 按 `Ctrl + C`

2. **使用国内镜像安装**:
   ```bash
   /bin/bash -c "$(curl -fsSL https://gitee.com/ineo6/homebrew-install/raw/master/install.sh)"
   ```

3. **等待安装完成**（通常 2-5 分钟）

4. **配置 PATH**:
   ```bash
   echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

5. **验证**:
   ```bash
   brew --version
   ```

6. **安装 FFmpeg**:
   ```bash
   brew install ffmpeg
   ```

## 如果镜像也失败

### 临时解决方案

如果 Homebrew 安装一直有问题，可以：

1. **暂时跳过 FFmpeg**，先测试应用其他功能
2. **使用其他方法安装 FFmpeg**:
   - 从官网下载二进制文件
   - 使用 conda（如果已安装）
   - 使用 MacPorts（如果已安装）

3. **稍后再处理**，Worker 会在需要 FFmpeg 时提示错误

### 检查网络

```bash
# 测试 GitHub 连接
ping github.com

# 测试 Gitee 连接
ping gitee.com
```

如果 Gitee 可以访问，使用方案 1 应该能成功。

## 注意事项

- 使用国内镜像安装的 Homebrew 功能完全一样
- 安装后可以正常使用所有 brew 命令
- 后续安装软件包时，如果遇到 GitHub 访问问题，可以配置 brew 使用镜像源

---

**强烈推荐**: 使用方案 1（国内镜像），这是最简单可靠的方法。

