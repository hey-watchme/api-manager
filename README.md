# API Manager - WatchMe プラットフォーム

## 概要

API Managerは、WatchMeプラットフォームの複数のマイクロサービスAPIを統合管理するためのWebアプリケーションです。各APIの手動実行、スケジュール実行、パラメータ管理などを一元的に行うことができます。

**本番URL**: https://api.hey-watch.me/manager  
**開発環境**: http://localhost:9001  
**GitHubリポジトリ**: https://github.com/matsumotokaya/watchme-api-manager

### 📊 本番環境デプロイ状況（2025年8月10日更新）

✅ **デプロイ完了** - API Managerは本番環境で正常に稼働中です

#### 🆕 最新アップデート（2025年8月10日）
- **スケジューラー完全実装**: 4つのデバイスベースAPIバックエンド実装完了
- **UUID標準化**: 正式なUUID v4形式に統一（`9f7d6e27-98c3-4c19-bdfb-f7fda58b9a93`）
- **コンポーネント統合**: DeviceIdInputで重複コード削除、DRY原則実現
- **エンドポイント修正**: server_overview.md準拠で全API統一

#### 🔗 **コンテナ名とAPI対応表（2025年8月10日更新 - 必ず参照）**
スケジューラーが各APIと通信する際の**正確なコンテナ名**とポート番号：

| API種類 | UI上の名前 | **実際のコンテナ名** | ポート | エンドポイント | HTTPメソッド | 処理タイプ |
|---------|-----------|---------------------|--------|----------------|-------------|-----------|
| **[心理] Whisper書き起こし** | `whisper` | `api-transcriber` | 8001 | `/fetch-and-transcribe` | POST | ファイルベース |
| **[心理] プロンプト生成** | `vibe-aggregator` | `api_gen_prompt_mood_chart` | 8009 | `/generate-mood-prompt-supabase` | **GET** ⚠️ | デバイスベース |
| **[心理] スコアリング** | `vibe-scorer` | `api-gpt-v1` | 8002 | `/analyze-vibegraph-supabase` | POST | デバイスベース |
| **[行動] 音声イベント検出** | `behavior-features` | `api_sed_v1-sed_api-1` | 8004 | `/fetch-and-process-paths` | POST | ファイルベース |
| **[行動] 音声イベント集計** | `behavior-aggregator` | `api-sed-aggregator` | 8010 | `/analysis/sed` | POST | デバイスベース |
| **[感情] 音声特徴量抽出** | `emotion-features` | `opensmile-api` | 8011 | `/process/emotion-features` | POST | ファイルベース |
| **[感情] 感情スコア集計** | `emotion-aggregator` | `opensmile-aggregator` | 8012 | `/analyze/opensmile-aggregator` | POST | デバイスベース |

**⚠️ 重要な注意事項:**
1. UIに表示される名前と実際のコンテナ名は異なります！
2. `vibe-aggregator`のみGETメソッドを使用（他はすべてPOST）
3. Dockerコンテナ内では`localhost`ではなく、必ずコンテナ名を使用すること

#### 自動化済みAPI
現在、以下のAPIの自動実行がAPI Managerで管理されています：

##### ✅ バックエンド実装済み（実際に自動実行される）
- **[心理] Whisper書き起こし** - ファイルベース自動処理
- **[行動] 音声イベント検出** - ファイルベース自動処理  
- **[感情] 音声特徴量抽出** - ファイルベース自動処理

##### ✅ デバイスベースAPI（バックエンド実装完了）
- **[心理] プロンプト生成** - デバイスベース自動処理
- **[心理] スコアリング** - デバイスベース自動処理
- **[行動] 音声イベント集計** - デバイスベース自動処理
- **[感情] 感情スコア集計** - デバイスベース自動処理

---

## アーキテクチャ

本アプリケーションは、UIを提供する「フロントエンド(React)」と、スケジューラー機能を担う「バックエンドAPI(Python)」の2つのサーバーで構成されています。詳細はリポジトリ内の各ソースコードを参照してください。

