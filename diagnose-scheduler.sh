#!/bin/bash

echo "======================================"
echo "WatchMe スケジューラー診断スクリプト"
echo "======================================"
echo ""

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. watchme-scheduler-prodコンテナの存在確認
echo "1. スケジューラーコンテナの確認:"
echo "--------------------------------"
if docker ps | grep -q "watchme-scheduler-prod"; then
    echo -e "${GREEN}✅ watchme-scheduler-prodコンテナは稼働中${NC}"
    docker ps | grep watchme-scheduler-prod
else
    echo -e "${RED}❌ watchme-scheduler-prodコンテナが見つかりません${NC}"
    echo "修正方法:"
    echo "  cd /home/ubuntu/watchme-api-manager"
    echo "  ./deploy-scheduler-ec2.sh"
fi
echo ""

# 2. api-transcriberコンテナの存在確認
echo "2. Whisper APIコンテナの確認:"
echo "------------------------------"
if docker ps | grep -q "api-transcriber"; then
    echo -e "${GREEN}✅ api-transcriberコンテナは稼働中${NC}"
    docker ps | grep api-transcriber
else
    echo -e "${RED}❌ api-transcriberコンテナが見つかりません${NC}"
    echo "Whisper APIが別のコンテナ名で動作している可能性があります。"
    echo "関連コンテナの確認:"
    docker ps | grep -E "(whisper|transcrib|vibe)" || echo "  見つかりません"
fi
echo ""

# 3. watchme-networkへの接続確認
echo "3. ネットワーク接続の確認:"
echo "---------------------------"
echo "watchme-networkに接続されているコンテナ:"
docker network inspect watchme-network 2>/dev/null | jq -r '.[] | .Containers | to_entries[] | "\(.value.Name)"' | sort

echo ""
echo "スケジューラーの接続状態:"
if docker network inspect watchme-network 2>/dev/null | grep -q "watchme-scheduler-prod"; then
    echo -e "${GREEN}✅ watchme-scheduler-prodはwatchme-networkに接続済み${NC}"
else
    echo -e "${RED}❌ watchme-scheduler-prodはwatchme-networkに未接続${NC}"
    echo "修正方法:"
    echo "  docker network connect watchme-network watchme-scheduler-prod"
fi

echo ""
echo "Whisper APIの接続状態:"
if docker network inspect watchme-network 2>/dev/null | grep -q "api-transcriber"; then
    echo -e "${GREEN}✅ api-transcriberはwatchme-networkに接続済み${NC}"
else
    echo -e "${YELLOW}⚠️  api-transcriberはwatchme-networkに未接続${NC}"
    echo "修正方法:"
    echo "  docker network connect watchme-network api-transcriber"
fi
echo ""

# 4. config.jsonの確認
echo "4. スケジューラー設定の確認:"
echo "-----------------------------"
CONFIG_FILE="/home/ubuntu/scheduler/config.json"
if [ -f "$CONFIG_FILE" ]; then
    echo -e "${GREEN}✅ config.jsonが存在します${NC}"
    echo ""
    echo "Whisperの設定:"
    jq '.apis.whisper' "$CONFIG_FILE" 2>/dev/null || echo "  設定が見つかりません"
else
    echo -e "${RED}❌ config.jsonが見つかりません${NC}"
    echo "修正方法:"
    echo "  API Managerのスケジューラー設定画面から設定を保存してください"
fi
echo ""

# 5. 最近のログ確認
echo "5. 最近のスケジューラーログ:"
echo "-----------------------------"
LOG_FILE="/var/log/scheduler/scheduler-whisper.log"
if [ -f "$LOG_FILE" ]; then
    echo "最新のWhisperスケジューラーログ（最後の10行）:"
    tail -10 "$LOG_FILE"
else
    echo -e "${YELLOW}⚠️  ログファイルが見つかりません${NC}"
fi
echo ""

# 6. ping テスト
echo "6. コンテナ間通信テスト:"
echo "------------------------"
if docker ps | grep -q "watchme-scheduler-prod" && docker ps | grep -q "api-transcriber"; then
    echo "watchme-scheduler-prod → api-transcriber へのping:"
    docker exec watchme-scheduler-prod ping -c 1 api-transcriber 2>/dev/null && \
        echo -e "${GREEN}✅ 通信OK${NC}" || \
        echo -e "${RED}❌ 通信失敗${NC}"
else
    echo -e "${YELLOW}⚠️  テストをスキップ（必要なコンテナが起動していません）${NC}"
fi
echo ""

# 7. 手動実行テスト
echo "7. 手動実行テスト:"
echo "------------------"
echo "以下のコマンドで手動実行をテストできます:"
echo ""
echo "# 設定確認（ホスト側から）:"
echo "python3 /home/ubuntu/scheduler/run_if_enabled.py whisper"
echo ""
echo "# 直接実行（コンテナ内から）:"
echo "docker exec watchme-scheduler-prod python /app/run-api-process-docker.py whisper"
echo ""

# 8. 推奨される修正手順
echo "======================================"
echo "推奨される修正手順:"
echo "======================================"
echo ""
echo "1. すべてのコンテナをwatchme-networkに接続:"
echo "   docker network connect watchme-network watchme-scheduler-prod"
echo "   docker network connect watchme-network api-transcriber"
echo ""
echo "2. スケジューラーコンテナが存在しない場合は再デプロイ:"
echo "   cd /home/ubuntu/watchme-api-manager"
echo "   ./deploy-scheduler-ec2.sh"
echo ""
echo "3. config.jsonが存在しない場合:"
echo "   API Manager (https://api.hey-watch.me/manager/) から設定を保存"
echo ""
echo "4. 手動テスト実行:"
echo "   docker exec watchme-scheduler-prod python /app/run-api-process-docker.py whisper"
echo ""