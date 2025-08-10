#!/bin/bash

# 本番環境でのアプリケーション起動スクリプト
set -e

# 変数設定
ECR_REPOSITORY="754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-api-manager"
AWS_REGION="ap-southeast-2"
CONTAINER_NAME="watchme-api-manager-prod"

echo "=== watchme-api-manager 本番環境デプロイ開始 ==="
echo "実行時刻: $(date '+%Y-%m-%d %H:%M:%S')"

# ECRにログインして最新イメージをプル
echo "1. ECRから最新イメージをプルしています..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY
docker pull $ECR_REPOSITORY:latest

# 既存のコンテナがあれば停止・削除（docker-compose管理外のコンテナも含む）
echo "2. 既存のコンテナを停止・削除しています..."
if docker ps -a | grep -q $CONTAINER_NAME; then
    echo "   - 既存のコンテナ $CONTAINER_NAME を停止中..."
    docker stop $CONTAINER_NAME || true
    docker rm $CONTAINER_NAME || true
fi

# docker-composeでも念のため停止
docker-compose -f docker-compose.prod.yml down || true

# 本番環境でコンテナを起動
echo "3. 本番環境でコンテナを起動しています..."
docker-compose -f docker-compose.prod.yml up -d

# watchme-networkへの接続
echo "4. watchme-networkに接続しています..."
docker network connect watchme-network $CONTAINER_NAME 2>/dev/null && \
    echo "   ✅ watchme-networkに接続しました" || \
    echo "   ⚠️ watchme-networkへの接続をスキップ（既に接続済みまたはネットワークが存在しない）"

# コンテナの状態確認
echo "5. コンテナの状態を確認しています..."
if docker ps | grep -q $CONTAINER_NAME; then
    echo "   ✅ コンテナは正常に起動しています"
    docker ps | grep $CONTAINER_NAME
else
    echo "   ❌ コンテナの起動に失敗しました"
    exit 1
fi

echo ""
echo "=== デプロイ完了 ==="
echo "アプリケーションURL: https://api.hey-watch.me/manager/"
echo ""
echo "ログを確認: docker logs -f $CONTAINER_NAME"
echo "停止する: docker-compose -f docker-compose.prod.yml down"
echo "再起動: docker restart $CONTAINER_NAME"