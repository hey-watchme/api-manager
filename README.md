# API Manager - WatchMe プラットフォーム

## 概要

API Managerは、WatchMeプラットフォームの複数のマイクロサービスAPIを統合管理するためのWebアプリケーションです。各APIの手動実行、スケジュール実行、パラメータ管理などを一元的に行うことができます。

**本番URL**: https://api.hey-watch.me/manager  
**開発環境**: http://localhost:9001  
**APIプロキシ**: http://localhost:3001  
**GitHubリポジトリ**: https://github.com/matsumotokaya/watchme-api-manager

## 主な機能

- **API手動実行**: 各APIに対してパラメータを指定して即座に実行
- **スケジュール管理**: 日付・時間を指定した自動実行スケジュールの設定
- **実行履歴管理**: APIの実行結果と履歴の確認
- **ステータス監視**: 各APIサービスの稼働状況をリアルタイムで確認

## 管理対象API

### 1. 心理グラフ(Vibe)API（3つ）
- **音声書き起こしAPI (Vibe Transcriber)**: 音声データをテキストに変換
  - エンドポイント: `https://api.hey-watch.me/vibe-transcriber/fetch-and-transcribe`
- **プロンプト生成API (Vibe Aggregator)**: 心理分析用のプロンプトを生成
  - エンドポイント: `https://api.hey-watch.me/vibe-aggregator/generate-mood-prompt-supabase`
- **スコアリングAPI (Vibe Scorer)**: 心理状態のスコアを算出
  - エンドポイント: `https://api.hey-watch.me/vibe-scorer/analyze-vibegraph-supabase`

### 2. 行動グラフAPI（2つ）
- **行動特徴抽出API (SED音響イベント検出)**: 音響イベントから行動パターンを検出
  - エンドポイント: `https://api.hey-watch.me/behavior-features/fetch-and-process-paths`
- **行動分析API (SED Aggregator)**: 抽出された特徴を分析し行動パターンを評価
  - エンドポイント: `https://api.hey-watch.me/behavior-aggregator/analysis/sed`

### 3. 感情グラフAPI（2つ）
- **感情特徴抽出API (OpenSMILE)**: 音声から感情特徴を抽出
  - エンドポイント: `https://api.hey-watch.me/emotion-features/process/emotion-features`
- **感情分析API (OpenSMILE Aggregator)**: 感情の時系列変化を分析
  - エンドポイント: `https://api.hey-watch.me/emotion-aggregator/analyze/opensmile-aggregator`

## アーキテクチャ

### 設計原則
- **モジュール分離**: 1つのAPIに対して1つの独立したモジュール
- **疎結合**: 各モジュール間の依存関係を最小限に
- **再利用性**: 共通コンポーネントの活用
- **拡張性**: 新しいAPIの追加が容易

### ディレクトリ構造

```
api-manager/
├── src/
│   ├── components/          # 共通UIコンポーネント
│   │   ├── common/         # 汎用コンポーネント
│   │   ├── api/            # API実行用コンポーネント
│   │   └── scheduler/      # スケジューラーコンポーネント
│   ├── modules/            # APIモジュール
│   │   ├── psychology/     # 心理グラフAPI
│   │   ├── behavior/       # 行動グラフAPI
│   │   └── emotion/        # 感情グラフAPI
│   ├── pages/              # ページコンポーネント
│   ├── services/           # APIクライアント
│   └── utils/              # ユーティリティ
├── server.js               # Expressサーバー
└── package.json
```

## 技術スタック

### フロントエンド
- React 18.3.1
- React Router DOM 7.7.0（ルーティング）
- Vite 5.1.6
- Tailwind CSS 3.4.1
- Chart.js 4.4.9（結果可視化）
- Lucide React（アイコン）

### バックエンド
- Express.js 4.21.2（ポート: 3001）
- http-proxy-middleware 3.0.3（動的プロキシ設定）
- CORS対応
- 強化されたログ機能

## クイックスタート

### 簡単な起動方法

```bash
# 起動（初回は自動的に依存関係もインストールされます）
./start.sh

# 停止
./stop.sh
```

起動後、以下のURLでアクセスできます：
- **フロントエンド**: http://localhost:9001
- **APIプロキシ**: http://localhost:3001

