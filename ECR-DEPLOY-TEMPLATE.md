# 🚀 WatchMe API ECRデプロイテンプレート

> **WatchMeプラットフォーム全API共通デプロイリファレンス**  
> 作成日: 2025年7月23日  
> 適用実績: api-manager (React + Nginx)

## 📋 このテンプレートについて

このテンプレートは、WatchMeプラットフォームの全APIを統一されたECRベースデプロイで管理するための標準リファレンスです。React、Python FastAPI、Node.js等、全ての技術スタックに適用可能です。

## 🎯 標準化の利点

- ✅ **統一性**: 全APIで同じデプロイプロセス
- ✅ **バージョン管理**: タイムスタンプ付きイメージタグ
- ✅ **セキュリティ**: IAMロールベースの認証
- ✅ **スケーラビリティ**: EC2、ECS、EKSで共通利用可能
- ✅ **CI/CD対応**: GitHub Actionsとの統合容易
- ✅ **ロールバック**: 過去バージョンへの簡単な復元

## 📁 必須ファイル構成

```
your-api-project/
├── Dockerfile                 # マルチステージビルド対応
├── docker-compose.prod.yml    # 本番環境用Compose設定
├── deploy-ecr.sh              # ECRプッシュスクリプト
├── run-prod.sh                # 本番環境起動スクリプト
├── .env.example               # 環境変数テンプレート
├── nginx-config.txt           # Nginx設定リファレンス（必要に応じて）
└── requirements.txt (Python) / package.json (Node.js)
```

## 🛠️ Step-by-Step デプロイ手順

### Step 1: ECRリポジトリの作成

```bash
# 新しいAPIプロジェクト用のECRリポジトリを作成
aws ecr create-repository \
  --repository-name watchme-your-api-name \
  --region ap-southeast-2

# 作成されるリポジトリURL例:
# 754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-your-api-name
```

### Step 2: デプロイスクリプトの作成

#### deploy-ecr.sh（カスタマイズ必須）
```bash
#!/bin/bash
set -e

# 🔧 プロジェクト固有の設定（必ず変更）
PROJECT_NAME="your-api-name"                    # 例: "vibe-transcriber"
PORT="8001"                                     # 例: 8001, 8002, 9001
AWS_REGION="ap-southeast-2"
ECR_REPOSITORY="754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-${PROJECT_NAME}"
IMAGE_TAG="latest"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "=== ${PROJECT_NAME} ECRデプロイ開始 ==="

# ECRにログイン
echo "ECRにログイン中..."
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_REPOSITORY

# Dockerイメージをビルド
echo "Dockerイメージをビルド中..."
docker build -t watchme-${PROJECT_NAME} .

# ECR用のタグを付与
echo "ECR用のタグを付与中..."
docker tag watchme-${PROJECT_NAME}:latest $ECR_REPOSITORY:$IMAGE_TAG
docker tag watchme-${PROJECT_NAME}:latest $ECR_REPOSITORY:$TIMESTAMP

# ECRにプッシュ
echo "ECRにイメージをプッシュ中..."
docker push $ECR_REPOSITORY:$IMAGE_TAG
docker push $ECR_REPOSITORY:$TIMESTAMP

echo "=== デプロイが完了しました ==="
echo "ECRリポジトリ: $ECR_REPOSITORY"
echo "イメージタグ: $IMAGE_TAG および $TIMESTAMP"
echo "次のステップ: ./run-prod.sh で本番環境にデプロイ"
```

