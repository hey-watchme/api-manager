#!/bin/bash

# ECRベース直接デプロイ（確認プロンプトなし）
set -e

# 変数設定
EC2_HOST="3.24.16.82"
SSH_KEY="$HOME/watchme-key.pem"
EC2_USER="ubuntu"
ECR_REPOSITORY="754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-api-manager"
AWS_REGION="ap-southeast-2"

echo "=== ECRベース直接デプロイ実行 ==="

# プロダクション用設定ファイルをアップロード
echo "📤 本番用設定ファイルを転送中..."
scp -i "$SSH_KEY" "docker-compose.prod.yml" "$EC2_USER@$EC2_HOST:~/docker-compose.prod.yml"
scp -i "$SSH_KEY" ".env.example" "$EC2_USER@$EC2_HOST:~/.env.example"

# EC2サーバーでクリーンアップとデプロイを実行
echo "🚀 EC2サーバーでデプロイを実行中..."
ssh -i "$SSH_KEY" "$EC2_USER@$EC2_HOST" << 'EOF'
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
    backup_name="api-manager-backup-$(date +%Y%m%d-%H%M%S)"
    echo "📂 既存のapi-managerディレクトリを $backup_name にバックアップ"
    mv api-manager "$backup_name"
    echo "✅ バックアップ完了: $backup_name"
fi

echo "🚀 ECRベースの新デプロイ開始..."

# ECRにログイン
echo "🔐 ECRにログイン中..."
aws ecr get-login-password --region ap-southeast-2 | sudo docker login --username AWS --password-stdin 754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-api-manager

# 最新イメージをプル
echo "⬇️ 最新のECRイメージをプル中..."
sudo docker pull 754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-api-manager:latest

# 環境変数ファイルを準備
if [ ! -f .env ]; then
    echo "📄 環境変数ファイルを準備中..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ .env.exampleから.envを作成しました"
    else
        echo "⚠️ .envファイルが必要です。デフォルト設定で作成します。"
        cat > .env << 'ENVEOF'
VITE_SUPABASE_URL=https://qvtlwotzuzbavrzqhyvt.supabase.co
VITE_SUPABASE_KEY=your_supabase_anon_key
VITE_API_BASE_URL=https://api.hey-watch.me
VITE_PORT=9001
VITE_API_TIMEOUT=30000
ENVEOF
    fi
fi

# Docker Composeで新しいコンテナを起動
echo "🚀 ECRイメージベースでアプリケーションを起動中..."
sudo docker-compose -f docker-compose.prod.yml up -d

# 起動確認
echo "⏳ アプリケーションの起動を確認中..."
sleep 20

# コンテナの状態確認
if sudo docker ps | grep -q "watchme-api-manager-prod"; then
    echo "✅ ECRベースのアプリケーションコンテナが正常に起動しました"
    
    # コンテナ情報を表示
    echo "📊 コンテナ情報:"
    sudo docker ps | grep watchme-api-manager-prod
    echo ""
    
    # 使用イメージの確認
    echo "🔍 使用イメージの確認:"
    sudo docker inspect watchme-api-manager-prod | grep '"Image"' | head -1
    echo ""
    
    # ヘルスチェック
    echo "🏥 ヘルスチェック実行中..."
    if curl -s http://localhost:9001/ > /dev/null; then
        echo "✅ アプリケーションが正常に応答しています"
        
        # 簡単なHTMLレスポンス確認
        response=$(curl -s http://localhost:9001/ | head -1)
        echo "📄 レスポンス: $response"
    else
        echo "⚠️ アプリケーションが応答していません。ログを確認します。"
        sudo docker logs watchme-api-manager-prod --tail 10
    fi
    
    # 最新ログを表示
    echo "📋 最新ログ（最後の5行）:"
    sudo docker logs watchme-api-manager-prod --tail 5
    
else
    echo "❌ アプリケーションコンテナの起動に失敗しました"
    echo "コンテナ一覧:"
    sudo docker ps -a | grep -i manager
    echo "詳細ログ:"
    sudo docker logs watchme-api-manager-prod
    exit 1
fi

echo ""
echo "🎉 ECRベースデプロイ完了！"
echo "📍 ローカルアクセス: http://localhost:9001"
echo "🌐 次のステップ: Nginx設定でhttps://api.hey-watch.me/manager/を有効化"
echo "🔧 Nginx設定コマンド: sudo nano /etc/nginx/sites-available/api.hey-watch.me"

EOF

echo "=== ECRベースデプロイ完了 ==="
echo ""
echo "🔧 次のステップ - Nginx設定更新を実行しますか？"