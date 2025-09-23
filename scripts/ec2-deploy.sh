#!/bin/bash

#==============================================================================
# EC2デプロイメントスクリプト
# API Manager (Frontend + Backend/Scheduler) の本番環境デプロイ用
#==============================================================================

set -e

# カラー出力用の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 設定
ECR_REGISTRY="754724220380.dkr.ecr.ap-southeast-2.amazonaws.com"
FRONTEND_IMAGE="$ECR_REGISTRY/watchme-api-manager:latest"
BACKEND_IMAGE="$ECR_REGISTRY/watchme-api-manager-scheduler:latest"

echo -e "${GREEN}=== API Manager デプロイメントスクリプト ===${NC}"
echo ""

# 1. ECRログイン
echo -e "${YELLOW}[1/5] ECRにログイン中...${NC}"
aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin $ECR_REGISTRY
echo -e "${GREEN}✓ ECRログイン完了${NC}"
echo ""

# 2. 最新イメージをプル
echo -e "${YELLOW}[2/5] 最新のDockerイメージをプル中...${NC}"
docker pull $FRONTEND_IMAGE
docker pull $BACKEND_IMAGE
echo -e "${GREEN}✓ イメージのプル完了${NC}"
echo ""

# 3. 既存コンテナを停止・削除
echo -e "${YELLOW}[3/5] 既存コンテナを停止・削除中...${NC}"

# Frontend
if docker ps -a | grep -q api-manager-frontend; then
    docker stop api-manager-frontend || true
    docker rm api-manager-frontend || true
    echo "  - Frontendコンテナを削除しました"
fi

# Backend/Scheduler
if docker ps -a | grep -q watchme-scheduler-prod; then
    docker stop watchme-scheduler-prod || true
    docker rm watchme-scheduler-prod || true
    echo "  - Backend/Schedulerコンテナを削除しました"
fi

echo -e "${GREEN}✓ 既存コンテナの削除完了${NC}"
echo ""

# 4. ネットワークの確認・作成
echo -e "${YELLOW}[4/5] Dockerネットワークを確認中...${NC}"
if ! docker network ls | grep -q watchme-network; then
    docker network create watchme-network
    echo "  - watchme-networkを作成しました"
else
    echo "  - watchme-networkは既に存在します"
fi
echo -e "${GREEN}✓ ネットワーク準備完了${NC}"
echo ""

# 5. 新しいコンテナを起動
echo -e "${YELLOW}[5/5] 新しいコンテナを起動中...${NC}"

# Frontend起動
echo "  Frontend (React) を起動中..."
docker run -d \
    --name api-manager-frontend \
    --network watchme-network \
    -p 9001:9001 \
    --restart unless-stopped \
    $FRONTEND_IMAGE

# Backend/Scheduler起動
echo "  Backend/Scheduler (Python) を起動中..."

# 環境変数ファイルの確認
ENV_FILE="/home/ubuntu/watchme-api-manager/.env"
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}警告: 環境変数ファイルが見つかりません: $ENV_FILE${NC}"
    echo "デフォルト設定で起動します..."
    docker run -d \
        --name watchme-scheduler-prod \
        --network watchme-network \
        -p 8015:8015 \
        --restart unless-stopped \
        $BACKEND_IMAGE
else
    docker run -d \
        --name watchme-scheduler-prod \
        --network watchme-network \
        -p 8015:8015 \
        --restart unless-stopped \
        --env-file $ENV_FILE \
        $BACKEND_IMAGE
fi

echo -e "${GREEN}✓ コンテナ起動完了${NC}"
echo ""

# 6. 関連コンテナのネットワーク接続確認
echo -e "${YELLOW}関連コンテナをネットワークに接続中...${NC}"
CONTAINERS=(
    "api-transcriber"
    "api_gen_prompt_mood_chart"
    "api-gpt-v1"
    "api_sed_v1-sed_api-1"
    "api-sed-aggregator"
    "opensmile-api"
    "opensmile-aggregator"
    "vibe-transcriber-v2"
)

for container in "${CONTAINERS[@]}"; do
    if docker ps | grep -q $container; then
        docker network connect watchme-network $container 2>/dev/null || true
        echo "  ✓ $container"
    fi
done
echo ""

# 7. ヘルスチェック
echo -e "${YELLOW}ヘルスチェックを実行中...${NC}"
sleep 10

# Frontend
if curl -f http://localhost:9001/ > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ Frontend: 正常動作中${NC}"
else
    echo -e "  ${YELLOW}⚠ Frontend: 起動中...${NC}"
fi

# Backend
if curl -f http://localhost:8015/health > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ Backend/Scheduler: 正常動作中${NC}"
else
    echo -e "  ${YELLOW}⚠ Backend/Scheduler: 起動中...${NC}"
fi

echo ""

# 8. 最終確認
echo -e "${GREEN}=== デプロイメント完了 ===${NC}"
echo ""
echo "稼働中のコンテナ:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(api-manager-frontend|watchme-scheduler-prod)"

echo ""
echo -e "${GREEN}アクセスURL:${NC}"
echo "  Frontend: http://$(curl -s ifconfig.me):9001"
echo "  Backend API: http://$(curl -s ifconfig.me):8015"
echo "  Frontend (内部): http://localhost:9001"
echo "  Backend API (内部): http://localhost:8015"

echo ""
echo -e "${YELLOW}ログを確認するには:${NC}"
echo "  docker logs api-manager-frontend"
echo "  docker logs watchme-scheduler-prod"

echo ""
echo -e "${GREEN}デプロイメントが正常に完了しました！${NC}"