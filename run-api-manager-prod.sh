#!/bin/bash
set -e

ECR_REPOSITORY="754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-api-manager"
AWS_REGION="ap-southeast-2"

echo "=== watchme-api-manager 本番環境起動 ==="

# ECRから最新イメージをプル
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_REPOSITORY
docker pull $ECR_REPOSITORY:latest

# 既存のコンテナを停止・削除
docker stop watchme-api-manager-prod || true
docker rm watchme-api-manager-prod || true

# 本番環境でコンテナを起動
docker run -d \
  --name watchme-api-manager-prod \
  --restart unless-stopped \
  -p 9001:9001 \
  -e NODE_ENV=production \
  -e VITE_SUPABASE_URL="${VITE_SUPABASE_URL}" \
  -e VITE_SUPABASE_KEY="${VITE_SUPABASE_KEY}" \
  -e VITE_API_BASE_URL="${VITE_API_BASE_URL}" \
  -e VITE_PORT=9001 \
  -e VITE_API_TIMEOUT="${VITE_API_TIMEOUT}" \
  $ECR_REPOSITORY:latest

echo "=== 起動完了 ==="
echo "アプリケーションURL: http://localhost:9001"
docker logs -f watchme-api-manager-prod --tail 20