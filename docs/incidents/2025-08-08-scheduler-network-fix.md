# インシデントレポート: スケジューラーのコンテナ間通信エラー

**日付**: 2025年8月8日  
**影響範囲**: スケジューラー自動処理機能  
**重要度**: 高  
**解決状況**: 解決済み

## 概要

スケジューラーの自動処理機能が動作しない問題が発生。調査の結果、Dockerコンテナ間の通信設定に問題があることが判明し、修正を実施した。

## 問題の詳細

### 症状
- スケジューラーのcronジョブは正常に実行されている
- Supabaseから未処理ファイルの取得は成功
- Whisper APIへの処理依頼時にエラーが発生

### エラー内容
```
ERROR - whisper: API呼び出しエラー: HTTPConnectionPool(host='host.docker.internal', port=8001): 
Max retries exceeded with url: /fetch-and-transcribe 
(Caused by NameResolutionError("Failed to resolve 'host.docker.internal'"))
```

### 根本原因
- `run-api-process-docker.py`でWhisper APIのエンドポイントが`host.docker.internal`を使用していた
- Linux環境のDockerでは`host.docker.internal`がデフォルトで使用できない
- スケジューラーコンテナとWhisper APIコンテナが同じDockerネットワークに接続されていなかった

## 解決策

### 1. エンドポイントの修正
`scheduler/run-api-process-docker.py`:
```python
# 修正前
"endpoint": "http://host.docker.internal:8001/fetch-and-transcribe"

# 修正後
"endpoint": "http://api-transcriber:8001/fetch-and-transcribe"
```

### 2. ネットワーク接続の確保
```bash
# api-transcriberをwatchme-networkに接続
docker network connect watchme-network api-transcriber
```

### 3. 次回実行時刻の計算修正
`scheduler-api-server.py`の`calculate_next_run`関数を修正し、0時起点でN時間ごとの正確な実行時刻を計算するように変更。

### 4. UIの改善
- 実行間隔の表示を「0時起点で3時間ごと（JST）」に変更
- 成功/エラー回数の説明を追加
- エンドポイントの404エラーを修正（SchedulerApiClientを使用）

## 実施した対応

1. **コードの修正**
   - `run-api-process-docker.py`: エンドポイントを`api-transcriber`に変更
   - `scheduler-api-server.py`: 次回実行時刻の計算ロジックを修正
   - `AutoProcessControl.jsx`: UIの表示改善と404エラーの修正

2. **デプロイ**
   - ECRに最新イメージをプッシュ
   - EC2でスケジューラーコンテナを再起動
   - api-transcriberをwatchme-networkに接続

3. **動作確認**
   - ネットワーク接続の確認（ping成功）
   - 手動実行テスト（15件の処理開始を確認）

## 教訓と今後の対策

### 教訓
1. **環境差異の考慮**: 開発環境（Mac/Windows）と本番環境（Linux）でDockerの動作が異なることを認識する
2. **ネットワーク設計**: コンテナ間通信は共通のDockerネットワークを使用し、コンテナ名で通信する
3. **ドキュメント化**: トラブルシューティング情報を適切にドキュメント化する

### 今後の対策
1. **標準化**: 新しいコンテナは必ず`watchme-network`に接続する運用ルールを徹底
2. **テスト**: デプロイ前にコンテナ間通信のテストを実施
3. **監視**: スケジューラーの実行結果を定期的に確認

## 関連ドキュメント

- [SCHEDULER-NETWORK-FIX.md](../../SCHEDULER-NETWORK-FIX.md) - 詳細な修正手順
- [watchme-server-configs/server_overview.md](https://github.com/matsumotokaya/watchme-server-configs/blob/main/server_overview.md) - サーバー全体の構成

## タイムライン

- **15:00 JST**: 問題の報告と調査開始
- **15:20 JST**: 根本原因の特定（`host.docker.internal`の名前解決エラー）
- **15:30 JST**: コード修正とECRへのデプロイ
- **15:45 JST**: EC2での再デプロイとネットワーク接続
- **15:50 JST**: 動作確認完了

## 補足

### Whisper API処理のタイムアウトについて
- 音声処理には数分から数十分かかることがある
- タイムアウトエラーが表示されても、実際の処理は継続されている可能性が高い
- ログファイルやデータベースで処理結果を確認することが重要
EOF < /dev/null