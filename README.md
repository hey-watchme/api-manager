# API Manager - WatchMe プラットフォーム

## 概要

API Managerは、WatchMeプラットフォームの複数のマイクロサービスAPIを統合管理するためのWebアプリケーションです。各APIの手動実行、スケジュール実行、パラメータ管理などを一元的に行うことができます。

**本番URL**: https://api.hey-watch.me/manager  
**開発環境**: http://localhost:9001  
**API接続**: 直接HTTPS（CORS許可済み）  
**GitHubリポジトリ**: https://github.com/matsumotokaya/watchme-api-manager

## 主な機能

- **API手動実行**: 各APIに対してパラメータを指定して即座に実行
- **スケジュール管理**: 日付・時間を指定した自動実行スケジュールの設定
- **実行履歴管理**: APIの実行結果と履歴の確認
- **ステータス監視**: 各APIサービスの稼働状況をリアルタイムで確認

## 管理対象API

### 1. 心理グラフ(Vibe)API（4つ）
- **OpenAI音声書き起こしAPI (Whisper Transcriber)**: OpenAI Whisperで音声をテキストに変換
  - エンドポイント: `https://api.hey-watch.me/vibe-transcriber/fetch-and-transcribe`
- **Azure音声書き起こしAPI (Azure Transcriber)**: Azure Speech Serviceで音声をテキストに変換
  - エンドポイント: `https://api.hey-watch.me/vibe-transcriber-v2/fetch-and-transcribe`
- **プロンプト生成API (Vibe Aggregator)**: 心理分析用のプロンプトを生成
  - エンドポイント: `https://api.hey-watch.me/vibe-aggregator/generate-mood-prompt-supabase`
- **スコアリングAPI (Vibe Scorer)**: 心理状態のスコアを算出
  - エンドポイント: `https://api.hey-watch.me/vibe-scorer/analyze-vibegraph-supabase`

### 2. 行動グラフAPI（2つ）
- **行動特徴抽出API (SED音響イベント検出)**: 音響イベントから行動パターンを検出
  - エンドポイント: `https://api.hey-watch.me/behavior-features/fetch-and-process-paths`
- **行動分析API (SED Aggregator)**: 抽出された特徴を分析し行動パターンを評価
  - エンドポイント: `https://api.hey-watch.me/behavior-aggregator/analysis/sed`

### 3. 感情グラフAPI（2つ）
- **感情特徴抽出API (OpenSMILE)**: 音声から感情特徴を抽出
  - エンドポイント: `https://api.hey-watch.me/emotion-features/process/emotion-features`
- **感情分析API (OpenSMILE Aggregator)**: 感情の時系列変化を分析
  - エンドポイント: `https://api.hey-watch.me/emotion-aggregator/analyze/opensmile-aggregator`

## アーキテクチャ

### 設計原則
- **モジュール分離**: 1つのAPIに対して1つの独立したモジュール
- **疎結合**: 各モジュール間の依存関係を最小限に
- **直接接続**: プロキシを使わず本番APIに直接HTTPS接続
- **再利用性**: 共通コンポーネントの活用
- **拡張性**: 新しいAPIの追加が容易

### 直接HTTPS接続アーキテクチャ 🆕

本APIマネージャーは、従来のプロキシサーバー方式を廃止し、**フロントエンドから本番APIへの直接HTTPS接続**を採用しています。

```
┌─────────────────────────┐      Direct HTTPS      ┌─────────────────────────┐
│   API Manager           │ ────────────────────────│  Production APIs       │
│   (React + Vite)        │    (CORS Enabled)       │  (api.hey-watch.me)    │
│   localhost:9001        │                         │                        │
├─────────────────────────┤                         ├─────────────────────────┤
│ BehaviorFeaturesClient  │──────────────────────── │ behavior-features       │
│ TranscriberClient       │──────────────────────── │ vibe-transcriber        │
│ AggregatorClient        │──────────────────────── │ vibe-aggregator         │
│ ScorerClient            │──────────────────────── │ vibe-scorer             │
└─────────────────────────┘                         └─────────────────────────┘
```

