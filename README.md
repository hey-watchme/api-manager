# API Manager - WatchMe プラットフォーム

## 概要

API Managerは、WatchMeプラットフォームの複数のマイクロサービスAPIを統合管理するためのWebアプリケーションです。各APIの手動実行、スケジュール実行、パラメータ管理などを一元的に行うことができます。

**本番URL**: https://api.hey-watch.me/manager  
**開発環境**: http://localhost:9001  
**GitHubリポジトリ**: https://github.com/matsumotokaya/watchme-api-manager

### 📊 本番環境デプロイ状況（2025年8月10日更新）

✅ **デプロイ完了** - API Managerは本番環境で正常に稼働中です

#### 🆕 最新アップデート（2025年8月10日）
- **スケジューラーUI追加**: 残り4つのAPIにスケジューラー設定UIを追加
  - [心理] プロンプト生成（Vibe Aggregator）
  - [心理] スコアリング（Vibe Scorer）
  - [行動] 音声イベント集計（Behavior Aggregator）
  - [感情] 感情スコア集計（Emotion Aggregator）
- **デバイスID・日付パラメータ対応**: デバイスベースのAPIでデバイスID（デフォルト: m5core2_auto）と処理日付を設定可能に
- **注意**: スケジューラーのバックエンド実装は今後追加予定。現在はUI表示のみ

#### 🔗 **コンテナ名とAPI対応表（重要）**
スケジューラーが各APIと通信する際の**正確なコンテナ名**とポート番号：

| API種類 | UI上の名前 | **実際のコンテナ名** | ポート | エンドポイント |
|---------|-----------|---------------------|--------|----------------|
| **[心理] Whisper書き起こし** | `whisper` | `api-transcriber` | 8001 | `/fetch-and-transcribe` |
| **[心理] プロンプト生成** | `vibe-aggregator` | `api_gen_prompt_mood_chart` | 8009 | `/process-batch` |
| **[心理] スコアリング** | `vibe-scorer` | `api-gpt-v1` | 8002 | `/analyze-batch` |
| **[行動] 音声イベント検出** | `behavior-features` | `api_sed_v1-sed_api-1` | 8004 | `/fetch-and-process-paths` |
| **[感情] 音声特徴量抽出** | `emotion-features` | `opensmile-api` | 8011 | `/process/emotion-features` |

**⚠️ 注意**: UIに表示される名前と実際のコンテナ名は異なります！

#### 自動化済みAPI
現在、以下のAPIの自動実行がAPI Managerで管理されています：

##### ✅ バックエンド実装済み（実際に自動実行される）
- **[心理] Whisper書き起こし** - ファイルベース自動処理
- **[行動] 音声イベント検出** - ファイルベース自動処理  
- **[感情] 音声特徴量抽出** - ファイルベース自動処理

##### 🔄 UI実装済み（バックエンド実装は今後）
- **[心理] プロンプト生成** - デバイスベース処理（UI表示のみ）
- **[心理] スコアリング** - デバイスベース処理（UI表示のみ）
- **[行動] 音声イベント集計** - デバイスベース処理（UI表示のみ）
- **[感情] 感情スコア集計** - デバイスベース処理（UI表示のみ）

---

## アーキテクチャ

本アプリケーションは、UIを提供する「フロントエンド(React)」と、スケジューラー機能を担う「バックエンドAPI(Python)」の2つのサーバーで構成されています。詳細はリポジトリ内の各ソースコードを参照してください。

---

## 開発ガイドライン

### 🚨 ブランチ運用ルール（必須）

**重要**: featureブランチで作業した内容は、必ずmainブランチにマージしてください。

1. **featureブランチでの開発**
   ```bash
   # 新機能の開発を開始
   git checkout -b feature/新機能名
   
   # 開発・コミット
   git add .
   git commit -m "feat: 新機能の説明"
   ```

