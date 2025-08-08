#!/bin/bash

# WatchMe Scheduler デプロイスクリプト

set -e

echo "🚀 WatchMe Scheduler デプロイ開始"

# EC2設定
EC2_HOST="3.24.16.82"
EC2_USER="ubuntu"
KEY_PATH="$HOME/watchme-key.pem"

# ローカルファイルをEC2にコピー
echo "📦 ファイルをEC2にアップロード中..."

# scheduler ディレクトリ作成
ssh -i "$KEY_PATH" "$EC2_USER@$EC2_HOST" "mkdir -p /home/ubuntu/scheduler"

# Pythonファイルをコピー
scp -i "$KEY_PATH" scheduler-api-server.py "$EC2_USER@$EC2_HOST:/home/ubuntu/scheduler/"
scp -i "$KEY_PATH" run-api-process.py "$EC2_USER@$EC2_HOST:/home/ubuntu/scheduler/"

# 実行権限付与
ssh -i "$KEY_PATH" "$EC2_USER@$EC2_HOST" "chmod +x /home/ubuntu/scheduler/*.py"

# 依存関係をインストール
echo "📚 依存関係をインストール中..."
ssh -i "$KEY_PATH" "$EC2_USER@$EC2_HOST" << 'EOF'
    cd /home/ubuntu/scheduler
    
    # 仮想環境作成
    python3 -m venv venv
    source venv/bin/activate
    
    # Python依存関係インストール
    pip install fastapi uvicorn python-multipart supabase requests
    
    # ログディレクトリ作成
    sudo mkdir -p /var/log/scheduler
    sudo chown ubuntu:ubuntu /var/log/scheduler
    
    # 環境変数設定（whisper APIの.envを参照）
    if [ -f "/home/ubuntu/api_whisper_v1/.env" ]; then
        cp /home/ubuntu/api_whisper_v1/.env /home/ubuntu/scheduler/.env
        echo "環境変数をコピーしました"
    else
        echo "警告: whisper APIの.envファイルが見つかりません"
    fi
EOF

# スケジューラーAPIサービス起動
echo "🔧 Scheduler APIサービスを起動中..."
ssh -i "$KEY_PATH" "$EC2_USER@$EC2_HOST" << 'EOF'
    cd /home/ubuntu/scheduler
    
    # 既存プロセス停止
    pkill -f "scheduler-api-server.py" || true
    
    # 仮想環境でバックグラウンド起動
    source venv/bin/activate
    nohup python scheduler-api-server.py > scheduler-api.log 2>&1 &
    
    sleep 5
    
    # 起動確認
    if curl -f http://localhost:8015/ > /dev/null 2>&1; then
        echo "✅ Scheduler API起動成功 (ポート8015)"
    else
        echo "❌ Scheduler API起動失敗"
        echo "ログ確認:"
        tail -10 scheduler-api.log
        exit 1
    fi
EOF

echo "🎉 WatchMe Scheduler デプロイ完了！"
echo ""
echo "📋 確認事項:"
echo "- Scheduler API: http://$EC2_HOST:8015/"
echo "- ログファイル: /home/ubuntu/scheduler/scheduler-api.log"
echo "- cron設定: /etc/cron.d/watchme-scheduler"
echo ""
echo "📝 次のステップ:"
echo "1. APIマネージャーでWhisper自動処理を有効化"
echo "2. ログで動作確認: ssh -i $KEY_PATH $EC2_USER@$EC2_HOST 'tail -f /home/ubuntu/scheduler/scheduler-api.log'"