#!/bin/bash

# 本番環境デプロイスクリプト
set -e

# 変数設定
EC2_HOST="3.24.16.82"  # READMEから取得
SSH_KEY="$HOME/watchme-key.pem"
EC2_USER="ubuntu"
ECR_REPOSITORY="754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-api-manager"
AWS_REGION="ap-southeast-2"
COMPOSE_FILE="docker-compose.prod.yml"

echo "=== 本番環境デプロイ開始 ==="

# SSH接続テスト
echo "EC2サーバーとの接続をテスト中..."
if ! ssh -i "$SSH_KEY" -o ConnectTimeout=10 "$EC2_USER@$EC2_HOST" "echo 'SSH接続成功'" 2>/dev/null; then
    echo "❌ EC2サーバーへの接続に失敗しました"
    echo "SSH key: $SSH_KEY"
    echo "Host: $EC2_USER@$EC2_HOST"
    exit 1
fi

# プロダクション用設定ファイルをアップロード
echo "本番用設定ファイルを転送中..."
scp -i "$SSH_KEY" "$COMPOSE_FILE" "$EC2_USER@$EC2_HOST:~/docker-compose.prod.yml"
scp -i "$SSH_KEY" ".env.example" "$EC2_USER@$EC2_HOST:~/.env.example"

# 本番環境でデプロイを実行
echo "EC2サーバーでデプロイを実行中..."
ssh -i "$SSH_KEY" "$EC2_USER@$EC2_HOST" << EOF
set -e

echo "🔄 本番環境でのデプロイ処理開始..."

# ECRにログイン
echo "ECRにログイン中..."
aws ecr get-login-password --region $AWS_REGION | sudo docker login --username AWS --password-stdin $ECR_REPOSITORY

# 最新イメージをプル
echo "最新のECRイメージをプル中..."
sudo docker pull $ECR_REPOSITORY:latest

# 既存コンテナを停止
echo "既存のコンテナを停止中..."
if sudo docker ps -q --filter "name=watchme-api-manager-prod" | grep -q .; then
    sudo docker stop watchme-api-manager-prod || true
    sudo docker rm watchme-api-manager-prod || true
fi

# 環境変数ファイルをチェック
if [ ! -f .env ]; then
    echo "⚠️ .envファイルが見つかりません。.env.exampleからコピーしてください"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "📄 .env.exampleから.envを作成しました。必要に応じて設定を確認してください。"
    fi
fi

# Docker Composeで起動
echo "Docker Composeでアプリケーションを起動中..."
sudo docker-compose -f docker-compose.prod.yml up -d

# 起動確認
echo "アプリケーションの起動を確認中..."
sleep 10

# コンテナの状態確認
if sudo docker ps | grep -q "watchme-api-manager-prod"; then
    echo "✅ アプリケーションコンテナが正常に起動しました"
    sudo docker logs watchme-api-manager-prod --tail 10
    
    # ヘルスチェック
    if curl -s http://localhost:9001/ > /dev/null; then
        echo "✅ アプリケーションが正常に応答しています"
    else
        echo "⚠️ アプリケーションが応答していません。ログを確認してください。"
        sudo docker logs watchme-api-manager-prod --tail 20
    fi
else
    echo "❌ アプリケーションコンテナの起動に失敗しました"
    sudo docker ps -a | grep watchme-api-manager-prod
    sudo docker logs watchme-api-manager-prod
    exit 1
fi

echo "🎉 本番環境デプロイ完了！"
echo "ローカルアクセス: http://localhost:9001"
echo "次のステップ: Nginx設定でリバースプロキシを設定してください"

EOF

echo "=== 本番環境デプロイ完了 ==="
echo "次のステップ: Nginx設定"
echo ""
echo "Nginx設定コマンド:"
echo "ssh -i $SSH_KEY $EC2_USER@$EC2_HOST"
echo "sudo nano /etc/nginx/sites-available/api.hey-watch.me"