### ページアクセス（React Router対応）
- **Vibe（心理グラフ）**: http://localhost:9001/vibe
- **行動グラフ**: http://localhost:9001/behavior ✅**稼働中**
- **感情グラフ**: http://localhost:9001/emotion（準備中）

## 現在の動作状況

### 動作確認済み機能
- ✅ API Manager正常起動
- ✅ React Router DOM対応（URLベースナビゲーション）
- ✅ 動的プロキシ設定（7つのAPIサービス対応）
- ✅ 強化されたエラーハンドリングとログ機能
- ✅ Vibe Transcriber（音声文字起こし）完全動作
  - 処理時間: 35秒～10分（音声により変動）
  - タイムアウト: 10分に設定済み
- ✅ **Behavior Features（行動特徴抽出API）完全動作** 🆕
  - YamNetモデルによる音響イベント検出
  - 処理時間: 2～10秒（高速処理）
  - 本番環境EC2デプロイ済み・稼働確認済み
  - 直接HTTPS接続対応（CORS解決済み）
- ✅ 設定ファイル自動修正機能（start.sh）
- ✅ 成功・失敗メッセージの適切な表示

### 実装済みAPI
- **音声書き起こしAPI (Vibe Transcriber)**: 完全動作
- **行動特徴抽出API (SED音響イベント検出)**: 完全動作 🆕
  - 処理時間: 2～10秒（音声ファイルにより変動）
  - YamNetモデルによる521種類の音響イベント検出
  - 本番環境で稼働確認済み
- **プロンプト生成API (Vibe Aggregator)**: 設定済み（未テスト）  
- **スコアリングAPI (Vibe Scorer)**: 設定済み（未テスト）
- **行動分析API**: 設定済み（未テスト）
- **感情特徴抽出API**: 設定済み（未テスト）
- **感情分析API**: 設定済み（未テスト）

## セットアップ

### 前提条件
- Node.js 18以上
- npm または yarn

### 詳細なインストール手順

```bash
# リポジトリのクローン
git clone git@github.com:matsumotokaya/watchme-api-manager.git
cd watchme-api-manager

# 依存関係のインストール
npm install

# 環境変数の設定（必要に応じて編集）
# .envファイルを作成し、必要な環境変数を設定

# 開発サーバーの起動
npm run dev

# 本番ビルド
npm run build

# 本番サーバーの起動
npm start
```

### 環境変数

`.env`ファイルを作成し、以下の変数を設定：

```env
# Supabase設定
VITE_SUPABASE_URL=https://qvtlwotzuzbavrzqhyvt.supabase.co
VITE_SUPABASE_KEY=your_supabase_anon_key

# API エンドポイント（本番環境）
VITE_API_BASE_URL=https://api.hey-watch.me

# 開発環境設定
VITE_PORT=9001

# その他の設定
VITE_API_TIMEOUT=30000
```

## 使用方法

### 1. APIの手動実行
1. 左側のナビゲーションから実行したいAPIカテゴリを選択
2. APIモジュールを選択
3. 必要なパラメータを入力
4. 「実行」ボタンをクリック

### 2. スケジュール設定
1. APIモジュールの「スケジュール」タブを選択
2. 実行日時とパラメータを設定
3. 「スケジュール登録」をクリック

### 3. 実行履歴の確認
1. 「履歴」タブから過去の実行結果を確認
2. 詳細をクリックして結果の詳細を表示

## 開発ガイドライン

### 新しいAPIモジュールの追加

1. `src/modules/`配下に新しいディレクトリを作成
2. APIクライアントを`src/services/`に追加
3. モジュールコンポーネントを実装
4. ルーティングに追加

### コンポーネント開発規則

- TypeScriptの使用を推奨
- Pydanticスキーマとの整合性を保つ
- エラーハンドリングの実装
- ローディング状態の管理

## トラブルシューティング

### よくある起動問題と解決方法

#### 1. ポートが使用中の場合
```bash
# 停止スクリプトを使用（推奨）
./stop.sh

# または手動で確認と終了
lsof -i :9001
lsof -i :3001
kill -9 <PID>
```

#### 2. プロキシ設定エラー（vite.config.js）
**症状**: API接続エラーが大量発生  
**原因**: vite.config.jsのプロキシターゲットが間違っている

