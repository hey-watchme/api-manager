# WhisperからAzure Speech Serviceへの移行手順書

作成日: 2025年8月30日

## 📋 概要

Whisper APIからAzure Speech Service APIへの移行を行います。
Azure Speech APIは既にUI経由で動作確認済みのため、スケジューラー設定の変更のみ実施します。

## 🔄 変更内容

### 変更前
- **API**: Whisper (api-transcriber)
- **実行時刻**: 毎時10分
- **ステータスカラム**: transcriptions_status

### 変更後
- **API**: Azure Speech Service (vibe-transcriber-v2)
- **実行時刻**: 毎時10分（変更なし）
- **ステータスカラム**: transcriptions_status（変更なし）

## 📝 実施手順

### 1. スケジューラー設定の更新

#### 1.1 スケジューラーAPIサーバーのデプロイ

```bash
# ローカルで実行
cd /Users/kaya.matsumoto/projects/watchme/api/api-manager

# スケジューラーのDockerイメージをビルド・プッシュ
./deploy-scheduler.sh
```

#### 1.2 EC2サーバーでコンテナを更新

```bash
# EC2サーバーにSSH接続
ssh -i ~/watchme-key.pem ubuntu@3.24.16.82

# 最新イメージをプル
aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin 754724220380.dkr.ecr.ap-southeast-2.amazonaws.com
docker pull 754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-api-manager-scheduler:latest

# スケジューラーコンテナを再起動
cd /home/ubuntu/watchme-api-manager
docker-compose -f docker-compose.all.yml down watchme-scheduler-prod
docker-compose -f docker-compose.all.yml up -d watchme-scheduler-prod

# watchme-networkに接続確認
docker network connect watchme-network watchme-scheduler-prod 2>/dev/null || echo "既に接続済み"
```

### 2. Cron設定の更新

```bash
# EC2サーバーで実行

# 現在のcron設定をバックアップ
sudo cp /etc/cron.d/watchme-scheduler /etc/cron.d/watchme-scheduler.backup.$(date +%Y%m%d)

# 新しいcron設定をコピー（以下の内容をコピー＆ペースト）
sudo nano /etc/cron.d/watchme-scheduler
```

以下の内容に更新:
```cron
# WatchMe API Scheduler - Azure Transcriber対応版
# 
# 実行時刻:
# - 毎時10分: azure-transcriber (Azure音声書き起こし), behavior-features (行動特徴抽出)
# - 毎時20分: vibe-aggregator, behavior-aggregator, emotion-features
# - 毎時30分: emotion-aggregator
# - 3時間ごとの30分: vibe-scorer

# 毎時10分 - ファイルベース処理
10 * * * * ubuntu python3 /home/ubuntu/scheduler/run_if_enabled.py azure-transcriber >> /var/log/scheduler/cron.log 2>&1
10 * * * * ubuntu python3 /home/ubuntu/scheduler/run_if_enabled.py behavior-features >> /var/log/scheduler/cron.log 2>&1

# 毎時20分 - デバイスベース処理と追加のファイルベース処理
20 * * * * ubuntu python3 /home/ubuntu/scheduler/run_if_enabled.py vibe-aggregator >> /var/log/scheduler/cron.log 2>&1
20 * * * * ubuntu python3 /home/ubuntu/scheduler/run_if_enabled.py behavior-aggregator >> /var/log/scheduler/cron.log 2>&1
20 * * * * ubuntu python3 /home/ubuntu/scheduler/run_if_enabled.py emotion-features >> /var/log/scheduler/cron.log 2>&1

# 毎時30分 - デバイスベース処理
30 * * * * ubuntu python3 /home/ubuntu/scheduler/run_if_enabled.py emotion-aggregator >> /var/log/scheduler/cron.log 2>&1

# 3時間ごとの30分
30 */3 * * * ubuntu python3 /home/ubuntu/scheduler/run_if_enabled.py vibe-scorer >> /var/log/scheduler/cron.log 2>&1
```

```bash
# 権限設定
sudo chmod 644 /etc/cron.d/watchme-scheduler

# cronを再読み込み
sudo service cron reload
```

### 3. Azure Transcriberの有効化とWhisperの無効化

