#!/bin/bash

# Creem支付集成配置脚本
# 此脚本将自动配置 .env.local 文件中的 Creem 相关环境变量

set -e

WORKSPACE_DIR="/Users/fanqienigehamigua/Documents/vidstep/raphael-starterkit-v1"
ENV_FILE="$WORKSPACE_DIR/.env.local"

echo "=========================================="
echo "  Creem 支付集成配置脚本"
echo "=========================================="
echo ""

# 检查 .env.local 是否存在
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ 错误: .env.local 文件不存在"
    echo "📝 创建新的 .env.local 文件..."
    touch "$ENV_FILE"
fi

echo "📋 配置信息:"
echo "  - API Key: creem_test_2ni6857QoGoev8cgzGL3Yx"
echo "  - Webhook Secret: whsec_CDUNfFOw8qP8I3RzPRwps"
echo "  - 产品ID: prod_52ptLY5Tx04aGTINDH5I7N"
echo "  - 产品类型: 订阅制 ($29.9/月)"
echo ""

# 备份现有文件
if [ -f "$ENV_FILE" ]; then
    cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    echo "✅ 已备份现有 .env.local 文件"
fi

# 删除旧的 Creem 配置(如果存在)
sed -i '' '/^CREEM_API_KEY=/d' "$ENV_FILE" 2>/dev/null || true
sed -i '' '/^CREEM_WEBHOOK_SECRET=/d' "$ENV_FILE" 2>/dev/null || true
sed -i '' '/^CREEM_API_URL=/d' "$ENV_FILE" 2>/dev/null || true
sed -i '' '/^NEXT_PUBLIC_CREEM_PRICE_PRO=/d' "$ENV_FILE" 2>/dev/null || true
sed -i '' '/^CREEM_SUCCESS_URL=/d' "$ENV_FILE" 2>/dev/null || true

# 添加新的 Creem 配置
cat >> "$ENV_FILE" << 'EOF'

# ============================================
# Creem.io 支付配置 (测试环境)
# ============================================
CREEM_API_KEY=creem_test_2ni6857QoGoev8cgzGL3Yx
CREEM_WEBHOOK_SECRET=whsec_CDUNfFOw8qP8I3RzPRwps
CREEM_API_URL=https://test-api.creem.io/v1

# 产品ID配置 (订阅产品: $29.9/月)
NEXT_PUBLIC_CREEM_PRICE_PRO=prod_52ptLY5Tx04aGTINDH5I7N

# Site URLs (本地开发环境)
CREEM_SUCCESS_URL=http://localhost:3000/dashboard
EOF

echo ""
echo "✅ Creem 配置已成功添加到 .env.local"
echo ""
echo "📌 下一步操作:"
echo "  1. 检查 .env.local 文件,确保 Supabase 配置也存在"
echo "  2. 运行: npm run dev"
echo "  3. 访问: http://localhost:3000/pricing"
echo "  4. 测试支付流程"
echo ""
echo "=========================================="