#### ✅ メリット
- **シンプリティ**: プロキシサーバー不要で構成が簡潔
- **パフォーマンス**: 中間サーバーがないため高速
- **保守性**: サーバー管理やプロキシ設定の複雑さを排除
- **デバッグ**: ネットワークエラーの原因が特定しやすい
- **セキュリティ**: 本番APIのCORS設定による直接的なセキュリティ制御

### ディレクトリ構造

```
api-manager/
├── src/
│   ├── components/          # 共通UIコンポーネント
│   │   ├── common/         # 汎用コンポーネント
│   │   ├── api/            # API実行用コンポーネント
│   │   └── scheduler/      # スケジューラーコンポーネント
│   ├── modules/            # APIモジュール
│   │   ├── psychology/     # 心理グラフAPI
│   │   ├── behavior/       # 行動グラフAPI
│   │   └── emotion/        # 感情グラフAPI
│   ├── pages/              # ページコンポーネント
│   ├── services/           # APIクライアント（直接HTTPS接続）
│   └── utils/              # ユーティリティ
├── vite.config.js          # Vite設定ファイル
├── start.sh               # 起動スクリプト
├── stop.sh                # 停止スクリプト
└── package.json
```

## 技術スタック

### フロントエンド
- React 18.3.1
- React Router DOM 7.7.0（ルーティング）
- Vite 5.1.6（開発サーバー）
- Tailwind CSS 3.4.1
- Chart.js 4.4.9（結果可視化）
- Lucide React（アイコン）

### API接続
- Axios（HTTP クライアント）
- 直接HTTPS接続（本番APIに直接アクセス）
- CORS許可設定済み
- タイムアウト制御（10分）

## クイックスタート

### 🚀 起動方法（シンプル）

```bash
# 開発サーバー起動
./start.sh

# 停止
./stop.sh

# ヘルスチェック
./health.sh
```

### 📋 各種スクリプト

```bash
# 開発サーバー起動
./start.sh                    # Vite開発サーバー起動

# 本番ビルド・プレビュー
./build.sh                    # 本番用ビルド実行
./preview.sh                  # 本番ビルドをプレビュー

# メンテナンス
./stop.sh                     # サーバー停止
./health.sh                   # 動作確認

# 直接コマンド（npm scripts）
npm run dev                   # 開発サーバー
npm run build                 # ビルド
npm start                     # 本番プレビュー
```

起動後、以下のURLでアクセスできます：
- **フロントエンド**: http://localhost:9001

### ページアクセス（React Router対応）
- **Vibe（心理グラフ）**: http://localhost:9001/vibe
- **行動グラフ**: http://localhost:9001/behavior ✅**稼働中**
- **感情グラフ**: http://localhost:9001/emotion ✅**稼働中**

## 現在の動作状況

### 🎉 全7つのAPIが完全稼働中！（2025-07-24完成）

#### ✅ 完全動作確認済みのAPI

1. **🎤 Whisper Transcriber（OpenAI音声文字起こし）** - 心理グラフ
   - エンドポイント: `https://api.hey-watch.me/vibe-transcriber/fetch-and-transcribe`
   - エンジン: OpenAI Whisper（baseモデル）
   - 処理時間: 約2-3秒/分
   - 特徴: 本番環境でbaseモデルのみ利用可能（t4g.small, 2GB RAM制約）

2. **🎤 Azure Transcriber（Azure音声文字起こし）** - 心理グラフ
   - エンドポイント: `https://api.hey-watch.me/vibe-transcriber-v2/fetch-and-transcribe`
   - エンジン: Azure Speech Service
   - 処理時間: 高速処理（クラウドベース）
   - 注意: 本番環境でAzureアクセス問題あり（認識結果が空になる場合がある）

3. **📝 Vibe Aggregator（プロンプト生成）** - 心理グラフ
   - エンドポイント: `https://api.hey-watch.me/vibe-aggregator/generate-mood-prompt-supabase`
   - デバイスIDと日付を指定して処理
   - 処理時間: 通常1分以内

