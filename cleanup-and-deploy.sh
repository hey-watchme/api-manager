#!/bin/bash

# 既存デプロイのクリーンアップとECRベースの新デプロイ
set -e

# 変数設定
EC2_HOST="3.24.16.82"
SSH_KEY="$HOME/watchme-key.pem"
EC2_USER="ubuntu"
ECR_REPOSITORY="754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-api-manager"
AWS_REGION="ap-southeast-2"

echo "=== 既存デプロイのクリーンアップとECR移行 ==="

# SSH接続テスト
echo "🔍 EC2サーバーとの接続をテスト中..."
if ! ssh -i "$SSH_KEY" -o ConnectTimeout=10 "$EC2_USER@$EC2_HOST" "echo 'SSH接続成功'" 2>/dev/null; then
    echo "❌ EC2サーバーへの接続に失敗しました"
    exit 1
fi

echo "📋 現在の状況を確認中..."
ssh -i "$SSH_KEY" "$EC2_USER@$EC2_HOST" << 'EOF'
echo "現在実行中のapi-managerコンテナ:"
sudo docker ps | grep -i manager || echo "api-managerコンテナなし"
echo ""
echo "現在のapi-managerディレクトリ:"
ls -la ~/api-manager/ | head -5
EOF

read -p "📝 既存のデプロイメントをクリーンアップしてECRベースに移行しますか？ (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ デプロイをキャンセルしました"
    exit 1
fi

# プロダクション用設定ファイルをアップロード
echo "📤 本番用設定ファイルを転送中..."
scp -i "$SSH_KEY" "docker-compose.prod.yml" "$EC2_USER@$EC2_HOST:~/docker-compose.prod.yml"
scp -i "$SSH_KEY" ".env.example" "$EC2_USER@$EC2_HOST:~/.env.example"

# EC2サーバーでクリーンアップとデプロイを実行
echo "🧹 EC2サーバーでクリーンアップとデプロイを実行中..."
ssh -i "$SSH_KEY" "$EC2_USER@$EC2_HOST" << EOF
set -e

echo "🔄 既存デプロイのクリーンアップ開始..."

# 現在のapi-managerコンテナを停止・削除
echo "📦 既存のapi-managerコンテナを停止中..."
if sudo docker ps -q --filter "name=watchme-api-manager" | grep -q .; then
    echo "既存のwatchme-api-managerコンテナを停止・削除します"
    sudo docker stop watchme-api-manager || true
    sudo docker rm watchme-api-manager || true
    echo "✅ 既存コンテナを削除しました"
else
    echo "ℹ️ 既存のwatchme-api-managerコンテナはありません"
fi

# 既存のapi-managerディレクトリをバックアップ
if [ -d "api-manager" ]; then
    backup_name="api-manager-backup-\$(date +%Y%m%d-%H%M%S)"
    echo "📂 既存のapi-managerディレクトリを \$backup_name にバックアップ"
    mv api-manager "\$backup_name"
    echo "✅ バックアップ完了: \$backup_name"
fi

# 不要なDockerイメージをクリーンアップ
echo "🧹 不要なDockerイメージをクリーンアップ..."
sudo docker image prune -f || true
sudo docker images | grep "api-manager" | awk '{print \$3}' | xargs -r sudo docker rmi || true

echo "🚀 ECRベースの新デプロイ開始..."

# ECRにログイン
echo "🔐 ECRにログイン中..."
aws ecr get-login-password --region $AWS_REGION | sudo docker login --username AWS --password-stdin $ECR_REPOSITORY

# 最新イメージをプル
echo "⬇️ 最新のECRイメージをプル中..."
sudo docker pull $ECR_REPOSITORY:latest

# 環境変数ファイルを準備
if [ ! -f .env ]; then
    echo "📄 環境変数ファイルを準備中..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ .env.exampleから.envを作成しました"
    else
        echo "⚠️ .envファイルが必要です。手動で作成してください。"
    fi
fi

# Docker Composeで新しいコンテナを起動
echo "🚀 ECRイメージベースでアプリケーションを起動中..."
sudo docker-compose -f docker-compose.prod.yml up -d

# 起動確認
echo "⏳ アプリケーションの起動を確認中..."
sleep 15

# コンテナの状態確認
if sudo docker ps | grep -q "watchme-api-manager-prod"; then
    echo "✅ ECRベースのアプリケーションコンテナが正常に起動しました"
    
    # ヘルスチェック
    if curl -s http://localhost:9001/ > /dev/null; then
        echo "✅ アプリケーションが正常に応答しています"
        echo "📊 コンテナ情報:"
        sudo docker ps | grep watchme-api-manager-prod
        echo ""
        echo "🔍 使用イメージの確認:"
        sudo docker inspect watchme-api-manager-prod | grep -A1 '"Image"'
    else
        echo "⚠️ アプリケーションが応答していません。ログを確認します。"
        sudo docker logs watchme-api-manager-prod --tail 20
    fi
else
    echo "❌ アプリケーションコンテナの起動に失敗しました"
    sudo docker ps -a | grep watchme-api-manager-prod
    sudo docker logs watchme-api-manager-prod
    exit 1
fi

echo "🎉 ECRベースデプロイ完了！"
echo "📍 ローカルアクセス: http://localhost:9001"
echo "🌐 次のステップ: Nginx設定でhttps://api.hey-watch.me/manager/を有効化"
EOF

echo "=== ECRベースデプロイ完了 ==="
echo ""
echo "🔧 次のステップ - Nginx設定:"
echo "1. EC2にSSH接続: ssh -i $SSH_KEY $EC2_USER@$EC2_HOST"
echo "2. Nginx設定編集: sudo nano /etc/nginx/sites-available/api.hey-watch.me"
echo "3. nginx-config.txtの内容を追加"
echo "4. 設定テスト: sudo nginx -t"
echo "5. Nginx再起動: sudo systemctl reload nginx"