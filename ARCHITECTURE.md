# API Manager アーキテクチャ設計書

## 概要

API Managerは、WatchMeプラットフォームのマイクロサービスAPIを統合管理するWebアプリケーションです。本設計書では、モジュール分離型アーキテクチャに基づいた実装方針を定義します。

## 設計原則

### 1. 単一責任の原則 (Single Responsibility)
- 1つのAPIに対して1つのモジュール
- 各モジュールは独自の状態管理とUI を持つ
- モジュール間の相互依存を排除

### 2. 疎結合 (Loose Coupling)
- モジュール間の直接的な依存関係を避ける
- 共通機能はユーティリティとして切り出し
- イベント駆動型の通信を採用

### 3. 高凝集 (High Cohesion)
- 関連する機能を1つのモジュール内に集約
- APIの実行、スケジュール、履歴管理を統合

## システムアーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                    フロントエンド (React)                  │
├─────────────────────────────────────────────────────────┤
│                    ページレイヤー                         │
│  DashboardPage │ PsychologyPage │ BehaviorPage │ etc    │
├─────────────────────────────────────────────────────────┤
│                  モジュールレイヤー                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐     │
│  │ Psychology  │ │  Behavior   │ │  Emotion    │     │
│  │  Modules    │ │  Modules    │ │  Modules    │     │
│  └─────────────┘ └─────────────┘ └─────────────┘     │
├─────────────────────────────────────────────────────────┤
│              共通コンポーネントレイヤー                    │
│  ApiExecutor │ Scheduler │ HistoryViewer │ StatusCard  │
├─────────────────────────────────────────────────────────┤
│                 サービスレイヤー                          │
│  ApiClient │ SchedulerService │ StorageService │ etc   │
├─────────────────────────────────────────────────────────┤
│                バックエンド (Express)                     │
│           プロキシサーバー │ 認証 │ ロギング              │
└─────────────────────────────────────────────────────────┘
```

## モジュール構造

### 1. APIモジュール

各APIモジュールは以下の構造を持ちます：

```
modules/
└── psychology/
    ├── transcriber/
    │   ├── TranscriberModule.jsx      # メインコンポーネント
    │   ├── TranscriberForm.jsx         # 入力フォーム
    │   ├── TranscriberResults.jsx      # 結果表示
    │   ├── TranscriberScheduler.jsx    # スケジューラー
    │   ├── transcriber.service.js      # APIクライアント
    │   └── transcriber.config.js       # 設定
    ├── aggregator/
    └── scorer/
```

### 2. 共通コンポーネント

```
components/
├── common/
│   ├── Card.jsx              # カードコンポーネント
│   ├── Button.jsx            # ボタンコンポーネント
│   ├── Input.jsx             # 入力コンポーネント
│   └── Loading.jsx           # ローディング表示
├── api/
│   ├── ApiExecutor.jsx       # API実行UI
│   ├── ParameterForm.jsx     # パラメータ入力フォーム
│   └── ResultViewer.jsx      # 結果表示
└── scheduler/
    ├── SchedulerForm.jsx     # スケジュール設定
    └── ScheduleList.jsx      # スケジュール一覧
```

## データフロー

### 1. API実行フロー

```
User Input → Module Form → Validation → API Service → Backend Proxy → External API
     ↓                                                                         ↓
Result Display ← Result Processing ← Response Handler ← ← ← ← ← ← ← ← ← ← ← ↓
```

### 2. スケジュール実行フロー

```
Schedule Config → Scheduler Service → Cron Job → API Execution
                         ↓
                  Storage Service → History Management
```

## 状態管理

### 1. モジュールレベルの状態
- 各モジュールは独自の状態を管理
- React Context APIを使用してモジュール内で共有

### 2. アプリケーションレベルの状態
- 認証情報
- グローバル設定
- 通知・アラート

## APIクライアント設計

### 基底クラス

```javascript
class BaseApiClient {
  constructor(config) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout || 30000;
  }

  async execute(endpoint, params) {
    // 共通の実行ロジック
  }

  async checkStatus() {
    // ステータスチェック
  }
}
```

### 個別APIクライアント

```javascript
class TranscriberApiClient extends BaseApiClient {
  constructor() {
    super({
      baseURL: process.env.VITE_PSYCHOLOGY_API_URL,
      timeout: 60000
    });
  }

  async transcribe(params) {
    return this.execute('/transcribe', {
      device_id: params.deviceId,
      date: params.date,
      file_paths: params.filePaths,
      model: params.model
    });
  }
}
```

## セキュリティ考慮事項

### 1. API通信
- HTTPSの使用
- CORSの適切な設定
- APIキーの環境変数管理

### 2. 入力検証
- クライアントサイドでの基本検証
- サーバーサイドでの詳細検証
- SQLインジェクション対策

### 3. 認証・認可
- JWTトークンによる認証
- ロールベースのアクセス制御
- セッション管理

## パフォーマンス最適化

### 1. コード分割
- React.lazyによる動的インポート
- ルートレベルでのコード分割

### 2. キャッシング
- API応答のキャッシュ
- 静的アセットのブラウザキャッシュ

### 3. 最適化手法
- メモ化（useMemo, useCallback）
- 仮想スクロール（大量データ表示時）
- デバウンス/スロットリング

## テスト戦略

### 1. ユニットテスト
- 各モジュールの個別テスト
- APIクライアントのモックテスト
- ユーティリティ関数のテスト

### 2. 統合テスト
- モジュール間の連携テスト
- API通信のE2Eテスト

### 3. UIテスト
- React Testing Library
- ユーザーインタラクションのテスト

## デプロイメント

### 1. ビルドプロセス
```bash
npm run build  # Viteによるビルド
npm start      # Express サーバー起動
```

### 2. 環境設定
- 開発環境: `.env.development`
- 本番環境: `.env.production`

### 3. Dockerization
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

## 今後の拡張性

### 1. 新規API追加
- モジュールテンプレートの使用
- 設定ファイルの追加のみで対応

### 2. 機能拡張
- リアルタイム実行状況の表示
- バッチ実行機能
- API実行のキューイング

### 3. 統合可能性
- GraphQL APIへの移行
- WebSocket による リアルタイム通信
- マイクロフロントエンドアーキテクチャ

## まとめ

このアーキテクチャは、拡張性、保守性、テスタビリティを重視した設計となっています。各APIモジュールの独立性を保ちながら、共通機能を効率的に再利用することで、開発効率と品質の向上を実現します。