#### run-prod.sh（カスタマイズ必須）
```bash
#!/bin/bash
set -e

# 🔧 プロジェクト固有の設定（必ず変更）
PROJECT_NAME="your-api-name"                    # 例: "vibe-transcriber"
CONTAINER_NAME="watchme-${PROJECT_NAME}-prod"   # 例: "watchme-vibe-transcriber-prod"
ECR_REPOSITORY="754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-${PROJECT_NAME}"
AWS_REGION="ap-southeast-2"

echo "=== ${PROJECT_NAME} 本番環境起動 ==="

# ECRから最新イメージをプル
echo "ECRから最新イメージをプル中..."
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_REPOSITORY
docker pull $ECR_REPOSITORY:latest

# 既存のコンテナを停止・削除
echo "既存のコンテナを停止・削除中..."
docker-compose -f docker-compose.prod.yml down || true

# 本番環境でコンテナを起動
echo "本番環境でコンテナを起動中..."
docker-compose -f docker-compose.prod.yml up -d

# 起動確認
sleep 10
if docker ps | grep -q "$CONTAINER_NAME"; then
    echo "✅ $CONTAINER_NAME が正常に起動しました"
    docker ps | grep "$CONTAINER_NAME"
else
    echo "❌ コンテナ起動に失敗しました"
    docker logs "$CONTAINER_NAME" || echo "ログ取得失敗"
    exit 1
fi

echo "=== 起動完了 ==="
echo "コンテナ名: $CONTAINER_NAME"
echo "ログ確認: docker logs $CONTAINER_NAME"
```

### Step 3: Docker Compose設定

#### docker-compose.prod.yml（カスタマイズ必須）
```yaml
version: '3.8'

services:
  your-api-name:  # 🔧 サービス名を変更
    image: 754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-your-api-name:latest  # 🔧 リポジトリURL変更
    container_name: watchme-your-api-name-prod  # 🔧 コンテナ名を変更
    ports:
      - "8001:8001"  # 🔧 ポート番号を変更
    environment:
      # 🔧 プロジェクト固有の環境変数を設定
      - NODE_ENV=production                    # Node.js用
      - PYTHONPATH=/app                        # Python用
      - API_PORT=8001                          # 共通
      - AWS_DEFAULT_REGION=ap-southeast-2      # 共通
      # プロジェクト固有の環境変数を追加
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_KEY=${SUPABASE_KEY}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health"]  # 🔧 ポート変更
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - watchme-network

networks:
  watchme-network:
    driver: bridge
```

### Step 4: Dockerfile作成例

#### React/Node.js用
```dockerfile
# マルチステージビルド
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 9001
CMD ["nginx", "-g", "daemon off;"]
```

#### Python FastAPI用
```dockerfile
FROM python:3.11-slim
WORKDIR /app

# システム依存関係
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python依存関係
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコード
COPY . .

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

EXPOSE 8001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
```

### Step 5: Nginx設定（外部公開用）

#### nginx-config.txt
```nginx
# /etc/nginx/sites-available/api.hey-watch.me に追加

location /your-api-path/ {  # 🔧 APIパスを変更
    proxy_pass http://localhost:8001/;  # 🔧 ポート変更
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # CORS設定
    add_header "Access-Control-Allow-Origin" "*";
    add_header "Access-Control-Allow-Methods" "GET, POST, PUT, DELETE, OPTIONS";
    add_header "Access-Control-Allow-Headers" "Content-Type, Authorization";
    
    # OPTIONSリクエストの処理
    if ($request_method = "OPTIONS") {
        return 204;
    }
    
    # タイムアウト設定（長時間処理API用）
    proxy_connect_timeout 60s;
    proxy_send_timeout 300s;      # 5分
    proxy_read_timeout 300s;      # 5分
}
```

## 🚨 トラブルシューティング

### 1. AWS認証エラー
```bash
# 問題: Unable to locate credentials
# 解決: EC2にIAMロールをアタッチ
aws sts get-caller-identity

# 必要な権限:
# - ecr:GetAuthorizationToken
# - ecr:BatchCheckLayerAvailability  
# - ecr:GetDownloadUrlForLayer
# - ecr:BatchGetImage
```

### 2. ポート競合エラー
```bash
# 使用中のポートを確認
sudo lsof -i :8001

# プロセスを停止
sudo kill -9 <PID>

# または既存コンテナを停止
docker stop <container-name>
```

### 3. ビルドエラー
```bash
# Dockerビルドログを詳細表示
docker build --no-cache --progress=plain -t your-api .

# マルチステージビルドの特定ステージをテスト
docker build --target builder -t your-api-builder .
```

