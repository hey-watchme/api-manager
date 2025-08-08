#!/bin/bash
set -e

# 変数設定
AWS_REGION="ap-southeast-2"
ECR_REPOSITORY="754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-api-manager-scheduler"
IMAGE_TAG="latest"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "=== Scheduler ECRへのデプロイを開始します ==="

# ECRにログイン
echo "📝 ECRにログイン中..."
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_REPOSITORY

# Dockerイメージをビルド
echo "🔨 Dockerイメージをビルド中..."
# 親ディレクトリのPythonファイルをコピー
cp ../scheduler-api-server.py .
cp ../run-api-process.py .

docker build -t watchme-scheduler .

# コピーしたファイルを削除
rm -f scheduler-api-server.py run-api-process.py

# ECR用のタグを付与
echo "🏷️ タグを付与中..."
docker tag watchme-scheduler:latest $ECR_REPOSITORY:$IMAGE_TAG
docker tag watchme-scheduler:latest $ECR_REPOSITORY:$TIMESTAMP

# ECRにプッシュ
echo "📤 ECRにプッシュ中..."
docker push $ECR_REPOSITORY:$IMAGE_TAG
docker push $ECR_REPOSITORY:$TIMESTAMP

echo "=== デプロイが完了しました ==="
echo "ECRリポジトリ: $ECR_REPOSITORY"
echo "イメージタグ: $IMAGE_TAG および $TIMESTAMP"