4. **🤖 Vibe Scorer（スコアリング）** - 心理グラフ
   - エンドポイント: `https://api.hey-watch.me/vibe-scorer/analyze-vibegraph-supabase`
   - ChatGPTによる心理状態分析
   - 平均スコア、ポジティブ/ネガティブ/ニュートラル時間を算出

5. **🔊 Behavior Features（行動特徴抽出）** - 行動グラフ
   - エンドポイント: `https://api.hey-watch.me/behavior-features/fetch-and-process-paths`
   - YamNetモデルによる521種類の音響イベント検出
   - 処理時間: 2～10秒（高速処理）

6. **📊 Behavior Aggregator（行動分析）** - 行動グラフ
   - エンドポイント: `https://api.hey-watch.me/behavior-aggregator/analysis/sed`
   - 行動パターンの統計分析
   - 時系列での行動変化を評価

7. **😊 Emotion Features（感情特徴抽出）** - 感情グラフ
   - エンドポイント: `https://api.hey-watch.me/emotion-features/process/emotion-features`
   - OpenSMILEによる25種類の感情特徴量抽出
   - 1秒ごとの詳細な感情分析

8. **📈 Emotion Aggregator（感情分析）** - 感情グラフ
   - エンドポイント: `https://api.hey-watch.me/emotion-aggregator/analyze/opensmile-aggregator`
   - 感情の時系列変化パターン分析
   - 統計情報と感情トレンドの生成

### システム機能
- ✅ API Manager正常起動（Vite単体構成）
- ✅ React Router DOM対応（URLベースナビゲーション）
- ✅ **直接HTTPS接続**（プロキシサーバー廃止）
- ✅ CORS許可対応済み本番API接続
- ✅ 強化されたエラーハンドリングとタイムアウト制御
- ✅ シンプル起動スクリプト（フロントエンドのみ）
- ✅ 成功・失敗メッセージの適切な表示

## Git 運用ルール（ブランチベース開発フロー）

このプロジェクトでは、**ブランチベースの開発フロー**を採用しています。  
main ブランチで直接開発せず、以下のルールに従って作業を進めてください。

---

### 🔹 運用ルール概要

1. `main` ブランチは常に安定した状態を保ちます（リリース可能な状態）。
2. 開発作業はすべて **`feature/xxx` ブランチ** で行ってください。
3. 作業が完了したら、GitHub上で Pull Request（PR）を作成し、差分を確認した上で `main` にマージしてください。
4. **1人開発の場合でも、必ずPRを経由して `main` にマージしてください**（レビューは不要、自分で確認＆マージOK）。

---

### 🔧 ブランチ運用の手順

#### 1. `main` を最新化して作業ブランチを作成
```bash
git checkout main
git pull origin main
git checkout -b feature/機能名
```

#### 2. 作業内容をコミット
```bash
git add .
git commit -m "変更内容の説明"
```

#### 3. リモートにプッシュしてPR作成
```bash
git push origin feature/機能名
# GitHub上でPull Requestを作成
```

## セットアップ

### 前提条件
- Node.js 18以上
- npm または yarn

### 詳細なセットアップ手順

```bash
# 1. リポジトリのクローン
git clone git@github.com:matsumotokaya/watchme-api-manager.git
cd watchme-api-manager

# 2. 依存関係のインストール
npm install

# 3. 環境変数の確認（.envファイルは既に設定済み）
cat .env

# 4. 開発サーバーの起動
./start.sh
# または
npm run dev

# 5. 本番ビルド（必要に応じて）
./build.sh
# または  
npm run build

# 6. 本番プレビュー（必要に応じて）
./preview.sh
# または
npm start
```

### 環境変数

`.env`ファイルを作成し、以下の変数を設定：

```env
# Supabase設定
VITE_SUPABASE_URL=https://qvtlwotzuzbavrzqhyvt.supabase.co
VITE_SUPABASE_KEY=your_supabase_anon_key

# API エンドポイント（本番環境）
VITE_API_BASE_URL=https://api.hey-watch.me

# 開発環境設定
VITE_PORT=9001

# その他の設定
VITE_API_TIMEOUT=30000
```

