#!/bin/bash
set -e

ECR_REPOSITORY="754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-api-manager-scheduler"
AWS_REGION="ap-southeast-2"

echo "=== watchme-scheduler 本番環境起動 ==="

# ECRから最新イメージをプル
echo "📥 最新イメージをプル中..."
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_REPOSITORY
docker pull $ECR_REPOSITORY:latest

# 既存のコンテナを停止・削除
echo "🔄 既存コンテナを停止中..."
docker-compose -f docker-compose.prod.yml down || true

# watchme-networkが存在しない場合は作成
if ! docker network ls | grep -q watchme-network; then
    echo "🌐 watchme-networkを作成中..."
    docker network create watchme-network
fi

# 本番環境でコンテナを起動
echo "🚀 コンテナを起動中..."
docker-compose -f docker-compose.prod.yml up -d

# 起動確認
echo "⏳ 起動確認中..."
sleep 10

if docker ps | grep -q watchme-scheduler-prod; then
    echo "✅ watchme-scheduler 起動成功"
    echo ""
    echo "📋 確認方法:"
    echo "- コンテナ状態: docker ps | grep scheduler"
    echo "- ログ確認: docker logs watchme-scheduler-prod"
    echo "- ヘルスチェック: curl http://localhost:8015/"
else
    echo "❌ watchme-scheduler 起動失敗"
    echo "ログ確認:"
    docker logs watchme-scheduler-prod
    exit 1
fi