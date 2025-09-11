# Dashboard Summary スケジューラー追加手順

## 📋 概要
`generate-dashboard-summary`エンドポイントを毎時50分に実行するスケジューラーを追加します。

## ✅ 完了済み作業
1. `run-api-process-docker.py`に`dashboard-summary`設定を追加済み
   - エンドポイント: `http://api_gen_prompt_mood_chart:8009/generate-dashboard-summary`
   - タイプ: `device_based`（vibe-aggregatorと同じ）
   - メソッド: GET

## 🚀 EC2サーバーでの作業手順

### 1. SSHでEC2サーバーに接続
```bash
ssh -i ~/watchme-key.pem ubuntu@3.24.16.82
```

### 2. run-api-process-docker.pyを更新
```bash
# バックアップを作成
cd /home/ubuntu/scheduler
cp run-api-process-docker.py run-api-process-docker.py.backup.$(date +%Y%m%d_%H%M%S)

# ローカルからファイルを転送（またはGitHubから取得）
# ローカルから転送する場合:
# scp -i ~/watchme-key.pem /path/to/local/run-api-process-docker.py ubuntu@3.24.16.82:/home/ubuntu/scheduler/

# 確認
grep "dashboard-summary" run-api-process-docker.py
```

### 3. Dockerコンテナ内のスクリプトも更新（重要！）
```bash
docker cp /home/ubuntu/scheduler/run-api-process-docker.py watchme-scheduler-prod:/app/run-api-process-docker.py
```

### 4. cron設定を追加
```bash
# cron設定ファイルを編集
sudo nano /etc/cron.d/watchme-scheduler

# 以下の行を追加（50分実行）:
50 * * * * ubuntu python3 /home/ubuntu/scheduler/run_if_enabled.py dashboard-summary >> /var/log/scheduler/cron.log 2>&1

# cronサービスを再起動
sudo systemctl restart cron
```

### 5. config.jsonに設定を追加
```bash
# config.jsonを編集
nano /home/ubuntu/scheduler/config.json

# "apis"セクションに以下を追加:
"dashboard-summary": {
  "enabled": false,
  "timeout": 120,
  "processDate": "today"
}

# またはjqコマンドで追加:
cat /home/ubuntu/scheduler/config.json | \
jq '.apis["dashboard-summary"] = {"enabled": false, "timeout": 120, "processDate": "today"}' \
> /tmp/config.json && mv /tmp/config.json /home/ubuntu/scheduler/config.json
```

### 6. ログファイルの作成と権限設定
```bash
# ログファイルを作成
sudo touch /var/log/scheduler/scheduler-dashboard-summary.log

# 権限を設定
sudo chown ubuntu:ubuntu /var/log/scheduler/scheduler-dashboard-summary.log
sudo chmod 664 /var/log/scheduler/scheduler-dashboard-summary.log
```

### 7. 手動テスト
```bash
# まずDockerコンテナから直接テスト
docker exec watchme-scheduler-prod python /app/run-api-process-docker.py dashboard-summary

# 成功したらrun_if_enabled.py経由でテスト
python3 /home/ubuntu/scheduler/run_if_enabled.py dashboard-summary
```

### 8. 本番稼働
```bash
# config.jsonでenabledをtrueに設定
cat /home/ubuntu/scheduler/config.json | \
jq '.apis["dashboard-summary"].enabled = true' > /tmp/config.json && \
mv /tmp/config.json /home/ubuntu/scheduler/config.json

# 設定を確認
cat /home/ubuntu/scheduler/config.json | jq '.apis["dashboard-summary"]'
```

## 📊 動作確認

### ログの確認
```bash
# スケジューラーログを確認
tail -f /var/log/scheduler/scheduler-dashboard-summary.log

# cron実行ログを確認
tail -f /var/log/scheduler/cron.log | grep dashboard-summary
```

### 次回実行予定時刻
- 設定完了後、毎時50分に自動実行されます
- 例: 14:50, 15:50, 16:50...

## 🔍 トラブルシューティング

### API接続エラーの場合
```bash
# watchme-networkへの接続を確認
docker network inspect watchme-network | grep api_gen_prompt_mood_chart

# 必要に応じて接続
docker network connect watchme-network api_gen_prompt_mood_chart
```

### ログファイル権限エラーの場合
```bash
# 権限を再設定
sudo chown ubuntu:ubuntu /var/log/scheduler/scheduler-dashboard-summary.log
sudo chmod 664 /var/log/scheduler/scheduler-dashboard-summary.log
```

## 📝 更新後のスケジュール一覧

| 実行時刻 | API名 | 機能 |
|---------|-------|------|
| 毎時10分 | azure-transcriber | Azure音声書き起こし |
| 毎時10分 | behavior-features | 行動特徴抽出 |
| 毎時20分 | vibe-aggregator | 心理プロンプト生成 |
| 毎時20分 | behavior-aggregator | 行動データ集計 |
| 毎時20分 | emotion-features | 感情特徴抽出 |
| 毎時30分 | emotion-aggregator | 感情データ集計 |
| 毎時40分 | timeblock-prompt | タイムブロック単位プロンプト生成 |
| **毎時50分** | timeblock-analysis | タイムブロック単位ChatGPT分析 |
| **毎時50分** | **dashboard-summary** | **ダッシュボードサマリー生成（新規）** |
| 3時間ごと30分 | vibe-scorer | 心理スコアリング |

## ✅ チェックリスト

- [ ] run-api-process-docker.pyを更新
- [ ] Dockerコンテナ内のスクリプトを更新
- [ ] cron設定を追加
- [ ] cronサービスを再起動
- [ ] config.jsonに設定を追加
- [ ] ログファイルを作成・権限設定
- [ ] 手動テスト実行
- [ ] config.jsonでenabledをtrueに設定
- [ ] 動作確認（ログチェック）