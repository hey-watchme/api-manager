# WatchMe Scheduler デプロイガイド

## 概要

WatchMe SchedulerはAPI Managerの自動処理機能を提供するバックエンドサービスです。
FastAPIで構築され、cron設定の動的管理と処理実行を行います。

## アーキテクチャ

```
┌─────────────────────────┐      HTTP API      ┌─────────────────────────┐
│   API Manager           │ ─────────────────── │  Scheduler API          │
│   (React + Vite)        │   /api/scheduler    │  (FastAPI + Python)     │
│   ポート: 9001          │                     │  ポート: 8015           │
└─────────────────────────┘                     └─────────────────────────┘
```

## デプロイ方法

### 方法1: 個別デプロイ（推奨）

#### 1. Schedulerのみデプロイ

```bash
# 1. schedulerディレクトリに移動
cd scheduler/

# 2. 実行権限を付与
chmod +x deploy-ecr.sh run-prod.sh

# 3. ECRにイメージをプッシュ
./deploy-ecr.sh

# 4. EC2で以下を実行
ssh -i ~/watchme-key.pem ubuntu@3.24.16.82

# 必要なファイルをコピー（初回のみ）
cd ~
mkdir -p scheduler
# ローカルからscheduler/docker-compose.prod.ymlとrun-prod.shをコピー

# 環境変数を設定（whisper APIから）
cp /home/ubuntu/api_whisper_v1/.env ~/scheduler/.env

# scheduler起動
cd ~/scheduler
./run-prod.sh
```

### 方法2: 統合デプロイ

#### API ManagerとSchedulerを同時にデプロイ

```bash
# 1. 両方のイメージをECRにプッシュ
./deploy-ecr.sh                    # API Manager用
cd scheduler && ./deploy-ecr.sh    # Scheduler用

# 2. EC2で統合起動
ssh -i ~/watchme-key.pem ubuntu@3.24.16.82
cd ~/api-manager

# 既存コンテナを停止
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.all.yml down

# 統合起動
docker-compose -f docker-compose.all.yml up -d
```

## cronジョブの権限設定

Schedulerがcron設定を管理するため、以下の権限設定が必要です：

```bash
# EC2で実行
# dockerコンテナがcron.dにアクセスできるように権限設定
sudo chmod 755 /etc/cron.d
sudo chown ubuntu:ubuntu /etc/cron.d/watchme-scheduler
```

## 環境変数

Schedulerに必要な環境変数：

```env
# Supabase設定（必須）
SUPABASE_URL=https://qvtlwotzuzbavrzqhyvt.supabase.co
SUPABASE_KEY=your_supabase_key
```

## 動作確認

### 1. ヘルスチェック

```bash
# Scheduler API
curl http://localhost:8015/

# API Manager
curl http://localhost:9001/
```

### 2. ログ確認

```bash
# Schedulerコンテナログ
docker logs -f watchme-scheduler-prod

# cron実行ログ
tail -f /var/log/scheduler/scheduler-whisper.log
```

### 3. 自動処理の有効化テスト

1. API Manager UIにアクセス: http://localhost:9001
2. Whisper Transcriberモジュールを開く
3. 「自動処理」セクションで「有効」をトグル
4. 処理間隔を設定（例：3時間）
5. cron設定が作成されることを確認：

```bash
cat /etc/cron.d/watchme-scheduler
# 例: 0 */3 * * * ubuntu /home/ubuntu/scheduler/run-api-process.py whisper
```

## トラブルシューティング

### 問題1: Scheduler APIが起動しない

```bash
# コンテナ状態確認
docker ps -a | grep scheduler

# 詳細ログ確認
docker logs watchme-scheduler-prod

# ポート使用状況確認
sudo lsof -i :8015
```

### 問題2: cron設定が反映されない

```bash
# cron設定ファイル確認
ls -la /etc/cron.d/watchme-scheduler

# cronサービス再起動
sudo service cron restart

# syslogでcron実行確認
sudo tail -f /var/log/syslog | grep CRON
```

### 問題3: 処理が実行されない

```bash
# run-api-process.pyの権限確認
docker exec watchme-scheduler-prod ls -la /app/

# 手動実行テスト
docker exec watchme-scheduler-prod python /app/run-api-process.py whisper

# Supabase接続確認
docker exec watchme-scheduler-prod env | grep SUPABASE
```

## セキュリティ注意事項

1. **cron権限**: コンテナにcron.dへの書き込み権限を与えているため、本番環境では適切な権限管理が必要
2. **API認証**: 現在は認証なし。本番環境ではAPI認証の実装を推奨
3. **ネットワーク**: schedulerは内部ネットワークのみで動作させることを推奨

## 今後の改善点

1. **systemdサービス化**: より安定した運用のため
2. **専用cronユーザー**: セキュリティ向上のため
3. **モニタリング**: Prometheus/Grafana連携
4. **バックアップ**: 設定ファイルの定期バックアップ