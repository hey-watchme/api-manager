# 📋 スケジューラー修正ガイド - config.json問題の解決

## 🚨 問題の概要

スケジューラーが動作しない根本原因：
1. **config.jsonがサーバー上に作成されない**
   - UIから設定を保存しても `/home/ubuntu/scheduler/config.json` が作成されない
   - そのため、`run_if_enabled.py` が設定を読み込めず、APIが実行されない

## 🔍 原因

### Dockerボリュームマウントの問題
- **問題**: スケジューラーAPIコンテナが、ホストの `/home/ubuntu/scheduler` ディレクトリに書き込めない
- **原因**: docker-compose.prod.yml で Dockerボリューム（`scheduler-config`）を使用していたが、これはホストディレクトリではない

## ✅ 解決方法

### 手順1: スケジューラーAPIコードの修正をデプロイ

```bash
# ローカルで実行
cd /Users/kaya.matsumoto/projects/watchme/api/api-manager

# ECRへデプロイ
./deploy-scheduler.sh
```

### 手順2: EC2サーバーで新しいコンテナを起動

```bash
# EC2サーバーに接続
ssh -i ~/watchme-key.pem ubuntu@3.24.16.82

# 既存コンテナを停止・削除
docker stop watchme-scheduler-prod
docker rm watchme-scheduler-prod

# 修正版のデプロイスクリプトを実行
cd /home/ubuntu/watchme-api-manager
./deploy-scheduler-ec2.sh
```

### 手順3: config.jsonの作成を確認

1. **API Manager UIにアクセス**
   - https://api.hey-watch.me/manager/ を開く

2. **任意のAPIのスケジュール設定を保存**
   - 例：whisperのスケジュールをONにして保存

3. **サーバー上でconfig.jsonを確認**
   ```bash
   # EC2サーバーで実行
   ls -la /home/ubuntu/scheduler/config.json
   cat /home/ubuntu/scheduler/config.json | jq .
   ```

### 手順4: 手動でconfig.jsonを作成（緊急対応）

もし上記でも作成されない場合：

```bash
# EC2サーバーで実行
cat > /home/ubuntu/scheduler/config.json << 'EOF'
{
  "apis": {
    "whisper": {
      "enabled": true,
      "interval": 1,
      "timeout": 600,
      "max_files": 100,
      "updated_at": "2025-08-11T00:00:00"
    },
    "vibe-aggregator": {
      "enabled": true,
      "interval": 1,
      "deviceId": "9f7d6e27-98c3-4c19-bdfb-f7fda58b9a93",
      "updated_at": "2025-08-11T00:00:00"
    },
    "vibe-scorer": {
      "enabled": true,
      "interval": 3,
      "deviceId": "9f7d6e27-98c3-4c19-bdfb-f7fda58b9a93",
      "updated_at": "2025-08-11T00:00:00"
    },
    "behavior-features": {
      "enabled": true,
      "interval": 1,
      "timeout": 600,
      "max_files": 100,
      "updated_at": "2025-08-11T00:00:00"
    },
    "behavior-aggregator": {
      "enabled": true,
      "interval": 1,
      "deviceId": "9f7d6e27-98c3-4c19-bdfb-f7fda58b9a93",
      "updated_at": "2025-08-11T00:00:00"
    },
    "emotion-features": {
      "enabled": true,
      "interval": 1,
      "timeout": 600,
      "max_files": 100,
      "updated_at": "2025-08-11T00:00:00"
    },
    "emotion-aggregator": {
      "enabled": true,
      "interval": 1,
      "deviceId": "9f7d6e27-98c3-4c19-bdfb-f7fda58b9a93",
      "updated_at": "2025-08-11T00:00:00"
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

### 手順5: 動作確認

```bash
# 手動でテスト実行
python3 /home/ubuntu/scheduler/run_if_enabled.py whisper

# 期待される出力：
# whisper: 有効 - 実行開始
# ...

# ログ確認
tail -f /var/log/scheduler/scheduler-whisper.log
```

## 🔧 修正内容の詳細

### 1. scheduler-api-server.py の修正
```python
# 環境変数でCONFIG_FILEパスを設定可能に
CONFIG_FILE = os.environ.get('CONFIG_FILE_PATH', '/home/ubuntu/scheduler/config.json')
```

### 2. deploy-scheduler-ec2.sh の修正
```bash
# ホストディレクトリを直接マウント
docker run -d \
    --name ${CONTAINER_NAME} \
    -e CONFIG_FILE_PATH=/home/ubuntu/scheduler/config.json \
    -v /home/ubuntu/scheduler:/home/ubuntu/scheduler:rw \
    -v /var/log/scheduler:/var/log/scheduler:rw \
    ...
```

## 📊 チェックリスト

- [ ] scheduler-api-server.py が環境変数 `CONFIG_FILE_PATH` を使用するように修正
- [ ] deploy-scheduler-ec2.sh がホストディレクトリを直接マウントするように修正
- [ ] ECRに新しいイメージがプッシュされた
- [ ] EC2サーバーで新しいコンテナが起動している
- [ ] `/home/ubuntu/scheduler` ディレクトリの権限が正しい（ubuntu:ubuntu）
- [ ] API Manager UIから設定を保存できる
- [ ] config.json が作成される
- [ ] run_if_enabled.py が正常に動作する

## 🚨 トラブルシューティング

### config.jsonが作成されない場合

1. **コンテナログを確認**
   ```bash
   docker logs watchme-scheduler-prod --tail 50
   ```

2. **権限を確認**
   ```bash
   ls -la /home/ubuntu/scheduler/
   # ubuntu:ubuntu であることを確認
   ```

3. **APIエンドポイントを確認**
   ```bash
   curl -X GET http://localhost:8015/api/scheduler/status/whisper
   ```

4. **コンテナ内から書き込みテスト**
   ```bash
   docker exec watchme-scheduler-prod touch /home/ubuntu/scheduler/test.txt
   ls -la /home/ubuntu/scheduler/test.txt
   ```

### スケジューラーAPIが応答しない場合

1. **ポート確認**
   ```bash
   sudo lsof -i:8015
   ```

2. **Nginxルーティング確認**
   ```bash
   curl https://api.hey-watch.me/scheduler/status/whisper
   ```