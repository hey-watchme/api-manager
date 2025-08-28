#!/bin/bash

# WatchMe - 全コンテナをwatchme-networkに再接続するスクリプト
# コンテナ再作成後のネットワーク切断問題を解決します

echo "======================================"
echo "WatchMe コンテナネットワーク再接続"
echo "======================================"
echo ""

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 必須コンテナのリスト
CONTAINERS=(
    "watchme-scheduler-prod"      # スケジューラー
    "watchme-api-manager-prod"     # API Manager
    "api-transcriber"              # Whisper書き起こし
    "vibe-transcriber-v2"          # Azure Speech書き起こし
    "api_gen_prompt_mood_chart"    # プロンプト生成
    "api-gpt-v1"                   # スコアリング
    "api_sed_v1-sed_api-1"         # 音声イベント検出
    "api-sed-aggregator"           # 行動集計
    "opensmile-api"                # 感情特徴量抽出
    "opensmile-aggregator"         # 感情集計
    "watchme-vault-api"            # Vault API
    "watchme-web-prod"             # Webダッシュボード
    "watchme-admin"                # 管理画面
)

echo "接続対象: ${#CONTAINERS[@]} コンテナ"
echo ""

# 各コンテナを接続
success_count=0
already_connected_count=0
not_found_count=0

for container in "${CONTAINERS[@]}"; do
    # コンテナが存在するか確認
    if ! docker ps | grep -q "$container"; then
        echo -e "${YELLOW}⚠️  $container - コンテナが起動していません${NC}"
        ((not_found_count++))
        continue
    fi
    
    # ネットワークに接続
    if docker network connect watchme-network "$container" 2>/dev/null; then
        echo -e "${GREEN}✅ $container - 接続完了${NC}"
        ((success_count++))
    else
        # 既に接続済みか確認
        if docker network inspect watchme-network 2>/dev/null | grep -q "\"$container\""; then
            echo -e "⚪ $container - 既に接続済み"
            ((already_connected_count++))
        else
            echo -e "${RED}❌ $container - 接続失敗${NC}"
        fi
    fi
done

echo ""
echo "======================================"
echo "接続結果サマリー:"
echo "======================================"
echo -e "${GREEN}✅ 新規接続: $success_count${NC}"
echo -e "⚪ 既に接続済み: $already_connected_count"
echo -e "${YELLOW}⚠️  起動していない: $not_found_count${NC}"
echo ""

# 接続状態の確認
echo "現在watchme-networkに接続されているコンテナ:"
echo "----------------------------------------"
docker network inspect watchme-network 2>/dev/null | \
    jq -r '.[] | .Containers | to_entries[] | "\(.value.Name)"' | \
    sort | while read container; do
        if [[ " ${CONTAINERS[@]} " =~ " ${container} " ]]; then
            echo -e "${GREEN}✓${NC} $container"
        else
            echo "  $container (その他)"
        fi
    done

echo ""
echo "======================================"
echo "推奨される次のステップ:"
echo "======================================"

if [ $not_found_count -gt 0 ]; then
    echo "1. 起動していないコンテナを確認:"
    echo "   docker ps -a | grep -E 'Exited|Created'"
    echo ""
fi

echo "2. スケジューラーの動作確認:"
echo "   ./diagnose-scheduler.sh"
echo ""
echo "3. 手動でスケジューラーをテスト:"
echo "   docker exec watchme-scheduler-prod python /app/run-api-process-docker.py whisper"
echo ""