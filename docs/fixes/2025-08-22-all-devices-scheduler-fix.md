# 2025年8月22日: スケジューラー全デバイス処理修正

## 問題の概要

デバイスベースの4つのAPI（behavior-aggregator、emotion-aggregator、vibe-aggregator、vibe-scorer）のスケジュール処理が、全デバイスではなく1デバイスのみ処理していた。

## 原因

環境変数名の不一致：
- フロントエンド（React/Vite）: `VITE_SUPABASE_URL`、`VITE_SUPABASE_KEY`を使用
- バックエンド（Python/スケジューラー）: `SUPABASE_URL`、`SUPABASE_KEY`を期待

この不一致により、Dockerコンテナ内でSupabase接続に失敗し、フォールバックとして1デバイスのみ処理していた。

## 修正内容

### 1. Pythonコードの修正

全てのPythonファイルで、VITE_プレフィックス付きの環境変数も読めるように修正：

```python
# 修正前
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

# 修正後
SUPABASE_URL = os.getenv('SUPABASE_URL') or os.getenv('VITE_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY') or os.getenv('VITE_SUPABASE_KEY')
```

修正したファイル：
- `scheduler/run-api-process-docker.py`
- `scheduler/run-api-process.py`
- `run-api-process.py`

### 2. Docker Composeの修正

環境変数マッピングを修正：

```yaml
# 修正前
environment:
  - SUPABASE_URL=${SUPABASE_URL}
  - SUPABASE_KEY=${SUPABASE_KEY}

# 修正後
environment:
  - SUPABASE_URL=${VITE_SUPABASE_URL}
  - SUPABASE_KEY=${VITE_SUPABASE_KEY}
```

修正したファイル：
- `scheduler/docker-compose.prod.yml`
- `docker-compose.all.yml`

### 3. .envファイルのクリーンアップ

重複した環境変数を削除し、VITE_プレフィックス付きのみを使用：

```bash
# 削除
SUPABASE_URL=...
SUPABASE_KEY=...

# 残す
VITE_SUPABASE_URL=...
VITE_SUPABASE_KEY=...
```

## 動作確認結果

2025年8月21日のデータで**3個のデバイス**が正常に処理されることを確認：

```
=== 全デバイス処理完了 ===
成功: 3/3 デバイス
- 9f7d6e27-98c3-4c19-bdfb-f7fda58b9a93 ✅
- d067d407-cf73-4174-a9c1-d91fb60d64d0 ✅
- f78b1c84-e6db-45b8-acb6-821609490303 ✅
```

## 影響範囲

この修正により、以下の4つのデバイスベースAPIが全て正常に動作：
1. **behavior-aggregator**: 行動データ集計
2. **emotion-aggregator**: 感情データ集計
3. **vibe-aggregator**: 心理プロンプト生成
4. **vibe-scorer**: 心理スコアリング

## 今後の改善点

- 環境変数の命名規則を統一
- エラー時のフォールバック処理を改善（1デバイスではなくエラーを返す）
- テスト環境での動作確認プロセスの確立