## 使用方法

### 1. APIの手動実行
1. 左側のナビゲーションから実行したいAPIカテゴリを選択
2. APIモジュールを選択
3. 必要なパラメータを入力
4. 「実行」ボタンをクリック

### 2. スケジュール設定
1. APIモジュールの「スケジュール」タブを選択
2. 実行日時とパラメータを設定
3. 「スケジュール登録」をクリック

### 3. 実行履歴の確認
1. 「履歴」タブから過去の実行結果を確認
2. 詳細をクリックして結果の詳細を表示

## 開発ガイドライン

### 新しいAPIモジュールの追加

1. `src/modules/`配下に新しいディレクトリを作成
2. APIクライアントを`src/services/`に追加
3. モジュールコンポーネントを実装
4. ルーティングに追加

### コンポーネント開発規則

- TypeScriptの使用を推奨
- Pydanticスキーマとの整合性を保つ
- エラーハンドリングの実装
- ローディング状態の管理

## トラブルシューティング

### よくある起動問題と解決方法

#### 1. ポートが使用中の場合
```bash
# 停止スクリプトを使用（推奨）
./stop.sh

# または手動で確認と終了
lsof -i :9001
kill -9 <PID>
```

#### 2. プロセスが完全に停止されない
**症状**: ./stop.shを実行してもプロセスが残存  
**解決策**: 
```bash
# 強制停止
./stop.sh
ps aux | grep "watchme-api-manager\|vite"
kill -9 <残存プロセスのPID>
```

#### 3. 起動確認方法
```bash
# プロセス確認
lsof -i :9001  # Viteサーバー

# ブラウザでアクセス
# http://localhost:9001
```

### API接続エラー
- **本番APIの稼働状況を確認**: `https://api.hey-watch.me`が稼働中か確認
- **CORS エラーの場合**: 本番API側のCORS設定を確認
- **タイムアウトエラー**: 処理時間が長い場合は正常（特にWhisper API）
- **ネットワーク接続**: インターネット接続とHTTPS アクセス可能性を確認

### 起動時の自動チェック機能
シンプル化されたstart.shには以下の機能が含まれています：
- 既存プロセスの自動クリーンアップ
- ポート競合の自動解決（9001番ポートのみ）
- 依存関係の自動インストール確認
- 起動後のヘルスチェック
- 詳細な起動ログ表示

### 最新機能（v4.0.0）🎉 - 2つのTranscriberセクション追加（2025-07-26）
- **🎤 Whisper & Azure Transcriber分離**: 1つのTranscriberから2つの独立したセクションに分割
- **未処理ファイル自動取得機能**: データベース（audio_files）から未処理ファイルを自動取得
- **共通コンポーネント化**: FetchPendingFilesButtonとして再利用可能なコンポーネント作成
- **ステータス別取得**: transcriptions_status, behavior_features_status, emotion_features_status対応
- **手動ファイルパス編集**: 自動取得後に不要なパスを削除・編集可能

### v3.0.0機能 - 全API完全稼働
- **全8つのAPI完全統合**: 心理（Whisper + Azure）・行動・感情グラフの全APIが稼働
- **統一されたUI/UX**: adminアプリケーションと同じ操作感
- **デバイスID＋日付指定方式**: 心理グラフAPIで採用
- **リアルタイム結果表示**: 各APIの処理結果を即座に確認可能

### v2.0.0機能 - プロキシ廃止アーキテクチャ
- **完全プロキシ廃止**: Express サーバーを完全削除、Vite単体構成に移行
- **直接HTTPS接続**: フロントエンドから本番APIへの直接アクセス
- **シンプル構成**: ポート1個（9001）のみ、複雑なプロキシ設定を排除
- **CORS対応完了**: 本番API側でCORS許可済み
- **高速起動**: プロキシサーバーがないため起動が高速
- **保守性向上**: サーバー関連の依存関係削除による保守コスト削減

### v1.2.0機能
- **行動グラフAPI実装**: SED音響イベント検出が完全稼働
- **YamNet音響イベント検出**: 521種類の音響イベントを高精度で検出
- **改善されたAPIクライアント**: 10分タイムアウト、全ステータスコード対応

