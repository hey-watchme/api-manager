#!/bin/bash

# 本番環境でのアプリケーション起動スクリプト
set -e

# 変数設定
ECR_REPOSITORY="754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-api-manager"
AWS_REGION="ap-southeast-2"

echo "=== watchme-api-manager 本番環境起動 ==="

# ECRにログインして最新イメージをプル
echo "ECRから最新イメージをプルしています..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY
docker pull $ECR_REPOSITORY:latest

# 既存のコンテナがあれば停止・削除
echo "既存のコンテナを停止・削除しています..."
docker-compose -f docker-compose.prod.yml down || true

# 本番環境でコンテナを起動
echo "本番環境でコンテナを起動しています..."
docker-compose -f docker-compose.prod.yml up -d

echo "=== 起動完了 ==="
echo "アプリケーションURL: http://localhost:9001"
echo ""
echo "ログを確認するには: docker logs watchme-api-manager-prod"
echo "停止するには: docker-compose -f docker-compose.prod.yml down"