### 🕐 スケジューラーの仕組み（2025年8月11日更新）

#### 概要
スケジューラーは、各APIを定期的に自動実行するシステムです。UIからON/OFFの制御は可能ですが、実行時刻は固定されています。

#### アーキテクチャ
```
[UI (React)] 
    ↓ ON/OFF設定
[Scheduler API (Docker)] 
    ↓ config.json更新
[Host OS cron] 
    ↓ 固定時刻で実行
[run_if_enabled.py] 
    ↓ config.json確認
[Docker exec] → 有効なAPIのみ実行
```

#### 実行スケジュール

| API | 実行時刻 | 頻度 | 処理タイプ |
|-----|---------|------|-----------|
| **[心理] Whisper書き起こし** | 毎時10分 | 毎時間 | ファイルベース |
| **[行動] 音声イベント検出** | 毎時10分 | 毎時間 | ファイルベース |
| **[心理] プロンプト生成** | 毎時20分 | 毎時間 | デバイスベース |
| **[行動] 音声イベント集計** | 毎時20分 | 毎時間 | デバイスベース |
| **[感情] 音声特徴量抽出** | 毎時20分 | 毎時間 | ファイルベース |
| **[感情] 感情スコア集計** | 毎時30分 | 毎時間 | デバイスベース |
| **[心理] スコアリング** | 30分 | 3時間ごと※ | デバイスベース |

※ 0:30, 3:30, 6:30, 9:30, 12:30, 15:30, 18:30, 21:30

#### 仕組みの詳細

1. **UIからの制御**
   - API Managerの画面で各APIのON/OFFを切り替え
   - 設定は `/home/ubuntu/scheduler/config.json` に保存
   - 実行間隔の変更はできません（固定スケジュール）

2. **cron設定** (`/etc/cron.d/watchme-scheduler`)
   - ホストOS側で固定時刻にスクリプトを実行
   - 負荷分散のため、APIごとに実行時刻をずらしている

3. **実行制御** (`run_if_enabled.py`)
   - cronから呼ばれるPythonスクリプト
   - config.jsonを読み、APIが有効な場合のみ実行
   - `docker exec` コマンドでコンテナ内のAPIを起動

4. **ログ管理**
   - 各APIの実行ログ: `/var/log/scheduler/scheduler-[API名].log`
   - cron実行ログ: `/var/log/scheduler/cron.log`

#### なぜこのアーキテクチャなのか？

- **セキュリティ**: Dockerコンテナからホストのシステムファイルを変更しない
- **シンプル**: cron設定は静的で、トラブルシューティングが容易
- **柔軟性**: UIからON/OFF制御可能、実行時刻は運用で最適化済み
- **負荷分散**: APIを時間差で実行し、サーバー負荷を平準化

---

## 🔧 デバイスID設定管理（重要）

### テストデバイスIDの一元管理

**問題**: デバイスIDが複数箇所に分散していると、変更時に修正漏れが発生する

**解決策**: フロントエンドの設定を唯一の真実の源（Single Source of Truth）とする

#### デバイスID変更手順

1. **フロントエンドで変更**
   - `src/config/constants.js` の `DEFAULT_DEVICE_ID` を変更
   - これにより全てのUIコンポーネントに反映される

2. **本番環境への反映**
   - API Managerの画面から各APIの設定を保存
   - これにより `/home/ubuntu/scheduler/config.json` が更新される
   - スケジューラーは自動的に新しいデバイスIDを使用

3. **確認方法**
   ```bash
   # 本番サーバーで実行
   cat /home/ubuntu/scheduler/config.json | jq '.apis[].deviceId'
   ```

#### ⚠️ 注意事項

- **バックエンドのハードコーディングは避ける**
- config.jsonが存在しない場合、スケジューラーは警告を出力
- 緊急時のフォールバック値は `scheduler/run-api-process-docker.py` に記載

#### 設定ファイルの優先順位

