#!/bin/bash

# ==================================================
# WatchMe Scheduler Cron デプロイスクリプト
# ==================================================
# このスクリプトは、スケジューラーのcron設定をEC2サーバーに
# デプロイし、必要な設定を行います。
#
# 使用方法:
#   ./deploy-scheduler-cron.sh
# ==================================================

# 設定
SERVER_IP="3.24.16.82"
SERVER_USER="ubuntu"
KEY_PATH="$HOME/watchme-key.pem"
SCHEDULER_DIR="/home/ubuntu/scheduler"

# 色付きログ出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}===================================================${NC}"
echo -e "${GREEN}WatchMe Scheduler Cron デプロイ開始${NC}"
echo -e "${GREEN}===================================================${NC}"

# ステップ0: サーバーにデプロイ用ディレクトリを作成
echo -e "\n${YELLOW}ステップ0: サーバーにデプロイ用ディレクトリを作成${NC}"
ssh -i "$KEY_PATH" "$SERVER_USER@$SERVER_IP" "mkdir -p $SCHEDULER_DIR && sudo chown $SERVER_USER:$SERVER_USER $SCHEDULER_DIR" || {
    echo -e "${RED}エラー: ディレクトリの作成または権限の付与に失敗しました${NC}"
    exit 1
}
echo -e "${GREEN}  ✅ デプロイ用ディレクトリ準備完了${NC}"

# ステップ1: 必要なファイルをサーバーにコピー（一時ディレクトリ経由）
echo -e "\n${YELLOW}ステップ1: 必要なファイルをサーバーにコピー（一時ディレクトリ経由）${NC}"

# run_if_enabled.pyを/tmpにコピーし、移動と権限設定
echo "  - run_if_enabled.py をコピー中..."
scp -i "$KEY_PATH" scheduler/run_if_enabled.py "$SERVER_USER@$SERVER_IP:/tmp/" || {
    echo -e "${RED}エラー: run_if_enabled.py の一時ディレクトリへのコピーに失敗しました${NC}"
    exit 1
}
ssh -i "$KEY_PATH" "$SERVER_USER@$SERVER_IP" "sudo mv /tmp/run_if_enabled.py $SCHEDULER_DIR/ && sudo chown $SERVER_USER:$SERVER_USER $SCHEDULER_DIR/run_if_enabled.py" || {
    echo -e "${RED}エラー: run_if_enabled.py の最終配置に失敗しました${NC}"
    exit 1
}
echo -e "${GREEN}  ✅ run_if_enabled.py コピー完了${NC}"

# watchme-scheduler-cronを/tmpにコピーし、移動と権限設定
echo "  - watchme-scheduler-cron をコピー中..."
scp -i "$KEY_PATH" scheduler/watchme-scheduler-cron "$SERVER_USER@$SERVER_IP:/tmp/" || {
    echo -e "${RED}エラー: watchme-scheduler-cron の一時ディレクトリへのコピーに失敗しました${NC}"
    exit 1
}
ssh -i "$KEY_PATH" "$SERVER_USER@$SERVER_IP" "sudo mv /tmp/watchme-scheduler-cron $SCHEDULER_DIR/ && sudo chown $SERVER_USER:$SERVER_USER $SCHEDULER_DIR/watchme-scheduler-cron" || {
    echo -e "${RED}エラー: watchme-scheduler-cron の最終配置に失敗しました${NC}"
    exit 1
}
echo -e "${GREEN}  ✅ watchme-scheduler-cron コピー完了${NC}"


# ステップ2: サーバー上で設定を実行
echo -e "\n${YELLOW}ステップ2: サーバー上で設定を実行${NC}"

ssh -i "$KEY_PATH" "$SERVER_USER@$SERVER_IP" << 'EOF'
    set -e  # エラーが発生したら停止

    echo "  - 実行権限を付与中..."
    chmod +x /home/ubuntu/scheduler/run_if_enabled.py
    echo "  ✅ 実行権限付与完了"

    echo "  - cronファイルを設置中..."
    sudo cp /home/ubuntu/scheduler/watchme-scheduler-cron /etc/cron.d/watchme-scheduler
    sudo chmod 644 /etc/cron.d/watchme-scheduler
    echo "  ✅ cronファイル設置完了"

    echo "  - ログディレクトリを作成中..."
    sudo mkdir -p /var/log/scheduler
    sudo chown ubuntu:ubuntu /var/log/scheduler
    echo "  ✅ ログディレクトリ作成完了"

    echo "  - cronサービスをリロード中..."
    sudo systemctl reload cron
    echo "  ✅ cronサービスリロード完了"

    # 設定ファイルの存在確認
    if [ -f "/home/ubuntu/scheduler/config.json" ]; then
        echo "  ✅ config.json が存在します"
    else
        echo "  ⚠️  config.json が存在しません - API Managerから設定を保存してください"
    fi

    # cron設定の確認
    echo ""
    echo "=== 設定されたcronジョブ ==="
    cat /etc/cron.d/watchme-scheduler | grep -v "^#" | head -5
    echo "..."
EOF

# ステップ3: テストコマンドの表示
echo -e "\n${GREEN}===================================================${NC}"
echo -e "${GREEN}デプロイ完了！${NC}"
echo -e "${GREEN}===================================================${NC}"

echo -e "\n${YELLOW}動作確認方法:${NC}"
echo ""
echo "1. API ManagerのUIから、テストしたいAPIのスケジュールをONに設定"
echo "   https://api.hey-watch.me/manager/"
echo ""
echo "2. 手動テスト実行（サーバー上で実行）:"
echo "   ssh -i $KEY_PATH $SERVER_USER@$SERVER_IP"
echo "   python3 /home/ubuntu/scheduler/run_if_enabled.py whisper"
echo ""
echo "3. ログファイルの監視:"
echo "   ssh -i $KEY_PATH $SERVER_USER@$SERVER_IP"
echo "   tail -f /var/log/scheduler/scheduler-whisper.log"
echo ""
echo "4. cron実行ログの確認:"
echo "   ssh -i $KEY_PATH $SERVER_USER@$SERVER_IP"
echo "   tail -f /var/log/scheduler/cron.log"
echo ""
echo "5. 実行時刻:"
echo "   - 毎時10分: whisper, behavior-features"
echo "   - 毎時20分: vibe-aggregator, behavior-aggregator, emotion-features"
echo "   - 毎時30分: emotion-aggregator"
echo "   - 3時間ごとの30分: vibe-scorer"