### v1.1.0基盤機能
- **React Router DOM**: URLベースナビゲーション、直接アクセス対応
- **強化されたログ機能**: タイムスタンプ付き詳細ログ
- **改善されたエラー表示**: タイムアウトと接続エラーの区別
- **10分タイムアウト**: Whisper処理の長時間実行に対応

## デプロイメント

## 🚀 本番環境へのデプロイ手順（ECRを使用）

> **重要**: WatchMeプラットフォームの全APIは、統一されたECRベースのデプロイ方式を使用します。
> 他のデプロイ方法はサポートされていません。

### 🎯 デプロイ方式の特徴

- ✅ **統一性**: 全APIで同じデプロイプロセス
- ✅ **バージョン管理**: タイムスタンプ付きイメージタグ
- ✅ **セキュリティ**: IAMロールベースの認証
- ✅ **スケーラビリティ**: EC2、ECS、EKSで共通利用可能
- ✅ **CI/CD対応**: GitHub Actionsとの統合容易

### 📋 デプロイの前提条件

#### 1. ECRリポジトリの作成
```bash
# AWS CLIでECRリポジトリを作成
aws ecr create-repository \
  --repository-name watchme-api-manager \
  --region ap-southeast-2

# 作成されるリポジトリURL例:
# 754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-api-manager
```

#### 🔰 初回デプロイ時の重要な注意点
```bash
# 初回デプロイ時は、EC2インスタンスに以下のファイルを配置する必要があります：

# 1. ローカルからEC2に必要なファイルをコピー
scp -i ~/watchme-key.pem docker-compose.prod.yml ubuntu@3.24.16.82:~/
scp -i ~/watchme-key.pem run-prod.sh ubuntu@3.24.16.82:~/
scp -i ~/watchme-key.pem .env ubuntu@3.24.16.82:~/  # 必要な場合

# 2. run-prod.shに実行権限を付与
ssh -i ~/watchme-key.pem ubuntu@3.24.16.82 "chmod +x run-prod.sh"

# これらのファイルは一度配置すれば、以降のデプロイでは再配置不要です
```

#### 2. EC2インスタンスの設定
```bash
# IAMロール「EC2-ECR-Access-Role」をEC2インスタンスにアタッチ
# 必要な権限:
# - AmazonEC2ContainerRegistryReadOnly
# - または ecr:GetAuthorizationToken, ecr:BatchCheckLayerAvailability, 
#   ecr:GetDownloadUrlForLayer, ecr:BatchGetImage
```

#### 3. Docker環境
- Docker & Docker Compose インストール済み
- マルチステージビルド対応Dockerfile

### 🛠️ デプロイ手順

#### Step 1: ローカル開発・テスト
```bash
# 1. 開発環境でテスト
npm run dev

# 2. 本番ビルドテスト  
npm run build

# 3. Dockerビルドテスト
docker build -t watchme-api-manager .
docker run -p 9001:9001 watchme-api-manager
```

#### Step 2: ECRにイメージをプッシュ
```bash
# デプロイスクリプトを実行
./deploy-ecr.sh
```

**deploy-ecr.sh の内容:**
```bash
#!/bin/bash
set -e

# 変数設定
AWS_REGION="ap-southeast-2"
ECR_REPOSITORY="754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-api-manager"
IMAGE_TAG="latest"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "=== ECRへのデプロイを開始します ==="

# ECRにログイン
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_REPOSITORY

# Dockerイメージをビルド
docker build -t watchme-api-manager .

# ECR用のタグを付与
docker tag watchme-api-manager:latest $ECR_REPOSITORY:$IMAGE_TAG
docker tag watchme-api-manager:latest $ECR_REPOSITORY:$TIMESTAMP

# ECRにプッシュ
docker push $ECR_REPOSITORY:$IMAGE_TAG
docker push $ECR_REPOSITORY:$TIMESTAMP

echo "=== デプロイが完了しました ==="
echo "ECRリポジトリ: $ECR_REPOSITORY"
echo "イメージタグ: $IMAGE_TAG および $TIMESTAMP"
```

