#!/bin/bash

# ECRデプロイスクリプト
set -e

# 変数設定
AWS_REGION="ap-southeast-2"
ECR_REPOSITORY="754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-api-manager"
IMAGE_TAG="latest"

echo "=== ECRへのデプロイを開始します ==="

# AWSリージョン確認
echo "使用するAWSリージョン: $AWS_REGION"

# ECRにログイン
echo "ECRにログインしています..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY

# Dockerイメージをビルド
echo "Dockerイメージをビルドしています..."
docker build -t watchme-api-manager .

# イメージにタグを付与
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
echo "ECR用のタグを付与しています..."
docker tag watchme-api-manager:latest $ECR_REPOSITORY:$IMAGE_TAG
docker tag watchme-api-manager:latest $ECR_REPOSITORY:$TIMESTAMP

# ECRにプッシュ
echo "ECRにイメージをプッシュしています..."
docker push $ECR_REPOSITORY:$IMAGE_TAG
docker push $ECR_REPOSITORY:$TIMESTAMP

echo "=== デプロイが完了しました ==="
echo "ECRリポジトリ: $ECR_REPOSITORY"
echo "イメージタグ: $IMAGE_TAG および $TIMESTAMP"