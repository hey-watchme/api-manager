# 移行に関する重要事項

## 旧管理画面からの移行

このドキュメントは、旧管理画面（/Users/kaya.matsumoto/projects/watchme/admin/）からAPI Managerへの移行に関する重要な情報をまとめています。

## ⚠️ 重要な注意事項

### 1. 設計の参考にしてはいけない点
旧管理画面は以下の理由で破棄されました：
- **密結合な設計**: すべての機能が1つのファイルに集約されていた
- **メンテナンス不能**: 修正や機能追加が困難
- **コードの重複**: 同じようなコードが各所に散在

**これらの設計パターンは絶対に真似しないでください。**

### 2. 引き継ぐべき点
- **APIエンドポイント**: すべて正常に動作しており、そのまま使用可能
- **機能仕様**: ユーザーが期待する機能は維持
- **Supabase連携**: データベース構造とアクセスパターン

## APIエンドポイント一覧

### 心理グラフ API
| 機能 | エンドポイント | メソッド |
|------|-------------|---------|
| 音声書き起こし | https://api.hey-watch.me/vibe-transcriber/fetch-and-transcribe | POST |
| プロンプト生成 | https://api.hey-watch.me/vibe-aggregator/generate-mood-prompt-supabase | POST |
| スコアリング | https://api.hey-watch.me/vibe-scorer/analyze-vibegraph-supabase | POST |

### 行動グラフ API  
| 機能 | エンドポイント | メソッド |
|------|-------------|---------|
| SED音響検出 | https://api.hey-watch.me/behavior-features/fetch-and-process-paths | POST |
| SED分析 | https://api.hey-watch.me/behavior-aggregator/analysis/sed | POST |

### 感情グラフ API
| 機能 | エンドポイント | メソッド |
|------|-------------|---------|
| OpenSMILE特徴抽出 | https://api.hey-watch.me/emotion-features/process/emotion-features | POST |
| OpenSMILE分析 | https://api.hey-watch.me/emotion-aggregator/analyze/opensmile-aggregator | POST |

## Supabaseテーブル構造

### audio_filesテーブル
主要なステータスフィールド：
- `transcriptions_status`: Whisper処理状態（pending/completed）
- `behavior_features_status`: SED処理状態
- `emotion_features_status`: OpenSMILE処理状態

### 重要なクエリパターン
```sql
-- pendingステータスのファイルを取得
SELECT * FROM audio_files 
WHERE transcriptions_status = 'pending' 
AND created_at >= NOW() - INTERVAL '24 hours';
```

## スケジューラー仕様

### 共通仕様
- **実行間隔**: 3時間毎（0,3,6,9,12,15,18,21時）
- **処理範囲**: 過去24時間分（48スロット）
- **対象**: pendingステータスのレコード

### エンドポイントパターン
各スケジューラーは以下の4つのエンドポイントを持つ：
```
/api/{api_name}-trial-scheduler/start
/api/{api_name}-trial-scheduler/stop
/api/{api_name}-trial-scheduler/status
/api/{api_name}-trial-scheduler/run-now
```

## 開発環境と本番環境

### 環境設定
| 項目 | 開発環境 | 本番環境 |
|------|---------|---------|
| URL | http://localhost:9001 | https://api.hey-watch.me/manager |
| API参照先 | https://api.hey-watch.me | https://api.hey-watch.me |
| ポート | 9001 | 443 (HTTPS) |

### 重要：API参照について
**開発環境でも本番APIを参照します。** これは：
- マイクロサービスは独立したシステム
- 開発用のローカルAPIは存在しない
- すべての操作が本番データに影響する

⚠️ **開発時は十分注意して操作してください**

## 移行チェックリスト

### 機能の移行確認
- [ ] Whisper音声書き起こし（手動実行）
- [ ] Whisper自動スケジューラー
- [ ] プロンプト生成（手動実行）
- [ ] プロンプト生成自動スケジューラー
- [ ] ChatGPTスコアリング
- [ ] SED音響イベント検出
- [ ] SED自動スケジューラー
- [ ] SED Aggregator
- [ ] OpenSMILE特徴抽出
- [ ] OpenSMILE自動スケジューラー
- [ ] OpenSMILE Aggregator

### UI/UXの確認
- [ ] APIステータスのリアルタイム表示
- [ ] ファイルパス入力（複数行対応）
- [ ] 実行結果の表示
- [ ] エラーハンドリング
- [ ] ローディング表示

### データ整合性
- [ ] Supabaseとの接続確認
- [ ] ステータス更新の確認
- [ ] 実行履歴の記録

## トラブルシューティング

### よくある問題

1. **CORSエラー**
   - 原因：プロキシ設定の不備
   - 対策：Expressサーバーでのプロキシ設定確認

2. **タイムアウトエラー**
   - 原因：大量ファイル処理
   - 対策：タイムアウト値の調整（60秒推奨）

3. **ステータス更新エラー**
   - 原因：Supabase権限不足
   - 対策：環境変数のSUPABASE_KEY確認

## 参考資料

- 旧管理画面README: `/Users/kaya.matsumoto/projects/watchme/admin/README.md`
- MODULE_ARCHITECTURE: `/Users/kaya.matsumoto/projects/watchme/admin/MODULE_ARCHITECTURE.md`
- 環境変数設定: `/Users/kaya.matsumoto/projects/watchme/admin/.env`

## 連絡先

技術的な質問がある場合は、プロジェクトのGitHub Issuesで報告してください：
https://github.com/matsumotokaya/watchme-api-manager/issues