#### Step 3: 本番環境でデプロイ

> **重要**: ECRベースのデプロイでは、プロジェクトのソースコードをEC2に配置する必要はありません。
> EC2インスタンスには以下のファイルのみが必要です：
> - `docker-compose.prod.yml` - Docker Compose設定ファイル
> - `run-prod.sh` - デプロイ実行スクリプト  
> - `.env` - 環境変数ファイル（必要な場合）
>
> **ソースコードはDockerイメージ内に含まれているため、EC2上にapi-managerディレクトリは存在しません。**

```bash
# EC2インスタンスにSSH接続
ssh -i ~/watchme-key.pem ubuntu@3.24.16.82

# 本番環境起動スクリプトを実行（ホームディレクトリから直接実行）
./run-prod.sh

# または、既に稼働中のコンテナを確認
docker ps | grep api-manager
```

**run-prod.sh の内容:**
```bash
#!/bin/bash
set -e

ECR_REPOSITORY="754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-api-manager"
AWS_REGION="ap-southeast-2"

echo "=== watchme-api-manager 本番環境起動 ==="

# ECRから最新イメージをプル
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_REPOSITORY
docker pull $ECR_REPOSITORY:latest

# 既存のコンテナを停止・削除
docker-compose -f docker-compose.prod.yml down || true

# 本番環境でコンテナを起動
docker-compose -f docker-compose.prod.yml up -d

echo "=== 起動完了 ==="
echo "アプリケーションURL: http://localhost:9001"
```

#### Step 4: Nginx設定（外部公開）
```bash
# Nginx設定ファイルに追加
sudo nano /etc/nginx/sites-available/api.hey-watch.me

# 以下の設定を追加:
location /manager/ {
    proxy_pass http://localhost:9001/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # CORS設定
    add_header "Access-Control-Allow-Origin" "*";
    add_header "Access-Control-Allow-Methods" "GET, POST, OPTIONS";
    add_header "Access-Control-Allow-Headers" "Content-Type, Authorization";
    
    if ($request_method = "OPTIONS") {
        return 204;
    }
}

# 設定テストと適用
sudo nginx -t
sudo systemctl reload nginx
```

### 📁 必要なファイル構成

```
project-root/
├── Dockerfile                 # マルチステージビルド対応
├── docker-compose.prod.yml    # 本番環境用Compose設定
├── deploy-ecr.sh              # ECRプッシュスクリプト
├── run-prod.sh                # 本番環境起動スクリプト
├── .env.example               # 環境変数テンプレート
├── nginx-config.txt           # Nginx設定リファレンス
└── package.json               # Node.js依存関係
```

### 🔧 設定ファイル詳細

#### docker-compose.prod.yml
```yaml
version: '3.8'

services:
  api-manager:
    image: 754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-api-manager:latest
    container_name: watchme-api-manager-prod
    ports:
      - "9001:9001"
    environment:
      - NODE_ENV=production
      - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
      - VITE_SUPABASE_KEY=${VITE_SUPABASE_KEY}
      - VITE_API_BASE_URL=${VITE_API_BASE_URL}
      - VITE_PORT=9001
      - VITE_API_TIMEOUT=${VITE_API_TIMEOUT}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9001/"]
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

#### Dockerfile（マルチステージビルド）
```dockerfile
# Node.js 20のAlpineイメージを使用（軽量）
FROM node:20-alpine

# 作業ディレクトリを設定
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm ci

# アプリケーションのソースコードをコピー
COPY . .

# ビルドを実行
RUN npm run build

# ポート9001を公開
EXPOSE 9001

