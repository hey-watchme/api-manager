#!/bin/bash

# AWS CLI対応版ECRデプロイ
set -e

# 変数設定
EC2_HOST="3.24.16.82"
SSH_KEY="$HOME/watchme-key.pem"
EC2_USER="ubuntu"
ECR_REPOSITORY="754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-api-manager"
AWS_REGION="ap-southeast-2"

echo "=== AWS CLI対応版ECRデプロイ実行 ==="

# ステップ1: AWS CLIのインストール
echo "🔧 EC2サーバーにAWS CLIをインストール中..."
ssh -i "$SSH_KEY" -t "$EC2_USER@$EC2_HOST" << 'EOF'
# AWS CLIがインストール済みかチェック
if command -v aws >/dev/null 2>&1; then
    echo "✅ AWS CLI既にインストール済み: $(aws --version)"
else
    echo "📦 AWS CLIをインストール中..."
    sudo apt update && sudo apt install -y awscli
    echo "✅ AWS CLIインストール完了: $(aws --version)"
fi
EOF

# ステップ2: ECRログインとデプロイ実行
echo "🚀 ECRログインとデプロイを実行中..."
ssh -i "$SSH_KEY" -t "$EC2_USER@$EC2_HOST" << 'EOF'
set -e

echo "🔐 ECRにログイン中..."
aws ecr get-login-password --region ap-southeast-2 | sudo docker login --username AWS --password-stdin 754724220380.dkr.ecr.ap-southeast-2.amazonaws.com

echo "⬇️ 最新のECRイメージをプル中..."
sudo docker pull 754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-api-manager:latest

echo "📄 環境変数ファイルを確認中..."
if [ ! -f .env ]; then
    echo "📝 .envファイルを作成中..."
    cat > .env << 'ENVEOF'
VITE_SUPABASE_URL=https://qvtlwotzuzbavrzqhyvt.supabase.co
VITE_SUPABASE_KEY=your_supabase_anon_key
VITE_API_BASE_URL=https://api.hey-watch.me
VITE_PORT=9001
VITE_API_TIMEOUT=30000
ENVEOF
    echo "✅ .envファイルを作成しました"
fi

echo "🚀 ECRイメージベースでアプリケーションを起動中..."
sudo docker-compose -f docker-compose.prod.yml up -d

echo "⏳ 起動確認中（20秒待機）..."
sleep 20

# 起動確認
if sudo docker ps | grep -q "watchme-api-manager-prod"; then
    echo "✅ ECRベースコンテナが正常に起動しました"
    echo ""
    echo "📊 コンテナ情報:"
    sudo docker ps | grep watchme-api-manager-prod
    echo ""
    
    # 使用中のイメージを確認
    image_info=$(sudo docker inspect watchme-api-manager-prod --format '{{.Config.Image}}')
    echo "🏷️ 使用イメージ: $image_info"
    
    # ヘルスチェック
    echo "🏥 ヘルスチェック実行..."
    if curl -f http://localhost:9001/ >/dev/null 2>&1; then
        echo "✅ アプリケーション正常応答"
        echo "📄 HTMLレスポンス確認:"
        curl -s http://localhost:9001/ | head -2
    else
        echo "⚠️ アプリケーション応答エラー。ログ確認："
        sudo docker logs watchme-api-manager-prod --tail 10
    fi
    
    echo ""
    echo "🎉 ECRベースデプロイ完了！"
    echo "📍 EC2内部アクセス: http://localhost:9001"
    echo "🌐 次のステップ: Nginx設定で外部公開"
    
else
    echo "❌ コンテナ起動失敗"
    echo "全コンテナ状況："
    sudo docker ps -a | grep -i manager
    echo "エラーログ："
    sudo docker logs watchme-api-manager-prod 2>/dev/null || echo "ログ取得失敗"
fi
EOF

echo "=== ECRデプロイ処理完了 ==="