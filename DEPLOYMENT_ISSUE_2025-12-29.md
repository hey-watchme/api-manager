# API Manager デプロイ問題 - 引き継ぎドキュメント

**作成日**: 2025-12-29
**問題**: GitHub Actions成功するが、本番環境のコンテナが更新されない

---

## 🚨 現在の状況

### 実装した機能
- **SQS監視ダッシュボード** (`SystemStatusPage.jsx`)
- 新しいタブ「📊 ダッシュボード」を追加
- 既存の「ダッシュボード」タブを「📝 プロンプト生成」に変更
- `/api/sqs/status` エンドポイント追加（main.py）

### 問題の詳細
1. ✅ **GitHub Actions**: 成功（3回実行）
2. ✅ **ECRプッシュ**: 成功（最新イメージ: `20251229-152503`）
3. ✅ **ローカルビルド**: 正常（`index-nh5xAHDU.js` 生成）
4. ❌ **本番環境**: 古いファイル（`index-CXFWiWfP.js`）のまま
5. ❌ **ブラウザ**: 画面が真っ白

---

## 🔍 根本原因

### Dockerfileの問題（修正済み）
```dockerfile
# ❌ 修正前（NODE_ENV未設定）
RUN npm run build

# ✅ 修正後
ENV NODE_ENV=production
RUN npm run build
```

### GitHub Actionsの問題
**ファイル**: `.github/workflows/deploy-frontend.yml`

**現在の設定**:
```yaml
- name: Build Docker image
  run: |
    docker buildx build --platform linux/arm64 -t ${{ env.ECR_REPOSITORY }} --load .
```

**問題点**:
- ❌ `--no-cache` がない → 古いビルドキャッシュが残る
- ❌ デプロイスクリプトが不完全

---

## ✅ 解決策（次セッションで実施）

### 1. `.github/workflows/deploy-frontend.yml` を修正

**修正箇所1: ビルドステップ**
```yaml
- name: Build Docker image
  run: |
    docker buildx build \
      --platform linux/arm64 \
      --no-cache \           # ★追加：キャッシュ無効化
      -t ${{ env.ECR_REPOSITORY }} \
      --load \
      .
```

**修正箇所2: デプロイスクリプト**
```yaml
- name: Deploy to EC2
  uses: appleboy/ssh-action@v1.0.0
  with:
    host: ${{ secrets.EC2_HOST }}
    username: ${{ secrets.EC2_USER }}
    key: ${{ secrets.EC2_SSH_PRIVATE_KEY }}
    port: 22
    script: |
      # ECRログイン
      aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin 754724220380.dkr.ecr.ap-southeast-2.amazonaws.com

      # 既存のコンテナを停止・削除
      docker stop api-manager-frontend || true
      docker rm api-manager-frontend || true
      docker stop watchme-api-manager-prod || true
      docker rm watchme-api-manager-prod || true

      # 古いイメージも削除（★重要：これがないとキャッシュが残る）
      docker rmi 754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-api-manager:latest || true

      # 最新イメージをプル
      docker pull 754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-api-manager:latest

      # Docker networkが存在しない場合は作成
      docker network create watchme-network 2>/dev/null || true

      # 新しいコンテナを起動
      docker run -d \
        --name api-manager-frontend \
        --network watchme-network \
        -p 9001:9001 \
        --restart unless-stopped \
        754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-api-manager:latest

      # ヘルスチェック
      sleep 5
      docker ps | grep api-manager-frontend
      echo "Frontend deployment completed successfully"
```

### 2. 修正後の実行手順

```bash
cd /Users/kaya.matsumoto/projects/watchme/api/api-manager

# 1. .github/workflows/deploy-frontend.yml を編集
# （上記の修正を適用）

# 2. コミット&プッシュ
git add .github/workflows/deploy-frontend.yml
git commit -m "fix: Add --no-cache and force image deletion in deployment"
git push origin main

# 3. GitHub Actionsの完了を待つ（約3分）
gh run watch --repo hey-watchme/api-manager

# 4. 本番環境で確認
curl -s https://api.hey-watch.me/manager/ | grep script
# 期待値: index-nh5xAHDU.js（または新しいハッシュ）

# 5. ブラウザで確認
# https://api.hey-watch.me/manager
# → 「📊 ダッシュボード」「📝 プロンプト生成」が表示される
```

---

## 📂 重要ファイル一覧

| ファイル | 状態 | 説明 |
|---------|------|------|
| `Dockerfile` | ✅ 修正済み | `ENV NODE_ENV=production` 追加済み |
| `.github/workflows/deploy-frontend.yml` | ❌ 要修正 | `--no-cache` と `docker rmi` を追加 |
| `src/pages/SystemStatusPage.jsx` | ✅ 完成 | SQS監視ダッシュボード |
| `src/App.jsx` | ✅ 完成 | ルーティング修正済み |
| `main.py` | ✅ 完成 | `/api/sqs/status` エンドポイント追加済み |

---

## 🔧 緊急時の手動デプロイ方法

GitHub Actionsが使えない場合の手動デプロイ:

```bash
# 1. ローカルでビルド
cd /Users/kaya.matsumoto/projects/watchme/api/api-manager
export NODE_ENV=production
npm run build

# 2. Dockerイメージをビルド（ARM64）
docker buildx build \
  --platform linux/arm64 \
  --no-cache \
  -t 754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-api-manager:manual \
  .

# 3. ECRにプッシュ
aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin 754724220380.dkr.ecr.ap-southeast-2.amazonaws.com
docker push 754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-api-manager:manual

# 4. EC2で手動デプロイ
ssh -i ~/watchme-key.pem ubuntu@3.24.16.82

# コンテナ削除
docker stop api-manager-frontend && docker rm api-manager-frontend

# イメージ削除
docker rmi 754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-api-manager:manual || true

# プル&起動
docker pull 754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-api-manager:manual
docker run -d \
  --name api-manager-frontend \
  --network watchme-network \
  -p 9001:9001 \
  --restart unless-stopped \
  754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-api-manager:manual
```

---

## 📚 関連ドキュメント

- **CI/CD標準仕様**: `/Users/kaya.matsumoto/projects/watchme/server-configs/docs/CICD_STANDARD_SPECIFICATION.md`
  - 今回の問題を反映して更新済み
  - フロントエンドデプロイの必須要件を追加

- **プロジェクトREADME**: `/Users/kaya.matsumoto/projects/watchme/api/api-manager/README.md`

---

## 🎯 次セッションでやるべきこと

1. `.github/workflows/deploy-frontend.yml` に `--no-cache` と `docker rmi` を追加
2. コミット&プッシュ
3. GitHub Actions完了を確認
4. 本番環境でテスト（`curl` でHTMLを確認）
5. ブラウザで動作確認

**所要時間**: 約5分（GitHub Actions完了待ち含む）

---

## 📝 備考

- Cloudflare DNS変更は無関係（DNS Onlyで正しく動作している）
- 3ヶ月間デプロイされていなかったため、古いコンテナが動き続けていた
- 今回の修正で、次回以降は正常にデプロイされるはず
