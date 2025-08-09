#!/bin/bash

# ECRレジストリのURL
ECR_REGISTRY="754724220380.dkr.ecr.ap-southeast-2.amazonaws.com"
ECR_REPOSITORY="watchme-api-manager-scheduler"
AWS_REGION="ap-southeast-2"

echo "=== スケジューラーAPIのECRへのデプロイを開始します ==="
echo "使用するAWSリージョン: $AWS_REGION"

# ECRにログイン
echo "ECRにログインしています..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

# Dockerイメージをビルド
echo "Dockerイメージをビルドしています..."
docker build -f scheduler/Dockerfile -t watchme-api-manager-scheduler:latest scheduler/

# タグを付与
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
echo "ECR用のタグを付与しています..."
docker tag watchme-api-manager-scheduler:latest $ECR_REGISTRY/$ECR_REPOSITORY:latest
docker tag watchme-api-manager-scheduler:latest $ECR_REGISTRY/$ECR_REPOSITORY:$TIMESTAMP

# ECRにプッシュ
echo "ECRにイメージをプッシュしています..."
docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
docker push $ECR_REGISTRY/$ECR_REPOSITORY:$TIMESTAMP

echo "=== デプロイが完了しました ==="
echo "ECRリポジトリ: $ECR_REGISTRY/$ECR_REPOSITORY"
echo "イメージタグ: latest および $TIMESTAMP"