# Nginxイメージを使用してビルド済みファイルを配信
FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 9001
CMD ["nginx", "-g", "daemon off;"]
```

### 🚨 トラブルシューティング

#### よくある問題と解決方法

1. **「api-managerディレクトリが見つからない」エラー**
```bash
# 問題: cd: /home/ubuntu/watchme-api-manager: No such file or directory
# 原因: ECRベースのデプロイではソースコードをEC2に配置しません
# 解決: ホームディレクトリから直接run-prod.shを実行
cd ~
./run-prod.sh
```

2. **AWS CLI認証エラー**
```bash
# 問題: Unable to locate credentials
# 解決: EC2にIAMロールをアタッチ
aws sts get-caller-identity  # 認証確認
```

2. **ECRログインエラー**
```bash
# 問題: Error: Cannot perform an interactive login
# 解決: AWS CLI v2を公式インストーラでインストール
curl "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

3. **コンテナ起動失敗**
```bash
# ログ確認
docker logs watchme-api-manager-prod

# コンテナ状態確認
docker ps -a | grep manager

# 強制再起動
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

### 📊 運用監視

#### ヘルスチェック
```bash
# アプリケーション応答確認
curl -f https://api.hey-watch.me/manager/

# コンテナ状態確認
docker ps | grep watchme-api-manager-prod

# リソース使用量確認
docker stats watchme-api-manager-prod
```

#### ログ管理
```bash
# リアルタイムログ
docker logs -f watchme-api-manager-prod

# 最新50行
docker logs watchme-api-manager-prod --tail 50

# 日時指定
docker logs watchme-api-manager-prod --since="2025-07-23T00:00:00"
```

### 🔄 CI/CD統合（今後の拡張用）

#### GitHub Actions例
```yaml
name: ECR Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
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
        ./deploy-ecr.sh
    
    - name: Deploy to EC2
      run: |
        # SSH経由でEC2にデプロイ
        ssh -i ${{ secrets.EC2_KEY }} ubuntu@3.24.16.82 './run-prod.sh'
```

### 📈 スケーリング考慮事項

#### 水平スケーリング
- **ロードバランサー**: ALB + 複数EC2インスタンス
- **Auto Scaling**: EC2 Auto Scaling Group
- **ECS**: Fargate or EC2ベースのクラスター

#### 垂直スケーリング
- **リソース調整**: CPUとメモリの最適化
- **Dockerリソース制限**: docker-compose.yml での制限設定

---

## ⚡ 他のAPIへの適用手順

> **このECRデプロイプロセスは、WatchMeプラットフォームの全API（Python FastAPI等）で標準化可能**

### 1. 新しいAPIプロジェクトでの適用
```bash
# 1. ECRリポジトリ作成
aws ecr create-repository --repository-name watchme-new-api --region ap-southeast-2

# 2. 必要ファイルをコピー
cp deploy-ecr.sh ../new-api-project/
cp run-prod.sh ../new-api-project/  
cp docker-compose.prod.yml ../new-api-project/

# 3. 設定を新しいAPIに合わせて修正
# - ECRリポジトリURL
# - ポート番号
# - 環境変数

# 4. 同じデプロイプロセスを実行
./deploy-ecr.sh
./run-prod.sh
```

### 2. 設定のカスタマイズポイント
- **ECRリポジトリURL**: 各API専用に作成
- **ポート番号**: API毎に異なるポート（8001, 8002, etc.）
- **Nginxロケーション**: `/new-api/` 等の専用パス
- **環境変数**: API固有の設定値

これにより、**全てのWatchMe APIが統一されたECRベースデプロイ**で管理可能になります。

## 注意事項

### APIアクセスについて
- フロントエンドから本番API（`https://api.hey-watch.me`）に直接HTTPS接続します
- CORS設定により、localhost:9001からの接続が許可されています
- 開発環境でも本番APIを使用するため、操作には十分注意してください
- プロキシサーバーは使用せず、シンプルな直接接続構成です

### ⚠️ 重要：Whisper API処理時間について
- **音声処理（Whisper API）は処理時間が非常に変動的です**
- 処理時間の範囲：**70秒～10分程度**（音声の長さや複雑さによる）
- **タイムアウトエラーが表示されても、実際の処理は成功している場合がほとんどです**
- タイムアウトが発生した場合は、以下の方法で処理結果を確認してください：
  1. データベースで処理ステータスを確認
  2. 少し時間をおいてから再度確認
  3. ログで実際の処理状況を確認