```bash
# EC2サーバーで実行

# API Managerの画面から設定
# ブラウザで https://api.hey-watch.me/manager/ にアクセス

# または、config.jsonを直接編集
nano /home/ubuntu/scheduler/config.json
```

config.jsonの内容を以下のように更新:
```json
{
  "apis": {
    "whisper": {
      "enabled": false,  // falseに変更
      "deviceId": "...",
      "processDate": "today"
    },
    "azure-transcriber": {
      "enabled": true,  // 新規追加
      "deviceId": "all",
      "processDate": "today"
    },
    // 他のAPIの設定...
  }
}
```

### 4. 動作確認

#### 4.1 手動実行テスト

```bash
# EC2サーバーで実行

# Azure Transcriberの手動実行
docker exec watchme-scheduler-prod python /app/run-api-process-docker.py azure-transcriber

# ログ確認
tail -f /var/log/scheduler/scheduler-azure-transcriber.log
```

#### 4.2 ネットワーク接続確認

```bash
# vibe-transcriber-v2がwatchme-networkに接続されているか確認
docker network inspect watchme-network | grep vibe-transcriber-v2

# もし接続されていない場合
docker network connect watchme-network vibe-transcriber-v2

# スケジューラーからの疎通確認
docker exec watchme-scheduler-prod ping -c 1 vibe-transcriber-v2
```

#### 4.3 API動作確認

```bash
# Azure Speech APIのヘルスチェック
curl http://localhost:8013/health

# 外部からの確認
curl https://api.hey-watch.me/vibe-transcriber-v2/
```

#### 4.4 処理結果の確認

```bash
# Supabaseで処理状況を確認
# transcriptions_statusが'pending'から'completed'に変わることを確認

# ログで処理完了を確認
docker logs vibe-transcriber-v2 --tail 50 | grep "処理完了"
```

## ⚠️ 注意事項

1. **Azure APIキーの確認**
   - `/home/ubuntu/vibe-transcriber-v2/.env`にAzure APIキーが設定されていることを確認

2. **処理時間**
   - Azureは外部APIのため、Whisperより処理時間が長くなる可能性があります
   - タイムアウトは10分に設定されています

3. **コスト管理**
   - Azure Speech Serviceは従量課金のため、処理量に応じてコストが発生します
   - 毎時実行のため、1日24回 × 処理ファイル数の課金が発生

## 🔄 ロールバック手順

問題が発生した場合は以下の手順でWhisperに戻せます:

```bash
# EC2サーバーで実行

# 1. cron設定を元に戻す
sudo cp /etc/cron.d/watchme-scheduler.backup.[日付] /etc/cron.d/watchme-scheduler
sudo service cron reload

# 2. config.jsonを編集
nano /home/ubuntu/scheduler/config.json
# whisper: enabled=true, azure-transcriber: enabled=false に変更

# 3. 動作確認
docker exec watchme-scheduler-prod python /app/run-api-process-docker.py whisper
```

## 📊 移行完了チェックリスト

- [ ] スケジューラーAPIサーバーのデプロイ完了
- [ ] Cron設定の更新完了
- [ ] config.jsonでazure-transcriberが有効化
- [ ] config.jsonでwhisperが無効化
- [ ] 手動実行テスト成功
- [ ] ネットワーク接続確認完了
- [ ] 定時実行での動作確認（次の10分の実行を確認）
- [ ] ログに正常処理が記録されている
- [ ] Supabaseで処理結果が保存されている

## 📝 トラブルシューティング

### エラー: "コンテナ名 'vibe-transcriber-v2' が解決できません"
```bash
docker network connect watchme-network vibe-transcriber-v2
```

### エラー: "Azure APIキーが無効"
```bash
# .envファイルを確認
cat /home/ubuntu/vibe-transcriber-v2/.env | grep AZURE
```

### エラー: "run_if_enabled.py: azure-transcriber not found"
```bash
# config.jsonにazure-transcriberが追加されているか確認
cat /home/ubuntu/scheduler/config.json | jq '.apis["azure-transcriber"]'
```

## 📞 サポート

問題が発生した場合は、以下のログを確認してください:
- スケジューラーログ: `/var/log/scheduler/scheduler-azure-transcriber.log`
- APIログ: `docker logs vibe-transcriber-v2`
- Cronログ: `/var/log/scheduler/cron.log`