## 📊 運用コマンド集

### デプロイ実行
```bash
# 1. ECRにプッシュ
./deploy-ecr.sh

# 2. 本番環境で起動
./run-prod.sh

# 3. 起動確認
docker ps | grep watchme-your-api-name-prod
curl -f https://api.hey-watch.me/your-api-path/health
```

### 監視・メンテナンス
```bash
# ログ確認
docker logs -f watchme-your-api-name-prod

# リソース使用量確認
docker stats watchme-your-api-name-prod

# コンテナ内に入る（デバッグ用）
docker exec -it watchme-your-api-name-prod /bin/sh

# イメージのバージョン確認
docker inspect watchme-your-api-name-prod | grep Image
```

### ロールバック
```bash
# 過去のイメージタグを確認
aws ecr describe-images --repository-name watchme-your-api-name --region ap-southeast-2

# 特定バージョンにロールバック
docker pull 754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-your-api-name:20250722-143025
# docker-compose.prod.yml のイメージタグを変更して再起動
```

## 🔄 CI/CD統合例

### GitHub Actions
```yaml
name: ECR Deploy

on:
  push:
    branches: [ main ]
    paths:
      - 'src/**'
      - 'Dockerfile'
      - 'requirements.txt'
      - 'package.json'

jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      PROJECT_NAME: your-api-name
      
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ap-southeast-2
    
    - name: Build and push to ECR
      run: |
        chmod +x deploy-ecr.sh
        ./deploy-ecr.sh
    
    - name: Deploy to EC2
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.EC2_HOST }}
        username: ubuntu
        key: ${{ secrets.EC2_SSH_KEY }}
        script: |
          cd /home/ubuntu/${{ env.PROJECT_NAME }}
          ./run-prod.sh
```

## ⚡ 新しいAPIでの適用手順

### 1. プロジェクトセットアップ
```bash
# 新しいAPIプロジェクトディレクトリで実行
cd /path/to/new-api-project

# テンプレートファイルをコピー
curl -O https://raw.githubusercontent.com/your-org/templates/deploy-ecr.sh
curl -O https://raw.githubusercontent.com/your-org/templates/run-prod.sh
curl -O https://raw.githubusercontent.com/your-org/templates/docker-compose.prod.yml

# 実行権限を付与
chmod +x deploy-ecr.sh run-prod.sh
```

### 2. 設定のカスタマイズ
```bash
# 必須変更項目をチェック
grep -n "🔧" deploy-ecr.sh run-prod.sh docker-compose.prod.yml

# 置換例（sedコマンド使用）
sed -i 's/your-api-name/vibe-transcriber/g' deploy-ecr.sh
sed -i 's/8001/8002/g' docker-compose.prod.yml
```

### 3. ECRリポジトリ作成
```bash
aws ecr create-repository \
  --repository-name watchme-vibe-transcriber \
  --region ap-southeast-2
```

### 4. デプロイ実行
```bash
# 初回デプロイ
./deploy-ecr.sh
./run-prod.sh

# Nginx設定追加
sudo nano /etc/nginx/sites-available/api.hey-watch.me
# nginx-config.txt の内容を参考に設定を追加
sudo nginx -t && sudo systemctl reload nginx
```

## 📈 実績・適用例

### 成功事例
- **api-manager** (2025/07/23): React + Nginx, ポート9001
- **vibe-transcriber** (予定): Python FastAPI, ポート8001  
- **behavior-features** (予定): Python FastAPI, ポート8004

### パフォーマンス指標
- **デプロイ時間**: 平均3-5分（初回は10分）
- **イメージサイズ**: 23MB-100MB（技術スタックにより変動）
- **起動時間**: 平均15-30秒

---

## 📞 サポート

このテンプレートの使用で問題が発生した場合：

1. **トラブルシューティング**セクションを確認
2. **ログを詳細確認**: `docker logs -f container-name`
3. **GitHub Issues**で問題を報告

---

**このテンプレートにより、WatchMeプラットフォームの全APIが統一された高品質なデプロイプロセスで管理されます。**