```bash
# 自動修正（start.shに含まれる）
./start.sh

# 手動修正の場合
# vite.config.jsを編集して以下を確認：
# target: 'http://localhost:3001' （正しいAPIプロキシポート）
```

#### 3. プロセスが完全に停止されない
**症状**: ./stop.shを実行してもプロセスが残存  
**解決策**: 
```bash
# 強制停止
./stop.sh
ps aux | grep "watchme-api-manager\|nodemon\|vite"
kill -9 <残存プロセスのPID>
```

#### 4. 起動確認方法
```bash
# サーバーヘルスチェック
curl http://localhost:3001/health

# プロセス確認
lsof -i :9001  # フロントエンド
lsof -i :3001  # APIプロキシ

# ブラウザでアクセス
# http://localhost:9001
```

### APIへの接続エラー
- ✅ **改善されたstart.sh**: 設定ファイルを自動チェック・修正
- CORSの設定を確認
- プロキシ設定が正しいか確認（3001番ポート）
- APIサービス（https://api.hey-watch.me）が稼働しているか確認

### 起動時の自動チェック機能
改善されたstart.shには以下の機能が含まれています：
- 既存プロセスの自動クリーンアップ
- ポート競合の自動解決（9001、3001番ポート）
- vite.config.jsの設定自動修正（3001番ポート）
- .envファイルのPORT設定自動追加
- 起動後のヘルスチェック
- 詳細な起動ログ表示

### 新機能（v1.2.0）🆕
- **行動グラフAPI実装**: SED音響イベント検出が完全稼働
- **直接HTTPS接続**: CORS問題を解決した安定した本番API接続
- **YamNet音響イベント検出**: 521種類の音響イベントを高精度で検出
- **改善されたAPIクライアント**: 10分タイムアウト、全ステータスコード対応

### 既存機能（v1.1.0）
- **React Router DOM**: URLベースナビゲーション、直接アクセス対応
- **動的プロキシ設定**: 新しいAPIサービスの追加が容易
- **強化されたログ機能**: タイムスタンプ付き詳細ログ
- **改善されたエラー表示**: タイムアウトと接続エラーの区別
- **10分タイムアウト**: Whisper処理の長時間実行に対応

## デプロイメント

### 開発環境
```bash
# 開発サーバーの起動
npm run dev
# アクセス: http://localhost:9001
```

### 本番環境
本番環境へのデプロイはCI/CDパイプラインを通じて自動化されています。
- **本番URL**: https://api.hey-watch.me/manager
- **デプロイ方法**: GitHubへのプッシュ後、自動デプロイ

## 注意事項

### APIアクセスについて
- 管理画面がどの環境で動作していても、APIは常に本番環境（`https://api.hey-watch.me`）を参照します
- 開発環境でも本番APIを使用するため、操作には十分注意してください

### ⚠️ 重要：Whisper API処理時間について
- **音声処理（Whisper API）は処理時間が非常に変動的です**
- 処理時間の範囲：**70秒～10分程度**（音声の長さや複雑さによる）
- **タイムアウトエラーが表示されても、実際の処理は成功している場合がほとんどです**
- タイムアウトが発生した場合は、以下の方法で処理結果を確認してください：
  1. データベースで処理ステータスを確認
  2. 少し時間をおいてから再度確認
  3. ログで実際の処理状況を確認

### タイムアウト設定について
- 現在のタイムアウト設定：5分（300秒）
- 長い音声ファイルの場合、タイムアウトは避けられません
- **タイムアウト = 処理失敗ではない**ことを理解してください

### Python実行環境
- サーバーサイドでPythonを使用する場合は、必ず `python3` コマンドを使用してください
- `pip` の代わりに `pip3` を使用してください

## 本番APIデプロイメント・トラブルシューティング 🆕

### 重要な学習内容（2025年1月実績）

#### 1. **CORS対応の重要性**
**問題**: API Manager から本番APIへの直接接続が CORS エラーで失敗
```javascript
// ❌ プロキシ経由接続が不安定
const response = await axios.post('/api/behavior-features', data)

// ✅ 直接HTTPS接続 + CORS許可対応
const response = await axios.post('https://api.hey-watch.me/behavior-features/fetch-and-process-paths', data)
```

**解決策**: APIクライアントで直接HTTPS接続を使用し、サーバーサイドでCORS設定を調整
- タイムアウトを10分に延長（SED音響処理対応）
- validateStatusで全ステータスコードを受け入れ
- ブラウザのセキュリティポリシーに適合

