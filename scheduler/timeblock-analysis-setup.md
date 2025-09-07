# タイムブロック単位ChatGPT分析スケジューラー設定手順

## 概要
dashboardテーブルのpendingステータスのレコードを検出し、ChatGPTで分析してcompletedに更新するスケジューラーです。

## 1. サーバー側の設定

### 1.1 スクリプトの転送とコンテナ内更新

```bash
# EC2サーバーにSSH接続
ssh -i ~/watchme-key.pem ubuntu@3.24.16.82

# バックアップ作成
cp /home/ubuntu/scheduler/run-api-process-docker.py \
   /home/ubuntu/scheduler/run-api-process-docker.py.backup.$(date +%Y%m%d_%H%M%S)

# 新しいスクリプトを転送（ローカルから）
# ローカルマシンで実行:
scp -i ~/watchme-key.pem /Users/kaya.matsumoto/projects/watchme/api/api-manager/scheduler/run-api-process-docker.py \
    ubuntu@3.24.16.82:/home/ubuntu/scheduler/

# EC2サーバーで実行:
# Dockerコンテナ内も更新（重要！）
docker cp /home/ubuntu/scheduler/run-api-process-docker.py \
          watchme-scheduler-prod:/app/run-api-process-docker.py
```

### 1.2 cron設定の追加

```bash
# cron設定ファイルを編集
sudo nano /etc/cron.d/watchme-scheduler

# 以下の行を追加（50分に実行）
50 * * * * ubuntu python3 /home/ubuntu/scheduler/run_if_enabled.py timeblock-analysis >> /var/log/scheduler/cron.log 2>&1

# cronサービスを再起動
sudo systemctl restart cron
```

### 1.3 ログファイルの準備

```bash
# ログファイルを作成し、適切な権限を設定
sudo touch /var/log/scheduler/scheduler-timeblock-analysis.log
sudo chown ubuntu:ubuntu /var/log/scheduler/scheduler-timeblock-analysis.log
sudo chmod 664 /var/log/scheduler/scheduler-timeblock-analysis.log
```

### 1.4 config.jsonへの設定追加

```bash
# config.jsonを編集
nano /home/ubuntu/scheduler/config.json

# 以下の設定を追加（または手動で編集）
cat /home/ubuntu/scheduler/config.json | \
jq '.apis["timeblock-analysis"] = {
  "enabled": false,
  "timeout": 60,
  "batchLimit": 50,
  "deviceId": "9f7d6e27-98c3-4c19-bdfb-f7fda58b9a93",
  "processDate": "today"
}' > /tmp/config.json && mv /tmp/config.json /home/ubuntu/scheduler/config.json
```

## 2. 動作テスト

### 2.1 手動テスト（Dockerコンテナから直接）

```bash
# まずDockerコンテナから直接テスト
docker exec watchme-scheduler-prod python /app/run-api-process-docker.py timeblock-analysis

# 成功したらrun_if_enabled.py経由でテスト
python3 /home/ubuntu/scheduler/run_if_enabled.py timeblock-analysis

# ログを確認
tail -f /var/log/scheduler/scheduler-timeblock-analysis.log
```

### 2.2 APIコンテナへの疎通確認

```bash
# watchme-networkへの接続確認
docker network inspect watchme-network | grep api-gpt-v1

# pingテスト
docker exec watchme-scheduler-prod ping -c 1 api-gpt-v1
```

## 3. 本番稼働

```bash
# config.jsonでenabledをtrueに設定
cat /home/ubuntu/scheduler/config.json | \
jq '.apis["timeblock-analysis"].enabled = true' > /tmp/config.json && \
mv /tmp/config.json /home/ubuntu/scheduler/config.json

# 設定確認
cat /home/ubuntu/scheduler/config.json | jq '.apis["timeblock-analysis"]'
```

## 4. 監視とログ確認

```bash
# リアルタイムログ監視
tail -f /var/log/scheduler/scheduler-timeblock-analysis.log

# cronログ確認
tail -100 /var/log/scheduler/cron.log | grep timeblock-analysis

# 処理状況確認（Supabaseで確認）
# dashboardテーブルのstatusカラムを確認
# pending → completed に変わることを確認
```

## 5. トラブルシューティング

### エラー: Permission denied
```bash
# ログファイルの権限を修正
sudo chown ubuntu:ubuntu /var/log/scheduler/scheduler-timeblock-analysis.log
sudo chmod 664 /var/log/scheduler/scheduler-timeblock-analysis.log
```

### エラー: コンテナ名が解決できません
```bash
# api-gpt-v1をwatchme-networkに接続
docker network connect watchme-network api-gpt-v1
```

### エラー: 未対応のAPI
```bash
# コンテナ内のスクリプトが古い可能性
docker cp /home/ubuntu/scheduler/run-api-process-docker.py \
          watchme-scheduler-prod:/app/run-api-process-docker.py
```

## 処理フロー

1. **毎時50分**: cronがrun_if_enabled.pyを実行
2. **有効チェック**: config.jsonでenabledがtrueか確認
3. **データ取得**: dashboardテーブルからstatus='pending'かつprompt IS NOT NULLのレコードを取得（最大50件）
4. **ChatGPT分析**: 各レコードに対してapi-gpt-v1:8002/analyze-timeblockを呼び出し
5. **結果保存**: APIが自動的にanalysis_result, vibe_score, summaryを保存
6. **ステータス更新**: 処理成功時にstatus='completed'、processed_atを更新

## 重要な注意点

- **実行時刻**: 40分のtimeblock-promptの後、50分に実行（データが準備された後）
- **バッチサイズ**: デフォルト50件（config.jsonのbatchLimitで調整可能）
- **タイムアウト**: ChatGPT処理のため60秒に設定
- **リトライ**: 現在の実装では失敗したレコードは次回の実行で再処理される（statusがpendingのまま残るため）