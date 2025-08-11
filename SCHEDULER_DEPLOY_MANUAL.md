# 📚 スケジューラーcron設定 デプロイマニュアル

## 🚨 現在の問題

スケジューラーが動作していない原因：
- `scheduler-api-server.py` の修正は完了済み
- しかし、新しいスケジュール方式に必要な2つのファイルがサーバーに設置されていない
- このため、現在スケジュールが完全に停止している

## 🛠️ 復旧作業手順

### ステップ1: 必要なファイルをサーバーにコピー

ローカルの `api-manager` プロジェクト内にある、以下の2つのファイルをサーバーの `/home/ubuntu/scheduler/` ディレクトリにコピーしてください。

1. `api-manager/scheduler/run_if_enabled.py`
2. `api-manager/scheduler/watchme-scheduler-cron`

#### 方法A: 自動デプロイスクリプトを使用（推奨）

```bash
# api-managerディレクトリで実行
chmod +x deploy-scheduler-cron.sh
./deploy-scheduler-cron.sh
```

#### 方法B: 手動でコピー

```bash
# ローカルPCから実行
# run_if_enabled.py をコピー
scp -i ~/watchme-key.pem \
    scheduler/run_if_enabled.py \
    ubuntu@3.24.16.82:/home/ubuntu/scheduler/

# watchme-scheduler-cron をコピー
scp -i ~/watchme-key.pem \
    scheduler/watchme-scheduler-cron \
    ubuntu@3.24.16.82:/home/ubuntu/scheduler/
```

### ステップ2: 実行権限を付与

サーバーにSSHで接続し、`run_if_enabled.py` に実行権限を与えます。

```bash
# サーバーに接続
ssh -i ~/watchme-key.pem ubuntu@3.24.16.82

# 実行権限を付与
chmod +x /home/ubuntu/scheduler/run_if_enabled.py
```

### ステップ3: cron設定ファイルを所定の場所に設置

サーバー上で、コピーしたcron設定ファイルをシステムの正しい場所に設置し、適切な権限を設定します。

```bash
# cronファイルを /etc/cron.d/ にコピー
sudo cp /home/ubuntu/scheduler/watchme-scheduler-cron /etc/cron.d/watchme-scheduler

# 適切な権限を設定（重要！）
sudo chmod 644 /etc/cron.d/watchme-scheduler

# ログディレクトリの作成と権限設定
sudo mkdir -p /var/log/scheduler
sudo chown ubuntu:ubuntu /var/log/scheduler

# cronサービスをリロード（通常は自動で読み込まれるが念のため）
sudo systemctl reload cron
```

### ステップ4: 動作確認

#### 4.1 手動テスト実行

まず、手動でスクリプトが動作することを確認します：

```bash
# サーバー上で実行
python3 /home/ubuntu/scheduler/run_if_enabled.py whisper
```

期待される出力：
- config.json が存在しない場合：`警告: 設定ファイルが存在しません`
- APIが無効の場合：`whisper: 無効 - スキップ`
- APIが有効の場合：`whisper: 有効 - 実行開始`

#### 4.2 API ManagerのUIから設定

1. https://api.hey-watch.me/manager/ にアクセス
2. テストしたいAPI（例: whisper）のスケジュールをONに設定
3. 設定を保存（これにより `/home/ubuntu/scheduler/config.json` が作成/更新される）

#### 4.3 ログファイルの監視

次の実行時刻まで待ち、ログファイルに新しいログが出力されることを確認：

```bash
# whisperのログを確認（毎時10分に実行）
tail -f /var/log/scheduler/scheduler-whisper.log

# cron全体のログを確認
tail -f /var/log/scheduler/cron.log
```

## 📅 実行スケジュール

| API名 | 実行時刻 | 頻度 | 処理タイプ |
|-------|---------|------|-----------|
| **whisper** | 毎時10分 | 毎時間 | ファイルベース |
| **behavior-features** | 毎時10分 | 毎時間 | ファイルベース |
| **vibe-aggregator** | 毎時20分 | 毎時間 | デバイスベース |
| **behavior-aggregator** | 毎時20分 | 毎時間 | デバイスベース |
| **emotion-features** | 毎時20分 | 毎時間 | ファイルベース |
| **emotion-aggregator** | 毎時30分 | 毎時間 | デバイスベース |
| **vibe-scorer** | 30分 | 3時間ごと※ | デバイスベース |

※ vibe-scorer: 0:30, 3:30, 6:30, 9:30, 12:30, 15:30, 18:30, 21:30

## ✅ チェックリスト

デプロイ後、以下を確認してください：

- [ ] `/home/ubuntu/scheduler/run_if_enabled.py` が存在し、実行可能
- [ ] `/etc/cron.d/watchme-scheduler` が存在し、権限が 644
- [ ] `/var/log/scheduler/` ディレクトリが存在し、ubuntu ユーザーが書き込み可能
- [ ] API Manager UIから設定を保存し、`/home/ubuntu/scheduler/config.json` が作成された
- [ ] 手動テスト実行が成功した
- [ ] cronによる自動実行が動作している（ログで確認）

## 🚨 トラブルシューティング

### config.json が作成されない

API Manager UIから設定を保存しても config.json が作成されない場合：

```bash
# 手動で基本的な config.json を作成
cat > /home/ubuntu/scheduler/config.json << 'EOF'
{
  "apis": {
    "whisper": {
      "enabled": true,
      "interval": 1,
      "timeout": 600,
      "max_files": 100
    }
  },
  "global": {
    "enabled": true,
    "timezone": "Asia/Tokyo"
  }
}
EOF

# 権限設定
chmod 644 /home/ubuntu/scheduler/config.json
```

### cronが実行されない

```bash
# cron設定が読み込まれているか確認
grep watchme /var/log/syslog

# cron設定の構文チェック
cat /etc/cron.d/watchme-scheduler

# cronサービスの状態確認
sudo systemctl status cron
```

### 実行エラーが発生する

```bash
# Dockerコンテナが起動しているか確認
docker ps | grep watchme-scheduler-prod

# コンテナのログを確認
docker logs watchme-scheduler-prod --tail 50
```

## 📝 メモ

- このスケジューラーは「2層アーキテクチャ」を採用
  - UI層: ON/OFF設定のみ管理（config.json）
  - cron層: 固定スケジュールで実行（/etc/cron.d/）
- 実行時刻の変更は cron ファイルの編集が必要（UIからは変更不可）
- セキュリティのため、Docker コンテナから cron ファイルへの書き込みは許可しない