#### 2. **Docker依存関係管理**
**最も重要な学習**: requirements.txt と requirements-docker.txt の使い分け

**発生した問題**:
```bash
ModuleNotFoundError: No module named 'boto3'
```

**根本原因**:
- macOS開発環境用: `tensorflow-macos` (requirements.txt)
- Linux本番環境用: `tensorflow` (requirements-docker.txt)  
- boto3がrequirements-docker.txtに含まれていない

**解決策**:
```bash
# requirements-docker.txt に明示的に追加
echo "boto3>=1.26.0" >> requirements-docker.txt
echo "botocore>=1.29.0" >> requirements-docker.txt

# 改行の確認も重要
cat requirements-docker.txt | grep -A1 -B1 boto3
```

#### 3. **効率的デプロイ手順**
**今回実績**: 初回60分 → 次回予想15分（4倍効率化）

**ベストプラクティス**:
```bash
# 1. 事前チェック（必須）
□ 新エンドポイントのローカル動作確認
□ requirements.txtにすべての依存関係記載
□ .envファイル存在確認  
□ venvディレクトリ除外でファイルサイズ確認

# 2. 効率的な圧縮（重要）
tar --exclude="venv" --exclude="*.log" --exclude="*.tar.gz" \
    -czf project_updated.tar.gz .

# 3. 一括デプロイスクリプト
scp -i ~/watchme-key.pem project.tar.gz ubuntu@EC2_IP:~/
ssh -i ~/watchme-key.pem ubuntu@EC2_IP << 'EOF'
    # バックアップ作成
    cp -r existing_api existing_api_backup_$(date +%Y%m%d_%H%M%S)
    
    # 既存サービス停止
    sudo systemctl stop service-name
    sudo lsof -ti:PORT | xargs -r sudo kill -9
    
    # 展開・ビルド・起動
    tar -xzf project.tar.gz
    sudo docker-compose down
    sudo docker-compose build --no-cache
    sudo docker-compose up -d
    
    # 起動確認
    sleep 30
    curl -s http://localhost:PORT/ | grep -q "running" && echo "✅ 成功" || echo "❌ 失敗"
EOF
```

#### 4. **高速トラブルシューティング**
**診断コマンド**:
```bash
# システム状態一括確認
echo "Docker: $(sudo docker ps --filter 'name=api' --format 'table {{.Names}}\t{{.Status}}')"
echo "Port: $(sudo lsof -i:8004 | tail -n +2 || echo 'Free')"  
echo "API: $(curl -s http://localhost:8004/ 2>/dev/null || echo 'Not responding')"

# エラー原因特定
sudo docker-compose logs --tail=5
sudo journalctl -u service-name --no-pager -n 5
```

### デプロイ自動化スクリプト例

```bash
#!/bin/bash
# 今回の経験を踏まえた自動デプロイスクリプト
set -e

echo "🚀 API自動デプロイ開始..."

# 事前チェック
[ ! -f .env ] && echo "❌ .envファイルが見つかりません" && exit 1
grep -q "boto3" requirements.txt || echo "⚠️ boto3がrequirements.txtに含まれていません"

# 圧縮・転送・デプロイ実行
tar --exclude="venv" --exclude="*.log" -czf api_updated.tar.gz .
scp -i ~/watchme-key.pem api_updated.tar.gz ubuntu@3.24.16.82:~/

# リモート実行
ssh -i ~/watchme-key.pem ubuntu@3.24.16.82 << 'REMOTE_EOF'
    # (上記の一括デプロイ処理)
REMOTE_EOF

echo "🎉 デプロイ完了！"
```

### 運用時の注意点

1. **依存関係の二重管理**: 新しいPythonライブラリ追加時は必ずrequirements.txtとrequirements-docker.txtの両方を更新
2. **プラットフォーム固有パッケージ**: tensorflow-macos vs tensorflowのような環境差異に注意
3. **CORS設定**: 本番APIと開発環境の接続にはCORS設定とHTTPS直接接続が重要
4. **段階的確認**: 圧縮→転送→展開→ビルド→起動の各段階で確認

## ライセンス

[ライセンス情報]

## 貢献

[貢献ガイドライン]