2. **mainブランチへのマージ（必須）**
   ```bash
   # mainブランチを最新に更新
   git checkout main
   git pull origin main
   
   # featureブランチをマージ
   git merge feature/新機能名
   
   # リモートにプッシュ
   git push origin main
   ```

3. **Pull Requestの活用（推奨）**
   - 大きな変更の場合は、GitHubでPull Requestを作成
   - コードレビューを経てマージ

**⚠️ 注意**: 
- featureブランチで作業したまま放置しない
- mainブランチが唯一の真実の源（Single Source of Truth）
- デプロイは必ずmainブランチから実行

---

## 開発環境セットアップ

### 前提条件
- Node.js 18以上
- Python 3.11以上
- Docker, Docker Compose

### 起動手順

1.  **リポジトリのクローン**
    ```bash
    git clone git@github.com:matsumotokaya/watchme-api-manager.git
    cd watchme-api-manager
    ```

2.  **フロントエンドの起動**
    ```bash
    npm install
    
    # バックグラウンドで起動（推奨）
    nohup npm run dev > /dev/null 2>&1 &
    
    # または、フォアグラウンドで起動する場合
    # npm run dev
    
    # => http://localhost:9001 でアクセス可能
    ```

3.  **スケジューラーAPIの起動 (別ターミナルで)**
    ```bash
    # 仮想環境の作成と有効化
    python3 -m venv venv
    source venv/bin/activate

    # 依存関係のインストール
    pip install -r requirements.txt

    # APIサーバーの起動
    uvicorn scheduler-api-server:app --host 0.0.0.0 --port 8015 --reload
    ```

---

## デプロイメント

### デプロイ手順

本アプリケーションのデプロイは、ECR (Elastic Container Registry) を利用して行います。フロントエンドとスケジューラーAPIは、それぞれ別のDockerイメージとしてビルドされ、EC2上でコンテナとして実行されます。

#### デプロイの基本的な流れ

1.  **イメージのビルド**: ローカルで `docker build` を実行し、本番用のDockerイメージを作成します。
2.  **ECRへのプッシュ**: 作成したイメージをECRにプッシュします。
3.  **サーバーでの実行**: EC2サーバー上で、ECRから最新のイメージをプルし、`docker-compose` を使ってコンテナを起動します。

#### 具体的な手順

##### 1️⃣ ローカルでのイメージビルドとECRへのプッシュ
```bash
# フロントエンドのデプロイ
./deploy-frontend.sh

# スケジューラーAPIのデプロイ
./deploy-scheduler.sh
```

##### 2️⃣ EC2サーバーにSSH接続
```bash
# EC2サーバーに接続
ssh -i ~/watchme-key.pem ubuntu@3.24.16.82
```

##### 3️⃣ EC2サーバーでのコンテナ起動
```bash
# ECRにログイン
aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin 754724220380.dkr.ecr.ap-southeast-2.amazonaws.com

# 最新イメージをプル
docker pull 754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-api-manager:latest
docker pull 754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-api-manager-scheduler:latest

# 既存コンテナを停止・削除
docker stop watchme-api-manager-prod watchme-scheduler-prod || true
docker rm watchme-api-manager-prod watchme-scheduler-prod || true

# docker-compose.all.yml を使用してコンテナを起動
cd /home/ubuntu/watchme-api-manager
docker-compose -f docker-compose.all.yml up -d

# watchme-networkへの接続
docker network connect watchme-network watchme-api-manager-prod
docker network connect watchme-network watchme-scheduler-prod
```

#### ⚠️ **デプロイ時の重要な注意点**

##### 1. **環境変数の設定** 
**問題**: `.env` ファイルが古いAPIキーを使用していると `Invalid API key` エラーが発生します。
```bash
# ❌ エラー例: 2025-08-08 15:00:03,045 - ERROR - whisper: 未処理ファイル取得エラー: {'message': 'Invalid API key'}

# ✅ 解決方法: 他のサービスと同じ最新のAPIキーを使用
grep SUPABASE_KEY /home/ubuntu/watchme-vault-api-docker/.env
# この値を /home/ubuntu/watchme-api-manager/.env にコピーする
```

