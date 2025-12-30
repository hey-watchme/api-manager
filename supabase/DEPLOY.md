# Supabase Edge Function デプロイ手順

## 前提条件

Supabase CLIがインストールされていること：
```bash
brew install supabase/tap/supabase
```

## 1. Supabaseにログイン

```bash
supabase login
```

ブラウザが開き、認証が完了します。

## 2. プロジェクトにリンク

```bash
# Supabase Dashboard でプロジェクトIDを確認
# https://supabase.com/dashboard/project/<your-project-id>

supabase link --project-ref qvtlwotzuzbavrzqhyvt
```

## 3. 環境変数を設定

Supabase Dashboard で設定：
1. https://supabase.com/dashboard/project/qvtlwotzuzbavrzqhyvt/settings/functions
2. "Secrets" タブを開く
3. 以下の環境変数を追加：

```
AWS_REGION=ap-southeast-2
AWS_ACCESS_KEY_ID=<your-aws-access-key-id>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-access-key>
```

**注意**: 読み取り専用のIAMユーザーを使用してください。

### IAMポリシー（推奨）

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sqs:GetQueueAttributes",
        "sqs:ListQueues"
      ],
      "Resource": [
        "arn:aws:sqs:ap-southeast-2:754724220380:watchme-*"
      ]
    }
  ]
}
```

## 4. Edge Functionをデプロイ

```bash
cd /Users/kaya.matsumoto/projects/watchme/api/api-manager

# sqs-status functionをデプロイ
supabase functions deploy sqs-status
```

## 5. デプロイ確認

```bash
# ログを確認
supabase functions logs sqs-status

# 手動テスト
curl -X POST \
  'https://qvtlwotzuzbavrzqhyvt.supabase.co/functions/v1/sqs-status' \
  -H 'Authorization: Bearer <your-anon-key>' \
  -H 'Content-Type: application/json'
```

## 6. フロントエンドをデプロイ

```bash
# 変更をコミット
git add .
git commit -m "feat: Migrate to Supabase Edge Function for SQS monitoring"
git push origin main
```

GitHub Actionsが自動的にデプロイします。

## トラブルシューティング

### Edge Functionが動作しない

1. **環境変数を確認**
   ```bash
   supabase secrets list
   ```

2. **ログを確認**
   ```bash
   supabase functions logs sqs-status --tail
   ```

3. **再デプロイ**
   ```bash
   supabase functions deploy sqs-status --no-verify-jwt
   ```

### CORS エラー

Edge Function内のCORSヘッダーを確認：
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

## ローカルテスト

```bash
# Supabase CLIでローカルサーバー起動
supabase start

# Edge Functionをローカルで起動
supabase functions serve sqs-status --env-file .env.local

# テストリクエスト
curl -X POST 'http://localhost:54321/functions/v1/sqs-status'
```

`.env.local` を作成：
```
AWS_REGION=ap-southeast-2
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
```
