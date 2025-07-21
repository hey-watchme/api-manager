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

### 1. 心理グラフAPI（3つ）
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
- Vite 5.1.6
- Tailwind CSS 3.4.1
- Chart.js 4.4.9（結果可視化）
- Lucide React（アイコン）

### バックエンド
- Express.js 4.21.2（ポート: 3001）
- CORS対応
- プロキシサーバー機能

## クイックスタート

### 簡単な起動方法

```bash
# 起動（初回は自動的に依存関係もインストールされます）
./start.sh

# 停止
./stop.sh
```

起動後、以下のURLでアクセスできます：
- **フロントエンド**: http://localhost:9001（ポート競合時は自動的に9002などに変更）
- **APIプロキシ**: http://localhost:3001

## 現在の動作状況

### 動作確認済み機能
- ✅ API Manager正常起動
- ✅ Whisper API（音声文字起こし）動作確認済み
  - テスト成功ファイル: `files/d067d407-cf73-4174-a9c1-d91fb60d64d0/2025-07-21/22-00/audio.wav`
  - 処理時間: 約5秒（ファイルにより大きく変動）
- ✅ プロキシサーバー機能
- ✅ フロントエンドUI

### 実装済みAPI
- **音声書き起こしAPI (Vibe Transcriber)**: 完全動作
- **プロンプト生成API (Vibe Aggregator)**: 設定済み（未テスト）  
- **スコアリングAPI (Vibe Scorer)**: 設定済み（未テスト）
- **行動特徴抽出API**: 設定済み（未テスト）
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
cp .env.example .env

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

### ポートが使用中の場合
```bash
# 停止スクリプトを使用
./stop.sh

# または手動で確認と終了
lsof -i :9001
lsof -i :3000
kill -9 <PID>
```

### APIへの接続エラー
- CORSの設定を確認
- プロキシ設定が正しいか確認
- APIサービスが起動しているか確認

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

## ライセンス

[ライセンス情報]

## 貢献

[貢献ガイドライン]