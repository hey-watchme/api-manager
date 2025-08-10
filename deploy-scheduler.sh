#!/bin/bash

#==============================================================================
# ■ 前編：ローカル環境でのビルドとECRへのプッシュ
#==============================================================================
#
# 目的：スケジューラーAPIのDockerイメージをビルドし、ECRにプッシュします。
# 実行場所：ローカルの開発環境
#
#==============================================================================

# --- 変数設定 ---
ECR_REGISTRY="754724220380.dkr.ecr.ap-southeast-2.amazonaws.com"
ECR_REPOSITORY="watchme-api-manager-scheduler"
AWS_REGION="ap-southeast-2"

echo "=== [前編] スケジューラーAPIのECRへのデプロイを開始します ==="
echo "使用するAWSリージョン: $AWS_REGION"

# --- ECRログイン ---
echo "ECRにログインしています..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

# --- Dockerイメージのビルド ---
echo "Dockerイメージをビルドしています..."
docker build -f scheduler/Dockerfile -t watchme-api-manager-scheduler:latest scheduler/

# --- タグの付与 ---
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
echo "ECR用のタグを付与しています..."
docker tag watchme-api-manager-scheduler:latest $ECR_REGISTRY/$ECR_REPOSITORY:latest
docker tag watchme-api-manager-scheduler:latest $ECR_REGISTRY/$ECR_REPOSITORY:$TIMESTAMP

# --- ECRへのプッシュ ---
echo "ECRにイメージをプッシュしています..."
docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
docker push $ECR_REGISTRY/$ECR_REPOSITORY:$TIMESTAMP

echo "=== [前編] ECRへのプッシュが完了しました ==="
echo ""
echo "ECRリポジトリ: $ECR_REGISTRY/$ECR_REPOSITORY"
echo "イメージタグ: latest および $TIMESTAMP"
echo ""
echo "次に、EC2サーバーに接続し、後編のスクリプトを実行してください。"
echo ""


#==============================================================================
# ■ 後編：EC2サーバーでのコンテナ展開
#==============================================================================
#
# 目的：EC2サーバー上で、ECRから最新イメージをプルし、コンテナを再起動します。
# 実行場所：EC2サーバー
#
# 以下のコマンドをEC2サーバー上で実行してください。
#
#==============================================================================

: <<'EC2_DEPLOY_SCRIPT'

#!/bin/bash

# エラーが発生した場合はスクリプトを終了
set -e

# 1. 最新イメージのプル
echo "最新のDockerイメージをプルしています..."
docker pull 754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-api-manager-scheduler:latest

# 2. 既存コンテナの停止と削除
echo "既存のスケジューラーコンテナを停止・削除しています..."
docker stop watchme-scheduler-prod || true
docker rm watchme-scheduler-prod || true

# 3. 新しいコンテナの起動
#   - docker-compose.all.yml を使用して、関連サービスを含めて起動します
echo "新しいコンテナを起動しています..."
cd /home/ubuntu/watchme-api-manager
docker-compose -f docker-compose.all.yml up -d

# 4. ネットワーク接続の確認
echo "コンテナをwatchme-networkに接続しています..."
docker network connect watchme-network watchme-scheduler-prod

# 必須：スケジューラーが通信する全コンテナの接続確認
docker network connect watchme-network api-transcriber
docker network connect watchme-network api_gen_prompt_mood_chart
docker network connect watchme-network api-gpt-v1
docker network connect watchme-network api_sed_v1-sed_api-1
docker network connect watchme-network api-sed-aggregator
docker network connect watchme-network opensmile-api
docker network connect watchme-network opensmile-aggregator

# 5. 接続テスト
echo "スケジューラーから各APIへの接続をテストしています..."
docker exec watchme-scheduler-prod ping -c 1 api-transcriber
docker exec watchme-scheduler-prod ping -c 1 api_gen_prompt_mood_chart
docker exec watchme-scheduler-prod ping -c 1 api-gpt-v1
docker exec watchme-scheduler-prod ping -c 1 api_sed_v1-sed_api-1
docker exec watchme-scheduler-prod ping -c 1 api-sed-aggregator
docker exec watchme-scheduler-prod ping -c 1 opensmile-api
docker exec watchme-scheduler-prod ping -c 1 opensmile-aggregator

echo "=== [後編] EC2サーバーでのデプロイと接続テストが完了しました ==="

EC2_DEPLOY_SCRIPT