##### 2. **🚨 コンテナ間通信の設定（最重要）**
**問題**: スケジューラーが他のAPIを呼び出せない場合、必ずこの問題です。
```bash
# ❌ エラー例: Failed to resolve 'api-transcriber' 
# ❌ エラー例: Failed to resolve 'watchme-behavior-yamnet'

# ✅ 解決方法: 全てのコンテナをwatchme-networkに接続
# 必須の接続先コンテナ一覧:
docker network connect watchme-network api-transcriber          # 心理グラフ用
docker network connect watchme-network api_gen_prompt_mood_chart # 心理グラフ用  
docker network connect watchme-network api-gpt-v1               # 心理グラフ用
docker network connect watchme-network api_sed_v1-sed_api-1     # 行動グラフ用
docker network connect watchme-network opensmile-api            # 感情グラフ用
```

##### 3. **正しいコンテナ名の確認方法**
**問題**: `watchme-behavior-yamnet` のような名前で接続しようとしてもコンテナが存在しません。
```bash
# ✅ 実際のコンテナ名を確認する方法:
docker ps --format "{{.Names}}" | grep -E "(api|watchme|vibe|mood|behavior|emotion)"

# 出力例:
# api_sed_v1-sed_api-1     <- これが行動グラフAPI（ポート8004）
# opensmile-api            <- これが感情グラフAPI（ポート8011）
# api-transcriber          <- これが心理グラフAPI（ポート8001）
```

##### 4. **動作確認方法**
```bash
# 1. ネットワーク接続テスト
docker exec watchme-scheduler-prod ping -c 1 api-transcriber
docker exec watchme-scheduler-prod ping -c 1 api_sed_v1-sed_api-1  
docker exec watchme-scheduler-prod ping -c 1 opensmile-api

# 2. 手動実行テスト
docker exec watchme-scheduler-prod python /app/run-api-process-docker.py whisper
docker exec watchme-scheduler-prod python /app/run-api-process-docker.py behavior-features

# 3. WebUI確認
curl https://api.hey-watch.me/manager/
curl https://api.hey-watch.me/scheduler/status/whisper
```

##### 5. **トラブルシューティングチェックリスト**
デプロイ後に問題が発生した場合、必ず以下を順番に確認してください：

```bash
# ✅ チェック1: コンテナが起動しているか？
docker ps | grep -E "watchme-scheduler|watchme-api-manager"

# ✅ チェック2: 環境変数は正しいか？
docker exec watchme-scheduler-prod env | grep SUPABASE_KEY

# ✅ チェック3: ネットワークに接続されているか？
docker network inspect watchme-network | grep -A 3 "watchme-scheduler-prod"

# ✅ チェック4: 対象APIコンテナは動作しているか？
docker ps | grep -E "api-transcriber|api_sed_v1-sed_api-1|opensmile-api"

# ✅ チェック5: pingは通るか？
docker exec watchme-scheduler-prod ping -c 1 api-transcriber
```

#### 🤖 **自動化スクリプト**
毎回手動で設定するのを避けるため、以下のスクリプトをEC2サーバーで実行してください：

