# API Manager CI/CD セットアップガイド

## 📋 概要

このドキュメントでは、API ManagerのGitHub ActionsによるCI/CD設定方法を説明します。

## 🏗️ アーキテクチャ

- **リポジトリ**: `hey-watchme/api-manager` (GitHub Organization)
- **コンテナ**: 2つ（Frontend + Backend/Scheduler）
- **ECRリポジトリ**: 2つ
  - `watchme-api-manager` (Frontend)
  - `watchme-api-manager-scheduler` (Backend)
- **デプロイ先**: EC2 (3.24.16.82)

## 🔐 GitHub Secretsの設定

GitHubリポジトリの Settings → Secrets and variables → Actions から以下のシークレットを設定：

### 必須シークレット

| Secret名 | 説明 | 値の例 |
|----------|------|--------|
| `AWS_ACCESS_KEY_ID` | AWS IAMユーザーのアクセスキー | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS IAMユーザーのシークレットキー | `wJal...` |
| `EC2_HOST` | EC2インスタンスのIPアドレス | `3.24.16.82` |
| `EC2_USER` | EC2のユーザー名 | `ubuntu` |
| `EC2_SSH_KEY` | EC2接続用のプライベートキー | `-----BEGIN RSA PRIVATE KEY-----...` |

### シークレットの設定方法

1. GitHubリポジトリページを開く
2. Settings → Secrets and variables → Actions
3. "New repository secret" をクリック
4. Name と Secret value を入力して保存

### EC2_SSH_KEYの設定

```bash
# ローカルでプライベートキーの内容をコピー
cat ~/watchme-key.pem | pbcopy  # macOS
# または
cat ~/watchme-key.pem  # 表示して手動コピー
```

⚠️ **重要**: 
- プライベートキーは改行を含めて完全にコピーしてください
- 最初の `-----BEGIN RSA PRIVATE KEY-----` から最後の `-----END RSA PRIVATE KEY-----` まですべて含める
- 余分な空白や改行を追加しない

## 🚀 ワークフローの動作

### Frontend デプロイ（`.github/workflows/deploy-frontend.yml`）

**トリガー条件**:
- `main`ブランチへのプッシュ
- 以下のファイルが変更された場合：
  - `src/**` - Reactソースコード
  - `public/**` - 静的ファイル
  - `package.json` - 依存関係
  - `Dockerfile` - コンテナ定義
  - その他の設定ファイル

**処理フロー**:
1. Dockerイメージをビルド
2. ECRにプッシュ
3. EC2でコンテナを更新

### Backend/Scheduler デプロイ（`.github/workflows/deploy-backend.yml`）

**トリガー条件**:
- `main`ブランチへのプッシュ
- 以下のファイルが変更された場合：
  - `scheduler/**` - Pythonコード
  - `requirements.txt` - Python依存関係

**処理フロー**:
1. Dockerイメージをビルド
2. ECRにプッシュ
3. EC2でコンテナを更新
4. 関連コンテナのネットワーク接続を確認

## 🔧 IAM権限設定

CI/CD用のIAMユーザーに必要な権限：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": [
        "arn:aws:ecr:ap-southeast-2:754724220380:repository/watchme-api-manager",
        "arn:aws:ecr:ap-southeast-2:754724220380:repository/watchme-api-manager-scheduler"
      ]
    },
    {
      "Effect": "Allow",
      "Action": "ecr:GetAuthorizationToken",
      "Resource": "*"
    }
  ]
}
```

## 🐳 EC2の事前準備

EC2インスタンスで以下を確認：

### 1. Dockerネットワークの作成

```bash
docker network create watchme-network 2>/dev/null || true
```

### 2. 環境変数ファイルの配置

```bash
# /home/ubuntu/watchme-api-manager/.env
SUPABASE_URL=https://qvtlwotzuzbavrzqhyvt.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SCHEDULER_ENABLED=true
```

### 3. AWS CLIの設定

```bash
aws configure
# Region: ap-southeast-2
```

## ✅ 動作確認

### デプロイの確認

```bash
# EC2にSSH接続
ssh -i ~/watchme-key.pem ubuntu@3.24.16.82

# コンテナの状態確認
docker ps | grep -E "(api-manager-frontend|watchme-scheduler-prod)"

# ログ確認
docker logs api-manager-frontend
docker logs watchme-scheduler-prod

# ヘルスチェック
curl http://localhost:9001/health  # Frontend
curl http://localhost:8015/health  # Backend
```

### GitHub Actionsの確認

1. GitHubリポジトリの "Actions" タブを開く
2. ワークフローの実行状況を確認
3. エラーがある場合はログを確認

## 🔄 手動デプロイ

CI/CDが動作しない場合の手動デプロイ：

```bash
# Frontend
./deploy-frontend.sh
ssh -i ~/watchme-key.pem ubuntu@3.24.16.82
docker pull 754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-api-manager:latest
docker restart api-manager-frontend

# Backend
./deploy-scheduler.sh
ssh -i ~/watchme-key.pem ubuntu@3.24.16.82
docker pull 754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-api-manager-scheduler:latest
docker restart watchme-scheduler-prod
```

## 🚨 トラブルシューティング

### よくある問題と解決方法

| 問題 | 原因 | 解決方法 |
|------|------|----------|
| ECR認証エラー | IAM権限不足 | IAMポリシーを確認 |
| SSH接続エラー | SSH鍵の設定ミス | EC2_SSH_KEY secretを再設定 |
| コンテナ起動失敗 | 環境変数不足 | EC2の.envファイルを確認 |
| ネットワークエラー | Dockerネットワーク未設定 | `docker network create watchme-network` |

### デバッグコマンド

```bash
# GitHub Actionsのログ確認
# GitHubのActionsタブから該当のワークフローを選択

# EC2でのデバッグ
docker logs --tail 50 api-manager-frontend
docker logs --tail 50 watchme-scheduler-prod
docker network inspect watchme-network
```

## 📝 メンテナンス

### ECRイメージのクリーンアップ

```bash
# 古いイメージの確認
aws ecr list-images --repository-name watchme-api-manager --region ap-southeast-2

# 不要なイメージの削除（30日以上前のイメージ）
aws ecr put-lifecycle-policy --repository-name watchme-api-manager --region ap-southeast-2 --lifecycle-policy-text '{
  "rules": [{
    "rulePriority": 1,
    "selection": {
      "tagStatus": "any",
      "countType": "sinceImagePushed",
      "countUnit": "days",
      "countNumber": 30
    },
    "action": {
      "type": "expire"
    }
  }]
}'
```

---

*最終更新: 2025年9月23日*