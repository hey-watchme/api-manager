#!/bin/bash
# Scheduler EC2デプロイスクリプト

set -e

echo "🚀 WatchMe Scheduler EC2デプロイを開始します"

# 設定
EC2_HOST="3.24.16.82"
EC2_USER="ubuntu"
KEY_PATH="$HOME/watchme-key.pem"
AWS_REGION="ap-southeast-2"
ECR_REPOSITORY="754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-api-manager-scheduler"

# Step 1: ECRにイメージをプッシュ
echo ""
echo "📦 Step 1: ECRにイメージをプッシュ"
echo "=================================="
cd scheduler/
./deploy-ecr.sh
cd ..

# Step 2: EC2にファイルを転送
echo ""
echo "📤 Step 2: EC2にファイルを転送"
echo "=================================="
echo "schedulerディレクトリを作成..."
ssh -i "$KEY_PATH" "$EC2_USER@$EC2_HOST" "mkdir -p ~/scheduler"

echo "必要なファイルを転送..."
scp -i "$KEY_PATH" scheduler/docker-compose.prod.yml "$EC2_USER@$EC2_HOST:~/scheduler/"
scp -i "$KEY_PATH" scheduler/run-prod.sh "$EC2_USER@$EC2_HOST:~/scheduler/"
scp -i "$KEY_PATH" scheduler/SCHEDULER-DEPLOY.md "$EC2_USER@$EC2_HOST:~/scheduler/"

# Step 3: EC2で環境設定
echo ""
echo "⚙️  Step 3: EC2で環境設定"
echo "=================================="
ssh -i "$KEY_PATH" "$EC2_USER@$EC2_HOST" << 'EOF'
cd ~/scheduler

# 実行権限を付与
chmod +x run-prod.sh

# 環境変数をコピー（whisper APIから）
if [ -f "/home/ubuntu/api_whisper_v1/.env" ]; then
    cp /home/ubuntu/api_whisper_v1/.env .env
    echo "✅ 環境変数をコピーしました"
else
    echo "⚠️  警告: whisper APIの.envファイルが見つかりません"
    echo "SUPABASE_URLとSUPABASE_KEYを手動で設定してください"
fi

# ログディレクトリを作成
sudo mkdir -p /var/log/scheduler
sudo chown ubuntu:ubuntu /var/log/scheduler

# cron.dディレクトリの権限設定
sudo chmod 755 /etc/cron.d
EOF

# Step 4: コンテナを起動
echo ""
echo "🐳 Step 4: Schedulerコンテナを起動"
echo "=================================="
ssh -i "$KEY_PATH" "$EC2_USER@$EC2_HOST" << 'EOF'
cd ~/scheduler

# 既存のschedulerコンテナを停止（存在する場合）
docker stop watchme-scheduler-prod 2>/dev/null || true
docker rm watchme-scheduler-prod 2>/dev/null || true

# run-prod.shを実行
./run-prod.sh
EOF

# Step 5: 動作確認
echo ""
echo "✨ Step 5: 動作確認"
echo "=================================="
sleep 10

echo "ヘルスチェック..."
if ssh -i "$KEY_PATH" "$EC2_USER@$EC2_HOST" "curl -s http://localhost:8015/" | grep -q "running"; then
    echo "✅ Scheduler APIが正常に起動しました！"
else
    echo "❌ Scheduler APIの起動に失敗しました"
    echo "ログを確認中..."
    ssh -i "$KEY_PATH" "$EC2_USER@$EC2_HOST" "docker logs watchme-scheduler-prod --tail 20"
    exit 1
fi

echo ""
echo "🎉 デプロイ完了！"
echo ""
echo "📋 確認コマンド:"
echo "  - API確認: curl http://$EC2_HOST:8015/"
echo "  - ログ確認: ssh -i $KEY_PATH $EC2_USER@$EC2_HOST 'docker logs -f watchme-scheduler-prod'"
echo "  - コンテナ状態: ssh -i $KEY_PATH $EC2_USER@$EC2_HOST 'docker ps | grep scheduler'"
echo ""
echo "🔧 次のステップ:"
echo "  1. API Managerで自動処理を有効化: http://localhost:9001"
echo "  2. cron設定確認: ssh -i $KEY_PATH $EC2_USER@$EC2_HOST 'cat /etc/cron.d/watchme-scheduler'"