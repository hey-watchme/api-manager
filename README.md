# API Manager - WatchMe プラットフォーム

## 概要

API Managerは、WatchMeプラットフォームの複数のマイクロサービスAPIを統合管理するためのWebアプリケーションです。各APIの手動実行、スケジュール実行、パラメータ管理などを一元的に行うことができます。

**本番URL**: https://api.hey-watch.me/manager  
**開発環境**: http://localhost:9001  
**GitHubリポジトリ**: https://github.com/matsumotokaya/watchme-api-manager

### 📊 本番環境デプロイ状況（2025年8月8日更新）

✅ **デプロイ完了** - API Managerは本番環境で正常に稼働中です

#### 自動化済みAPI
現在、以下のAPIの自動実行がAPI Managerで管理されています：

- **[心理] Whisper書き起こし** - ✅ 実装済み・動作確認済み
- **[心理] プロンプト生成** - ✅ 実装済み・動作確認済み  
- **[心理] スコアリング** - ✅ 実装済み・動作確認済み
- **[行動] 音声イベント検出** - 🔄 設定中
- **[行動] 音声イベント集計** - 🔄 設定中
- **[感情] 音声特徴量抽出** - 🔄 設定中
- **[感情] 感情スコア集計** - 🔄 設定中

---

## アーキテクチャ

本アプリケーションは、UIを提供する「フロントエンド(React)」と、スケジューラー機能を担う「バックエンドAPI(Python)」の2つのサーバーで構成されています。詳細はリポジトリ内の各ソースコードを参照してください。

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

#### デプロイ時の注意点

1.  **環境変数の設定**: EC2サーバーの `/home/ubuntu/watchme-api-manager/.env` ファイルに適切な環境変数を設定する必要があります。
2.  **ネットワーク接続**: 各コンテナは `watchme-network` に接続して、他のサービスと通信できるようにする必要があります。
3.  **ヘルスチェック**: デプロイ後は必ず以下のエンドポイントで動作確認を行ってください：
    - フロントエンド: https://api.hey-watch.me/manager/
    - スケジューラーAPI: https://api.hey-watch.me/scheduler/status/whisper

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