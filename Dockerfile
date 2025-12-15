# 使用官方 Python 轻量级镜像
FROM python:3.10-slim

# 1. 安装系统依赖
# ffmpeg: 视频处理必须
# git: 部分 pip 依赖可能需要
# libgl1: OpenCV 需要的图形库依赖
RUN apt-get update && \
    apt-get install -y ffmpeg git libgl1 libglib2.0-0 && \
    rm -rf /var/lib/apt/lists/*

# 2. 设置工作目录
WORKDIR /app

# 3. 复制依赖清单并安装
# 注意：这里假设 requirements.txt 在 worker 目录下
COPY worker/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. 复制 Worker 代码到容器
COPY worker/ .

# 5. 设置环境变量，确保 Python 输出不被缓存（方便看日志）
ENV PYTHONUNBUFFERED=1

# 6. 启动 Worker
CMD ["python", "main.py"]
