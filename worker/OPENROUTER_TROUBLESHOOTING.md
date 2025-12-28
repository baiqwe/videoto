# OpenRouter API Key 问题诊断

## 当前状态

API Key: `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`

**测试结果**: ❌ 返回 `"User not found."` (401 错误)

---

## 问题原因

该 API Key 可能：
1. ❌ 尚未激活
2. ❌ 已过期
3. ❌ 余额不足
4. ❌ 复制时有误

---

## 解决方案

### 方案 1: 验证并重新获取 API Key

1. **登录 OpenRouter**
   - 访问: https://openrouter.ai/
   - 登录您的账户

2. **检查 API Keys**
   - 进入 Keys 或 Settings 页面
   - 查看您的 API key 列表
   - 确认状态是否为 Active

3. **检查余额**
   - 查看账户余额 (Credits/Balance)
   - OpenRouter 需要预充值才能使用

4. **重新生成 Key (如果需要)**
   - 点击 "Create New Key"
   - 复制完整的 key (确保没有多余空格)

---

### 方案 2: 使用其他 API 提供商

如果 OpenRouter 有问题，可以切换到其他提供商：

#### 选项 A: OpenAI 官方 (推荐)
```bash
Base URL: https://api.openai.com/v1
API Key: sk-... (从 platform.openai.com 获取)
模型: gpt-4o, gpt-4o-mini
```

#### 选项 B: Azure OpenAI
```bash
需要企业账户
```

#### 选项 C: 其他第三方中继
- SiliconFlow
- DeepSeek
- Cloudflare AI Gateway

---

## 快速验证 API Key

### 使用 curl 测试:

```bash
curl -X POST https://openrouter.ai/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY_HERE" \
  -H "HTTP-Referer: https://stepsnip.com" \
  -d '{
    "model": "openai/gpt-4o-mini",
    "messages": [{"role": "user", "content": "test"}]
  }'
```

**期望结果**:
```json
{
  "id": "chatcmpl-...",
  "choices": [{
    "message": {"content": "..."},
    ...
  }]
}
```

**错误结果**:
```json
{"error": {"message": "User not found.", "code": 401}}  ← 当前状态
```

---

## 临时方案：使用 OpenAI 官方

如果您有 OpenAI 官方账号，可以立即切换：

### 1. 获取 OpenAI API Key
- 访问: https://platform.openai.com/api-keys
- 创建新 key

### 2. 更新代码配置

修改 `worker/main.py`:

```python
# Line 47-50
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")  # 改这里
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
```

### 3. 更新模型名称

```python
# Line 643-648
candidate_models = [
    'gpt-4o',           # 移除 openai/ 前缀
    'gpt-4o-mini',
]
```

### 4. 更新环境变量

```bash
OPENAI_API_KEY=sk-proj-...  # OpenAI 官方 key
OPENAI_BASE_URL=https://api.openai.com/v1  # 可选，代码有默认值
```

---

## 下一步操作

1. **验证您的 OpenRouter API Key**:
   - 登录 https://openrouter.ai
   - 检查 key 状态和余额
   - 如果有问题，重新生成

2. **或者切换到 OpenAI 官方**:
   - 获取 OpenAI API key
   - 按照上面的"临时方案"更新配置

3. **更新环境变量**:
   - .env.local (本地)
   - Zeabur (生产)
   - Vercel (前端)

4. **测试**:
   - 使用上面的 curl 命令验证
   - 或直接提交一个视频链接测试

---

## 联系我

如果需要帮助：
1. 提供新的有效 API key
2. 或告诉我要切换到哪个提供商
3. 我会立即更新配置