1. `/home/ubuntu/scheduler/config.json` （フロントエンドから設定）
2. フォールバック値（警告付きで使用）

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

#### 🧹 ブランチクリーンアップ（定期実行推奨）

**問題**: 古いfeatureブランチが残ると、どれが最新か分からなくなる

**解決策**: マージ後は必ず不要なブランチを削除する
```bash
# 1. マージ済みブランチの確認
git branch --merged main

# 2. 不要なローカルブランチを削除
git branch -d feature/古いブランチ名

# 3. 孤立したブランチ（リモートにない）を確認
git branch -vv | grep "\[gone\]"

# 4. 孤立ブランチを強制削除（内容確認後）
git branch -D feature/孤立したブランチ名

# 5. リモートの削除済みブランチを反映
git remote prune origin
```

**定期メンテナンス**:
- 月1回程度、`git branch -vv` でブランチ状況を確認
- `[gone]` 表示のあるブランチは削除対象

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

2.  **フロントエンド開発サーバーの起動**
    ```bash
    # 推奨：専用スクリプトでバックグラウンド起動
    ./start-frontend-dev.sh
    
    # または手動起動
    npm install
    npm run dev
    
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
  - **2025-08-11: スケジューラー500エラーの解決**
    - UIから設定変更時の500エラーを、アーキテクチャ改善により解決しました。詳細は上記「スケジューラーの仕組み」を参照。

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

#### 4. スケジューラー設定の問題
- **症状**: UIから設定を変更しても500エラーが発生する
- **原因**: Dockerコンテナからホストのcronファイルへの書き込み権限がない
- **解決策**: 2025-08-11のアーキテクチャ改善で解決済み。cron設定は手動管理に変更。

#### 5. スケジュール実行されない
- **症状**: APIが自動実行されない
- **確認方法**:
  ```bash
  # cron設定の確認
  cat /etc/cron.d/watchme-scheduler
  
  # config.jsonの確認
  cat /home/ubuntu/scheduler/config.json
  
  # 実行ログの確認
  tail -f /var/log/scheduler/scheduler-[API名].log
  ```
- **解決策**: 
  - cron設定が正しいか確認
  - run_if_enabled.pyが実行可能か確認
  - config.jsonでAPIが有効になっているか確認

### 今後の実装・デプロイに向けた推奨事項

1. **🚨 エンドポイント設定の確認（最重要）**
   - 新しいAPIを追加する際は、必ず上記の「コンテナ名とAPI対応表」を更新
   - `run-api-process-docker.py`と手動実行用のAPIクライアントのエンドポイントを一致させる
   - **3つのファイルを必ず同期させる:**
     - `/scheduler/run-api-process-docker.py` (Docker環境用)
     - `/run-api-process.py` (ローカル環境用)
     - `/src/services/*ApiClient.js` (フロントエンド用)

2. **デプロイスクリプトの活用**
   - `deploy-frontend.sh` と `deploy-scheduler.sh` を使用してECRへのプッシュを自動化
   - EC2サーバー側の手順もスクリプト化することを推奨

3. **ネットワーク設定の標準化**
   - 新しいコンテナは必ず `watchme-network` に接続
   - `docker-compose.yml` に `networks` セクションを明記
   - **コンテナ名の命名規則:** ハイフン区切りで統一（例: `api-transcriber`、`opensmile-api`）

4. **ヘルスチェックの実装**
   - 各APIにヘルスチェックエンドポイントを実装
   - docker-composeでヘルスチェックを設定

5. **ログ監視**
   - `docker logs` コマンドで定期的にログを確認
   - スケジューラーのログは `/var/log/scheduler/` に保存される

6. **エンドポイントのテスト方法**
   ```bash
   # Docker環境でのテスト（EC2サーバー上で実行）
   docker exec watchme-scheduler-prod python /app/run-api-process-docker.py [API名]
   
   # 例：emotion-aggregatorのテスト
   docker exec watchme-scheduler-prod python /app/run-api-process-docker.py emotion-aggregator
   ```