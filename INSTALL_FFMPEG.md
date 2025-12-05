# FFmpeg 安装指南

## 问题
运行 `brew install ffmpeg` 时提示 `command not found: brew`

这意味着你的系统上还没有安装 Homebrew。

## 解决方案

### 方法 1: 安装 Homebrew（推荐）

Homebrew 是 macOS 上最流行的包管理器。

**安装 Homebrew**:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

安装过程可能需要几分钟，按照提示输入密码。

**安装完成后，安装 FFmpeg**:
```bash
brew install ffmpeg
```

### 方法 2: 使用 MacPorts（如果已安装）

如果你已经安装了 MacPorts：

```bash
sudo port install ffmpeg
```

### 方法 3: 直接下载二进制文件

1. 访问 https://evermeet.cx/ffmpeg/
2. 下载 FFmpeg 二进制文件
3. 解压并移动到 `/usr/local/bin/`:
```bash
# 假设下载到 ~/Downloads/ffmpeg
sudo mv ~/Downloads/ffmpeg /usr/local/bin/
sudo chmod +x /usr/local/bin/ffmpeg
```

### 方法 4: 使用 conda（如果已安装）

如果你使用 conda/miniconda：

```bash
conda install -c conda-forge ffmpeg
```

## 验证安装

安装完成后，验证 FFmpeg 是否安装成功：

```bash
ffmpeg -version
```

应该看到类似输出：
```
ffmpeg version 6.x.x
...
```

## 如果安装 Homebrew 遇到问题

### 权限问题
确保使用管理员权限：
```bash
sudo /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 网络问题
如果下载速度慢，可以使用国内镜像：
```bash
# 使用清华大学镜像
/bin/bash -c "$(curl -fsSL https://gitee.com/ineo6/homebrew-install/raw/master/install.sh)"
```

### 检查 PATH
安装 Homebrew 后，可能需要将 Homebrew 添加到 PATH：

```bash
# 对于 Apple Silicon Mac (M1/M2)
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
eval "$(/opt/homebrew/bin/brew shellenv)"

# 对于 Intel Mac
echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zshrc
eval "$(/usr/local/bin/brew shellenv)"
```

然后重新打开终端或运行：
```bash
source ~/.zshrc
```

## 推荐步骤

1. **安装 Homebrew**（如果还没有）:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **安装 FFmpeg**:
   ```bash
   brew install ffmpeg
   ```

3. **验证安装**:
   ```bash
   ffmpeg -version
   ```

4. **重启 Worker**:
   ```bash
   cd /Users/fanqienigehamigua/Documents/vidstep/raphael-starterkit-v1/worker
   python3 main.py
   ```

## 注意事项

- 安装 Homebrew 需要管理员权限（会要求输入密码）
- 安装过程可能需要 5-10 分钟
- 确保网络连接正常

---

**提示**: 如果不想安装 Homebrew，也可以暂时跳过 FFmpeg 安装，Worker 会在需要时提示错误，你可以根据错误信息决定如何处理。

