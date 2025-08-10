#!/bin/bash

# ==========================================
# WatchMe API Manager - スケジューラーデプロイ [EC2編]
# 
# 使用方法: EC2サーバー上で実行
# ./deploy-scheduler-ec2.sh
# ==========================================

set -e  # エラーが発生したら即座に終了

echo "=== [EC2編] スケジューラーAPIのデプロイを開始します ==="
echo ""

# 色付きの出力関数
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

function print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

function print_error() {
    echo -e "${RED}❌ $1${NC}"
}

function print_info() {
    echo -e "ℹ️  $1"
}

# 設定
AWS_REGION="ap-southeast-2"
AWS_ACCOUNT_ID="754724220380"
ECR_REPO="watchme-api-manager-scheduler"
CONTAINER_NAME="watchme-scheduler-prod"

# 1. ECRへのログイン
print_info "ECRにログインしています..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
print_success "ECRログイン完了"
echo ""

# 2. 最新イメージをプル
print_info "最新のDockerイメージをプルしています..."
docker pull ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:latest
print_success "イメージのプル完了"
echo ""

# 3. 既存コンテナの停止と削除
print_info "既存のコンテナを停止しています..."
if docker ps -a | grep ${CONTAINER_NAME} > /dev/null 2>&1; then
    docker stop ${CONTAINER_NAME} || true
    docker rm ${CONTAINER_NAME} || true
    print_success "既存コンテナを停止・削除しました"
else
    print_info "既存コンテナは存在しません"
fi
echo ""

# 4. ディレクトリとログ権限の確認
print_info "必要なディレクトリを作成しています..."
sudo mkdir -p /home/ubuntu/scheduler
sudo mkdir -p /var/log/scheduler
sudo chown -R ubuntu:ubuntu /home/ubuntu/scheduler
sudo chown -R ubuntu:ubuntu /var/log/scheduler
print_success "ディレクトリ準備完了"
echo ""

# 5. 環境変数ファイルの確認
if [ -f /home/ubuntu/watchme-api-manager/.env ]; then
    print_success ".envファイルが存在します"
else
    print_error ".envファイルが見つかりません！"
    print_warning "他のサービスから.envファイルをコピーしてください："
    echo "  cp /home/ubuntu/watchme-vault-api-docker/.env /home/ubuntu/watchme-api-manager/.env"
    exit 1
fi
echo ""

# 6. docker-compose.all.ymlを使用してコンテナ起動
print_info "docker-composeでコンテナを起動しています..."
cd /home/ubuntu/watchme-api-manager

# docker-compose.all.ymlがない場合はdocker runで起動
if [ -f docker-compose.all.yml ]; then
    docker-compose -f docker-compose.all.yml up -d watchme-scheduler-prod
else
    print_warning "docker-compose.all.ymlが見つかりません。docker runで起動します..."
    docker run -d \
        --name ${CONTAINER_NAME} \
        --env-file /home/ubuntu/watchme-api-manager/.env \
        -v /home/ubuntu/scheduler:/home/ubuntu/scheduler \
        -v /var/log/scheduler:/var/log/scheduler \
        -p 8015:8015 \
        ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:latest
fi
print_success "コンテナ起動完了"
echo ""

# 7. watchme-networkへの接続
print_info "watchme-networkに接続しています..."
docker network connect watchme-network ${CONTAINER_NAME} 2>/dev/null && \
    print_success "watchme-networkに接続しました" || \
    print_info "既にwatchme-networkに接続済みです"
echo ""

# 8. 起動確認
print_info "コンテナの起動状態を確認しています..."
sleep 3
if docker ps | grep ${CONTAINER_NAME} > /dev/null; then
    print_success "スケジューラーコンテナが正常に起動しています"
    docker ps | grep ${CONTAINER_NAME}
else
    print_error "コンテナが起動していません！"
    echo "ログを確認してください："
    docker logs ${CONTAINER_NAME} --tail 50
    exit 1
fi
echo ""

# 9. APIヘルスチェック
print_info "APIヘルスチェックを実行しています..."
sleep 2
if curl -f http://localhost:8015/ > /dev/null 2>&1; then
    print_success "スケジューラーAPIが正常に応答しています"
else
    print_warning "APIの起動に時間がかかっています。もう少し待ってから再度確認してください"
fi
echo ""

# 10. config.json生成の案内
print_warning "重要: config.jsonの生成"
echo "========================================="
echo "デバイスIDの設定を反映するため、以下を実行してください："
echo ""
echo "1. ブラウザで API Manager を開く:"
echo "   https://api.hey-watch.me/manager/"
echo ""
echo "2. 各デバイスベースAPIの設定を保存:"
echo "   - behavior-aggregator (行動グラフ)"
echo "   - vibe-aggregator (心理プロンプト生成)"
echo "   - vibe-scorer (心理スコアリング)"
echo "   - emotion-aggregator (感情集計)"
echo ""
echo "   デバイスID: 9f7d6e27-98c3-4c19-bdfb-f7fda58b9a93"
echo "========================================="
echo ""

# 11. 設定ファイルの確認
if [ -f /home/ubuntu/scheduler/config.json ]; then
    print_success "config.jsonが存在します"
    echo "現在のデバイスID設定:"
    cat /home/ubuntu/scheduler/config.json | jq -r '.apis[].deviceId' | sort -u | head -5
else
    print_warning "config.jsonがまだ存在しません"
    print_info "フロントエンドから設定を保存してください"
fi
echo ""

# 12. テストコマンドの案内
print_info "動作確認用コマンド:"
echo "----------------------------------------"
echo "# コンテナログの確認:"
echo "docker logs ${CONTAINER_NAME} --tail 50"
echo ""
echo "# スケジューラーログの確認:"
echo "tail -f /var/log/scheduler/scheduler-behavior-aggregator.log"
echo ""
echo "# 手動実行テスト:"
echo "docker exec ${CONTAINER_NAME} python /app/run-api-process-docker.py behavior-aggregator"
echo ""
echo "# API状態確認:"
echo "curl http://localhost:8015/api/scheduler/status/behavior-aggregator"
echo "----------------------------------------"
echo ""

print_success "=== [EC2編] デプロイが完了しました ==="
echo ""
print_warning "次のステップ: フロントエンドから各APIの設定を保存してconfig.jsonを生成してください"