### タイムアウト設定について
- 現在のタイムアウト設定：5分（300秒）
- 長い音声ファイルの場合、タイムアウトは避けられません
- **タイムアウト = 処理失敗ではない**ことを理解してください

### Python実行環境
- サーバーサイドでPythonを使用する場合は、必ず `python3` コマンドを使用してください
- `pip` の代わりに `pip3` を使用してください

## 必要な設定ファイル

### nginx.conf（リポジトリに含まれています）
```nginx
server {
    listen 9001;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    # SPAのルーティング対応
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静的ファイルのキャッシュ設定
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## トラブルシューティング補足

### 過去の事例から学んだ重要なポイント

#### 1. **CORS対応の重要性**
**問題**: API Manager から本番APIへの直接接続が CORS エラーで失敗
```javascript
// ❌ プロキシ経由接続が不安定
const response = await axios.post('/api/behavior-features', data)

// ✅ 直接HTTPS接続 + CORS許可対応
const response = await axios.post('https://api.hey-watch.me/behavior-features/fetch-and-process-paths', data)
```

**解決策**: APIクライアントで直接HTTPS接続を使用し、サーバーサイドでCORS設定を調整
- タイムアウトを10分に延長（SED音響処理対応）
- validateStatusで全ステータスコードを受け入れ
- ブラウザのセキュリティポリシーに適合

#### 2. **Docker依存関係管理**
**最も重要な学習**: requirements.txt と requirements-docker.txt の使い分け

**発生した問題**:
```bash
ModuleNotFoundError: No module named 'boto3'
```

**根本原因**:
- macOS開発環境用: `tensorflow-macos` (requirements.txt)
- Linux本番環境用: `tensorflow` (requirements-docker.txt)  
- boto3がrequirements-docker.txtに含まれていない

**解決策**:
```bash
# requirements-docker.txt に明示的に追加
echo "boto3>=1.26.0" >> requirements-docker.txt
echo "botocore>=1.29.0" >> requirements-docker.txt

# 改行の確認も重要
cat requirements-docker.txt | grep -A1 -B1 boto3
```

#### 3. **効率的デプロイ手順**
**今回実績**: 初回60分 → 次回予想15分（4倍効率化）

**ベストプラクティス**:
```bash
# 1. 事前チェック（必須）
□ 新エンドポイントのローカル動作確認
□ requirements.txtにすべての依存関係記載
□ .envファイル存在確認  
□ venvディレクトリ除外でファイルサイズ確認

# 2. 効率的な圧縮（重要）
tar --exclude="venv" --exclude="*.log" --exclude="*.tar.gz" \
    -czf project_updated.tar.gz .

# 3. 一括デプロイスクリプト
scp -i ~/watchme-key.pem project.tar.gz ubuntu@EC2_IP:~/
ssh -i ~/watchme-key.pem ubuntu@EC2_IP << 'EOF'
    # バックアップ作成
    cp -r existing_api existing_api_backup_$(date +%Y%m%d_%H%M%S)
    
    # 既存サービス停止
    sudo systemctl stop service-name
    sudo lsof -ti:PORT | xargs -r sudo kill -9
    
    # 展開・ビルド・起動
    tar -xzf project.tar.gz
    sudo docker-compose down
    sudo docker-compose build --no-cache
    sudo docker-compose up -d
    
    # 起動確認
    sleep 30
    curl -s http://localhost:PORT/ | grep -q "running" && echo "✅ 成功" || echo "❌ 失敗"
EOF
```

#### 4. **高速トラブルシューティング**
**診断コマンド**:
```bash
# システム状態一括確認
echo "Docker: $(sudo docker ps --filter 'name=api' --format 'table {{.Names}}\t{{.Status}}')"
echo "Port: $(sudo lsof -i:8004 | tail -n +2 || echo 'Free')"  
echo "API: $(curl -s http://localhost:8004/ 2>/dev/null || echo 'Not responding')"

# エラー原因特定
sudo docker-compose logs --tail=5
sudo journalctl -u service-name --no-pager -n 5
```



## ライセンス

[ライセンス情報]

## 貢献

[貢献ガイドライン]