```bash
#!/bin/bash
# 全コンテナをwatchme-networkに接続するスクリプト
# ファイル名: /home/ubuntu/connect-all-containers.sh

echo "=== 全コンテナをwatchme-networkに接続中 ==="

# 必須コンテナ一覧
CONTAINERS=(
  "watchme-scheduler-prod"
  "watchme-api-manager-prod"
  "api-transcriber"
  "api_gen_prompt_mood_chart"
  "api-gpt-v1"
  "api_sed_v1-sed_api-1"
  "opensmile-api"
  "watchme-vault-api"
  "watchme-web-prod"
  "watchme-admin"
  "api-sed-aggregator"
)

for container in "${CONTAINERS[@]}"; do
  echo "接続中: $container"
  docker network connect watchme-network "$container" 2>/dev/null && echo "✅ $container" || echo "⚠️ $container (既に接続済みまたはエラー)"
done

echo ""
echo "=== 接続テスト ==="
echo "スケジューラーから主要APIへのpingテスト:"
docker exec watchme-scheduler-prod ping -c 1 api-transcriber >/dev/null 2>&1 && echo "✅ api-transcriber" || echo "❌ api-transcriber"
docker exec watchme-scheduler-prod ping -c 1 api_sed_v1-sed_api-1 >/dev/null 2>&1 && echo "✅ api_sed_v1-sed_api-1" || echo "❌ api_sed_v1-sed_api-1"
docker exec watchme-scheduler-prod ping -c 1 opensmile-api >/dev/null 2>&1 && echo "✅ opensmile-api" || echo "❌ opensmile-api"

echo ""
echo "=== 完了 ==="
```

**実行方法**:
```bash
# スクリプトを作成して実行権限を付与
chmod +x /home/ubuntu/connect-all-containers.sh
/home/ubuntu/connect-all-containers.sh
```

### サーバー設定 (Nginx / systemd) 【重要】

本アプリケーションを本番環境で正しく動作させるには、EC2サーバー側で **Nginx** によるルーティング設定と、**systemd** によるサービス管理設定が必要です。

これらのサーバー設定は、このリポジトリでは管理していません。**サーバー設定に関する全ての情報と設定ファイルは、以下の専用リポジトリで一元管理されています。**

**サーバー設定リポジトリ:**
[**watchme-server-configs**](https://github.com/matsumotokaya/watchme-server-configs)

デプロイや、新しいAPIを追加する際は、必ず上記リポジトリの `README.md` を熟読し、サーバー全体の設計思想と運用ルールを理解した上で、適切な設定を行ってください。

---

## トラブルシューティング

アプリケーションの運用中に発生した問題や、その解決策については、以下のドキュメントを参照してください。

- **過去の障害事例:**
  - [**2025-08-08: スケジューラーのコンテナ間通信エラー**](./docs/incidents/2025-08-08-scheduler-network-fix.md)
    - `host.docker.internal` の名前解決に失敗し、スケジューラーがAPIを呼び出せなかった問題の調査と解決の記録です。

### デプロイ時によくある問題と対策

#### 1. コンテナ間通信の問題
- **症状**: スケジューラーから他のAPIを呼び出せない
- **原因**: Linux環境では `host.docker.internal` が使用できない
- **解決策**: 
  - コンテナ名を使用して通信（例: `http://api-transcriber:8001`）
  - 全てのコンテナを `watchme-network` に接続

#### 2. 環境変数の設定漏れ
- **症状**: API接続エラーやSupabase認証エラー
- **原因**: `.env` ファイルが存在しないか、必要な変数が不足
- **解決策**: 
  - EC2サーバーで `.env` ファイルを作成
  - 他のサービスの `.env` ファイルを参考に必要な値を設定

#### 3. Nginxルーティングの確認
- **症状**: ブラウザからAPIエンドポイントにアクセスできない
- **確認方法**: 
  ```bash
  # Nginx設定の確認
  sudo cat /etc/nginx/sites-available/api.hey-watch.me | grep -A 5 "location"
  ```

### 今後の実装・デプロイに向けた推奨事項

1. **デプロイスクリプトの活用**
   - `deploy-frontend.sh` と `deploy-scheduler.sh` を使用してECRへのプッシュを自動化
   - EC2サーバー側の手順もスクリプト化することを推奨

2. **ネットワーク設定の標準化**
   - 新しいコンテナは必ず `watchme-network` に接続
   - `docker-compose.yml` に `networks` セクションを明記

3. **ヘルスチェックの実装**
   - 各APIにヘルスチェックエンドポイントを実装
   - docker-composeでヘルスチェックを設定

4. **ログ監視**
   - `docker logs` コマンドで定期的にログを確認
   - スケジューラーのログは `/var/log/scheduler/` に保存される