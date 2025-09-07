# API Manager - WatchMe プラットフォーム

## 概要

API Managerは、WatchMeプラットフォームの複数のマイクロサービスAPIを統合管理するためのWebアプリケーションです。各APIの手動実行、スケジュール実行、パラメータ管理などを一元的に行うことができます。

**本番URL**: https://api.hey-watch.me/manager  
**開発環境**: http://localhost:9001  
**GitHubリポジトリ**: https://github.com/matsumotokaya/watchme-api-manager

### 📊 本番環境デプロイ状況

✅ **デプロイ完了** - API Managerは本番環境で正常に稼働中です

**最終更新**: 2025年9月3日  
**更新履歴**: [CHANGELOG.md](./CHANGELOG.md)を参照してください

#### 🔗 **コンテナ名とAPI対応表（2025年8月10日更新 - 必ず参照）**
スケジューラーが各APIと通信する際の**正確なコンテナ名**とポート番号：

| API種類 | UI上の名前 | **実際のコンテナ名** | ポート | エンドポイント | HTTPメソッド | 処理タイプ |
|---------|-----------|---------------------|--------|----------------|-------------|-----------|
| ~~**[心理] Whisper書き起こし**~~ | ~~`whisper`~~ | ~~`api-transcriber`~~ | ~~8001~~ | ~~`/fetch-and-transcribe`~~ | ~~POST~~ | ~~ファイルベース~~ | **※2025/09/02削除済み** |
| **[心理] Azure Speech書き起こし** | `azure-transcriber` | `vibe-transcriber-v2` | 8013 | `/fetch-and-transcribe` | POST | ファイル&デバイスベース |
| **[心理] プロンプト生成** | `vibe-aggregator` | `api_gen_prompt_mood_chart` | 8009 | `/generate-mood-prompt-supabase` | **GET** ⚠️ | デバイスベース |
| **[心理] スコアリング** | `vibe-scorer` | `api-gpt-v1` | 8002 | `/analyze-vibegraph-supabase` | POST | デバイスベース |
| **[行動] 音声イベント検出** | `behavior-features` | `sed-api` | 8004 | `/fetch-and-process-paths` | POST | ファイルベース |
| **[行動] 音声イベント集計** | `behavior-aggregator` | `api-sed-aggregator` | 8010 | `/analysis/sed` | POST | デバイスベース |
| **[感情] 音声特徴量抽出** | `emotion-features` | `opensmile-api` | 8011 | `/process/emotion-features` | POST | ファイルベース |
| **[感情] 感情スコア集計** | `emotion-aggregator` | `opensmile-aggregator` | 8012 | `/analyze/opensmile-aggregator` | POST | デバイスベース |

**⚠️ 重要な注意事項:**
1. UIに表示される名前と実際のコンテナ名は異なります！
2. `vibe-aggregator`のみGETメソッドを使用（他はすべてPOST）
3. Dockerコンテナ内では`localhost`ではなく、必ずコンテナ名を使用すること
4. **Azure Speech API**: 新旧2つのインターフェースを統合サポート
   - 新: `{"device_id": "uuid", "local_date": "2025-08-26", "model": "azure"}`
   - 旧: `{"file_paths": ["path1", "path2"], "model": "azure"}`

#### 自動化済みAPI
現在、以下のAPIの自動実行がAPI Managerで管理されています：

##### ✅ バックエンド実装済み（実際に自動実行される）
- ~~**[心理] Whisper書き起こし**~~ - ~~ファイルベース自動処理~~ ※2025/09/02削除 - Azure Speechへ移行
- **[行動] 音声イベント検出** - ファイルベース自動処理  
- **[感情] 音声特徴量抽出** - ファイルベース自動処理

##### ✅ デバイスベースAPI（バックエンド実装完了）
- **[心理] プロンプト生成** - デバイスベース自動処理
- **[心理] スコアリング** - デバイスベース自動処理
- **[行動] 音声イベント集計** - デバイスベース自動処理
- **[感情] 感情スコア集計** - デバイスベース自動処理

---

## 🚀 Azure Speech Service API統合機能（2025年8月26日実装）

### 概要

Azure Speech Service APIの統合機能は、WatchMeプラットフォームとの完全統合により、デバイスID + 日付による効率的なバッチ処理を可能にします。従来のfile_pathsインターフェースに加え、新しいWatchMeシステム統合インターフェースをサポートします。

**アクセスURL**: https://api.hey-watch.me/manager/psychology/azure-transcriber

### 主要機能

#### 🔄 2つのインターフェース統合サポート

**新しいインターフェース（推奨）**:
```json
{
  "device_id": "d067d407-cf73-4174-a9c1-d91fb60d64d0",
  "local_date": "2025-08-26",
  "time_blocks": ["09-00", "09-30", "10-00"],
  "model": "azure"
}
```

**既存インターフェース（後方互換性）**:
```json
{
  "file_paths": [
    "files/device_id/2025-08-25/23-00/audio.wav"
  ],
  "model": "azure"
}
```

#### ⚡ 技術的改善

- **タイムアウト延長**: 10分設定で長時間の音声処理に対応
- **Supabase統合**: `audio_files`テーブルから処理対象ファイルを自動取得
- **AWS S3統合**: 音声ファイルを直接取得して高速処理
- **エラーハンドリング強化**: より安定したAPIレスポンス処理

#### 🎨 UI/UX改善

- **前向きなメッセージ**: Azure Speech Service SDK 1.45.0の安定性をアピール
- **処理情報の明確化**: タイムアウト10分、自動保存についての案内
- **警告の削除**: 問題解決により不要になった警告表示を撤廃

### 開発環境対応

#### プロキシ設定
```javascript
// vite.config.js - 開発環境でのプロキシ対応
'/vibe-transcriber-v2': {
  target: 'https://api.hey-watch.me',
  changeOrigin: true,
  secure: true
}
```

#### API Client構造改善
```javascript
// AzureTranscriberApiClient.js - 改善された構造
constructor() {
  super({
    baseURL: 'https://api.hey-watch.me/vibe-transcriber-v2',
    timeout: 600000 // 10分のタイムアウト
  })
}
```

---

## 📊 ダッシュボード機能（2025年9月1日実装・更新）

### 概要

ダッシュボード機能は、30分単位（タイムブロック）での高精度なプロンプト生成を可能にする新機能です。従来の1日単位の処理に加えて、より細かい時間単位での心理状態分析が可能になりました。

**アクセスURL**: https://api.hey-watch.me/manager/dashboard

### 主要機能

#### 🎯 タイムブロック単位プロンプト生成
- **処理単位**: 30分ごとのタイムブロック（00-00, 00-30, 01-00...23-30）
- **データ統合**: 
  - Whisper音声書き起こしデータ（vibe_whisperテーブル）
  - YAMNet音響イベント検出データ（behavior_yamnetテーブル）
  - 観測対象者情報（subjectsテーブル）
- **データ保存先**: 
  - **プロンプト**: dashboardテーブルの`prompt`カラム
  - **分析結果**: ChatGPT分析後、同テーブルの`analysis_result`カラムに格納

#### 🎨 使いやすいUI設計
- **デバイス選択**: 
  - Supabaseのdevicesテーブルから自動取得
  - デバイスIDのみを表示（シンプルな選択UI）
  - デフォルトでよく使用されるデバイスIDを自動選択
- **日付選択**: カレンダーUIで簡単指定
- **タイムブロック選択**:
  - 個別選択: 必要なタイムブロックのみ選択
  - 時間帯別クイック選択: 早朝/午前/午後/夕方/夜など
  - 全選択/全解除: ワンクリックで切り替え
- **進捗表示**: リアルタイムプログレスバーと処理状況表示

#### 🔧 技術仕様
- **APIエンドポイント**: `GET /generate-timeblock-prompt`
- **必須パラメータ**:
  - `device_id`: デバイスID（UUID形式）
  - `date`: 処理日付（YYYY-MM-DD形式）
  - `time_block`: タイムブロック（HH-MM形式）
- **バックエンド**: api_gen_prompt_mood_chartコンテナ（ポート8009）
- **レスポンス**: 成功/失敗状態、プロンプト長、データ有無情報

#### 💾 データベース構造
- **devicesテーブル**: デバイス情報（device_idのみを使用）
- **dashboardテーブル**:
  - `device_id`: デバイス識別子
  - `date`: 処理日付
  - `time_block`: タイムブロック
  - `prompt`: 生成されたプロンプト
  - `analysis_result`: ChatGPT分析結果（JSON形式）
  - `vibe_score`: 感情スコア（-100〜100）
  - `summary`: 分析結果のサマリー

### 開発者向け情報

#### コンポーネント構成
```
src/
├── pages/
│   └── DashboardPage.jsx              # メインページ
├── modules/dashboard/
│   ├── DashboardTimeblockForm.jsx     # 入力フォーム
│   └── DashboardTimeblockResults.jsx  # 結果表示
└── services/
    └── DashboardApiClient.js          # API通信
```

#### 使用例
```javascript
// APIクライアント使用例
import dashboardApiClient from './services/DashboardApiClient'

const result = await dashboardApiClient.generateTimeblockPrompt(
  '9f7d6e27-98c3-4c19-bdfb-f7fda58b9a93',  // device_id
  '2025-09-01',                              // date
  '19-30'                                     // time_block
)
```

---

## 🎵 オーディオファイル機能（2025年8月25日実装）

### 概要

オーディオファイル機能は、WatchMeプラットフォームで録音された音声ファイルの一覧表示・再生・ダウンロードを可能にする新機能です。VaultAPIと連携し、署名付きURLによる安全なファイルアクセスを提供します。

**アクセスURL**: https://api.hey-watch.me/manager/audio

### 主要機能

#### 📋 ファイル一覧表示
- **データベース連携**: VaultAPIを通じてリアルタイムでファイル情報を取得
- **カラム表示**: `device_id`, `file_size_bytes`, `local_date`, `time_block`, `status`
- **ページング**: 50件ずつの効率的な表示 + 「もっと読み込む」機能
- **ソート**: 作成日時降順で最新ファイルを優先表示

#### 🔍 高度なフィルタリング
- **デバイスフィルター**: `device_id`による絞り込み（ドロップダウン選択）
- **日付範囲フィルター**: `local_date_from` / `local_date_to`による録音日ベースの絞り込み
- **3つの独立ステータスフィルター**:
  - `transcriptions_status` - 転写処理状況
  - `behavior_features_status` - 行動分析処理状況  
  - `emotion_features_status` - 感情分析処理状況
- **各ステータス値**: `completed`, `processing`, `failed`, `pending`, `error`

#### 🎵 音声再生・ダウンロード
- **署名付きURL**: S3ファイルへの安全なアクセス（1時間有効）
- **ブラウザ内再生**: HTML5 Audioによる直接再生
- **ダウンロード**: ワンクリックでローカル保存
- **プログレス表示**: 読み込み状況のリアルタイム表示

#### 🛡️ セキュリティ対応
- **署名付きURL**: 一時的なアクセス権限による安全なファイルアクセス
- **CORS対応**: 開発環境ではプロキシ、本番環境では同一ドメインアクセス
- **エラーハンドリング**: ファイル存在確認・アクセス権限チェック

### 技術仕様

#### フロントエンド（React）
```javascript
// 主要コンポーネント構成
src/modules/audio/
├── AudioFilesModule.jsx      // メインモジュール
├── AudioFilesList.jsx        // ファイル一覧表示
├── AudioPlayer.jsx           // 音声プレイヤー
├── AudioFilters.jsx          // フィルタリング機能
└── AudioFileRow.jsx          // 各行の表示コンポーネント

// 新規ページ
src/pages/AudioFilesPage.jsx
```

#### APIエンドポイント（VaultAPI連携）
```bash
# ファイル一覧取得
GET /api/audio-files?device_id=xxx&local_date_from=2025-08-25&transcriptions_status=completed

# 署名付きURL生成  
GET /api/audio-files/presigned-url?file_path=xxx&expiration_hours=1

# デバイス一覧取得
GET /api/devices
```

#### 環境変数
```bash
# VaultAPI連携用
VITE_VAULT_API_BASE_URL=https://api.hey-watch.me
```

### 開発者向け情報

#### ローカル開発環境
- **プロキシ設定**: `vite.config.js`でCORS回避
- **開発サーバー**: http://localhost:9001/audio
- **Hot Module Replacement**: リアルタイムコード更新対応

#### 本番環境デプロイ
```bash
# 1. ローカルビルド・ECRプッシュ
./deploy-frontend.sh

# 2. EC2でのコンテナ展開
ssh -i ~/watchme-key.pem ubuntu@3.24.16.82
cd /home/ubuntu/watchme-api-manager
./deploy-frontend-ec2.sh
```

#### パフォーマンス最適化
- **遅延読み込み**: 必要に応じてコンポーネント読み込み
- **メモ化**: React.memoによる不要な再レンダリング防止
- **バッチ処理**: 複数API呼び出しの最適化

---

## アーキテクチャ

本アプリケーションは、UIを提供する「フロントエンド(React)」と、スケジューラー機能を担う「バックエンドAPI(Python)」の2つのサーバーで構成されています。詳細はリポジトリ内の各ソースコードを参照してください。

**⚠️ 重要**: システムには3種類の異なるエンドポイントが存在します。詳細は [エンドポイントの3層構造を理解する](#-エンドポイントの3層構造を理解する重要) セクションを必ず参照してください。

### 🕐 **現在のスケジュール設定一覧（2025年9月7日更新）**

#### **⚠️ 重要な仕様変更**
- **Web UIのスケジューラー制御は削除済み**（機能していなかったため）
- **実際の制御**: cron設定（`/etc/cron.d/watchme-scheduler`）+ config.json（有効/無効のみ）で管理
- **設定変更**: 手動でのcronファイル編集が必要

#### **📋 実行スケジュール一覧**

| 実行時刻 | API名 | 機能 | 頻度 | 有効状態 | 処理タイプ | コンテナ名 |
|---------|-------|------|------|----------|-----------|-----------|
| **毎時10分** | `azure-transcriber` | Azure音声書き起こし | 毎時間 | ✅ 有効 | ファイルベース | `vibe-transcriber-v2` |
| **毎時10分** | `behavior-features` | 行動特徴抽出 | 毎時間 | ✅ 有効 | ファイルベース | `sed-api` |
| **毎時20分** | `vibe-aggregator` | 心理プロンプト生成（日次） | 毎時間 | ✅ 有効 | デバイスベース | `api_gen_prompt_mood_chart` |
| **毎時20分** | `behavior-aggregator` | 行動データ集計 | 毎時間 | ✅ 有効 | デバイスベース | `api-sed-aggregator` |
| **毎時20分** | `emotion-features` | 感情特徴抽出 | 毎時間 | ✅ 有効 | ファイルベース | `opensmile-api` |
| **毎時30分** | `emotion-aggregator` | 感情データ集計 | 毎時間 | ✅ 有効 | デバイスベース | `opensmile-aggregator` |
| **毎時40分** | `timeblock-prompt` | タイムブロック単位プロンプト生成 | 毎時間 | ✅ 有効 | タイムブロックベース | `api_gen_prompt_mood_chart` |
| **毎時50分** | `timeblock-analysis` | タイムブロック単位ChatGPT分析 | 毎時間 | ✅ 有効 | ダッシュボードベース | `api-gpt-v1` |
| **30分（3時間ごと）** | `vibe-scorer` | 心理スコアリング | 8回/日※ | ✅ 有効 | デバイスベース | `api-gpt-v1` |
| ~~毎時10分~~ | ~~`whisper`~~ | ~~Whisper書き起こし~~ | ~~停止~~ | ❌ 無効 | ~~削除済み~~ | ~~削除済み~~ |

**※ vibe-scorer実行時刻**: 0:30, 3:30, 6:30, 9:30, 12:30, 15:30, 18:30, 21:30（コスト削減のため）

#### **📊 実行頻度の詳細**

**毎時間実行（24回/日）**:
- Azure音声書き起こし（毎時10分）
- 行動特徴抽出（毎時10分）
- 心理プロンプト生成・日次集計（毎時20分）
- 行動データ集計（毎時20分）
- 感情特徴抽出（毎時20分）
- 感情データ集計（毎時30分）
- **タイムブロック単位プロンプト生成（毎時40分）** 🆕
- **タイムブロック単位ChatGPT分析（毎時50分）** 🆕 （2025/09/07追加）

**3時間ごと実行（8回/日）**:
- 心理スコアリング（コスト削減のため頻度を制限）

#### **🆕 timeblock-prompt の特徴**
- **処理内容**: 3つのテーブル（vibe_whisper, behavior_yamnet, emotion_opensmile）から`pending`ステータスのデータを検出して処理
- **エンドポイント**: `/generate-timeblock-prompt`（vibe-aggregatorとは異なる）
- **実行タイミング**: 他のAPIの処理完了後（40分）に実行
- **バッチ処理**: 1回の実行で最大10件のタイムブロックを処理（config.jsonで調整可能）

#### **🆕 timeblock-analysis の特徴** （2025/09/07追加）
- **処理内容**: dashboardテーブルの`status='pending'`かつ`prompt IS NOT NULL`のレコードをChatGPTで分析
- **エンドポイント**: `POST /analyze-timeblock`（api-gpt-v1コンテナ）
- **実行タイミング**: timeblock-promptの10分後（50分）に実行
- **バッチ処理**: 1回の実行で最大50件のレコードを処理（config.jsonで調整可能）
- **結果保存**: analysis_result、vibe_score、summaryをdashboardテーブルに保存し、statusを'completed'に更新

#### **🔧 設定変更方法**

1. **有効/無効の切り替え**:
   ```bash
   # config.jsonを直接編集
   sudo nano /home/ubuntu/scheduler/config.json
   ```

2. **実行時刻の変更**:
   ```bash  
   # cronファイルを編集
   sudo nano /etc/cron.d/watchme-scheduler
   ```

3. **新しいAPIの追加**:
   - cronファイルにエントリを追加
   - config.jsonに設定を追加
   - run_if_enabled.pyが自動でAPI実行を制御

#### 仕組みの詳細

1. **UIからの制御**
   - API Managerの画面で各APIのON/OFFを切り替え
   - 設定は `/home/ubuntu/scheduler/config.json` に保存
   - 実行間隔の変更はできません（固定スケジュール）

2. **cron設定** (`/etc/cron.d/watchme-scheduler`)
   - ホストOS側で固定時刻にスクリプトを実行
   - 負荷分散のため、APIごとに実行時刻をずらしている

3. **実行制御** (`run_if_enabled.py`)
   - cronから呼ばれるPythonスクリプト
   - config.jsonを読み、APIが有効な場合のみ実行
   - `docker exec` コマンドでコンテナ内のAPIを起動

4. **ログ管理**
   - 各APIの実行ログ: `/var/log/scheduler/scheduler-[API名].log`
   - cron実行ログ: `/var/log/scheduler/cron.log`

#### なぜこのアーキテクチャなのか？

- **セキュリティ**: Dockerコンテナからホストのシステムファイルを変更しない
- **シンプル**: cron設定は静的で、トラブルシューティングが容易
- **柔軟性**: UIからON/OFF制御可能、実行時刻は運用で最適化済み
- **負荷分散**: APIを時間差で実行し、サーバー負荷を平準化

---

## 🔧 デバイスID設定管理（重要）

### テストデバイスIDの一元管理

**問題**: デバイスIDが複数箇所に分散していると、変更時に修正漏れが発生する

**解決策**: フロントエンドの設定を唯一の真実の源（Single Source of Truth）とする

#### デバイスID変更手順

1. **フロントエンドで変更**
   - `src/config/constants.js` の `DEFAULT_DEVICE_ID` を変更
   - これにより全てのUIコンポーネントに反映される

2. **本番環境への反映**
   - API Managerの画面から各APIの設定を保存
   - これにより `/home/ubuntu/scheduler/config.json` が更新される
   - スケジューラーは自動的に新しいデバイスIDを使用

3. **確認方法**
   ```bash
   # 本番サーバーで実行
   cat /home/ubuntu/scheduler/config.json | jq '.apis[].deviceId'
   ```

#### ⚠️ 注意事項

- **バックエンドのハードコーディングは避ける**
- config.jsonが存在しない場合、スケジューラーは警告を出力
- 緊急時のフォールバック値は `scheduler/run-api-process-docker.py` に記載

#### 設定ファイルの優先順位

1. `/home/ubuntu/scheduler/config.json` （フロントエンドから設定）
2. フォールバック値（警告付きで使用）

---

## 🎨 UI仕様・操作方法（2025年8月21日更新）

### 📱 全デバイス対応UI

2025年8月21日のアップデートで、**デバイスID入力を完全に廃止**し、**全デバイス自動処理**に対応しました。

#### 🔧 手動処理セクション

**新しい仕様**:
- ✅ **日付のみ選択**: カレンダーから処理対象日を選択
- ✅ **全デバイス自動処理**: 指定日付の全デバイスIDを自動検出・順次処理
- ✅ **進捗表示**: リアルタイム進捗バー・デバイス別完了状況を表示

**操作手順**:
1. 日付を選択（デフォルト：本日）
2. 「🤖 [API名]開始」ボタンをクリック
3. 進捗バーで処理状況を確認
4. 完了後に結果を確認

**UI例**:
```
🔧 手動処理

処理対象日付: [2025/8/21 ▼]
📊 処理内容：指定した日付の全デバイスが処理対象となります。

[🤖 行動分析開始]

--- 処理中の表示 ---
処理進捗: 2/3 (67%)
██████████░░░ 

✅ 9f7d6e27...  
🔄 3a8b9c15...  ← 処理中
⚪ 7e2f4d8a...  

完了: 2/3 デバイスの処理が完了しました
```

#### 🤖 自動処理セクション（スケジューラー）

**新しい仕様**:
- ✅ **デバイスID入力廃止**: 「📱 全デバイス」と固定表示
- ✅ **日付自動更新**: 毎日自動で当日に設定
- ✅ **スケジュール表示**: 実行時刻・頻度を明確に表示

**UI例**:
```
🤖 Behavior Aggregator 自動処理
✅ 有効

📅 実行時刻: 毎時20分 (毎時間)

処理対象: 📱 全デバイス
処理日付: 2025/8/21（自動更新）

[🟢 有効]

📊 最終処理: 2025/8/21 7:22:15
```

#### 🎯 対象API（全4つ）

以下の4つのAPIが全デバイス対応済みです：

1. **🤖 Behavior Aggregator**（行動データ集計）
   - 実行時刻: 毎時20分
   - YamNetモデルによる音響イベント検出データを集計

2. **📊 Emotion Aggregator**（感情データ集計）
   - 実行時刻: 毎時30分
   - OpenSMILE音声特徴量データを集計

3. **📝 Vibe Aggregator**（心理プロンプト生成）
   - 実行時刻: 毎時20分
   - 48スロット（30分単位）のTranscriberデータをまとめて処理

4. **🤖 Vibe Scorer**（心理スコアリング）
   - 実行時刻: 30分（3時間ごと）※特別スケジュール
   - ChatGPTで心理スコアを分析

5. **🎵 オーディオファイル管理**（2025年8月25日追加）
   - アクセス: https://api.hey-watch.me/manager/audio
   - 音声ファイルの一覧表示・再生・ダウンロード
   - VaultAPI連携による署名付きURLアクセス

#### ⚡ 技術仕様

**処理方式**:
- **順次処理**: サーバー負荷を制御するため、デバイスを1つずつ順番に処理
- **進捗追跡**: リアルタイムで処理状況を表示
- **エラーハンドリング**: デバイス単位でエラーをキャッチ・ログ出力
- **フォールバック**: デバイス一覧取得失敗時はテストデバイスIDを使用

**共通コンポーネント**:
- `AllDevicesDateForm.jsx`: 日付のみ選択フォーム
- `DeviceProcessingProgress.jsx`: 進捗表示コンポーネント
- `AutoProcessControlWithParams.jsx`: 全デバイス対応自動処理コントロール

**オーディオファイル専用コンポーネント**:
- `AudioFilesModule.jsx`: オーディオファイル管理のメインモジュール
- `AudioFilters.jsx`: local_dateベース + 3ステータスフィルタリング
- `AudioFilesList.jsx`: ページング対応ファイル一覧表示  
- `AudioPlayer.jsx`: 署名付きURL + HTML5Audio再生
- `AudioFileRow.jsx`: device_id/local_date/time_block表示

---

## 開発ガイドライン

### 🚨 ブランチ運用ルール（必須）

**重要**: featureブランチで作業した内容は、必ずmainブランチにマージしてください。

1. **featureブランチでの開発**
   ```bash
   # 新機能の開発を開始
   git checkout -b feature/新機能名
   
   # 開発・コミット
   git add .
   git commit -m "feat: 新機能の説明"
   ```

2. **mainブランチへのマージ（必須）**
   ```bash
   # mainブランチを最新に更新
   git checkout main
   git pull origin main
   
   # featureブランチをマージ
   git merge feature/新機能名
   
   # リモートにプッシュ
   git push origin main
   ```

3. **Pull Requestの活用（推奨）**
   - 大きな変更の場合は、GitHubでPull Requestを作成
   - コードレビューを経てマージ

**⚠️ 注意**: 
- featureブランチで作業したまま放置しない
- mainブランチが唯一の真実の源（Single Source of Truth）
- デプロイは必ずmainブランチから実行

#### 🧹 ブランチクリーンアップ（定期実行推奨）

**問題**: 古いfeatureブランチが残ると、どれが最新か分からなくなる

**解決策**: マージ後は必ず不要なブランチを削除する
```bash
# 1. マージ済みブランチの確認
git branch --merged main

# 2. 不要なローカルブランチを削除
git branch -d feature/古いブランチ名

# 3. 孤立したブランチ（リモートにない）を確認
git branch -vv | grep "\[gone\]"

# 4. 孤立ブランチを強制削除（内容確認後）
git branch -D feature/孤立したブランチ名

# 5. リモートの削除済みブランチを反映
git remote prune origin
```

**定期メンテナンス**:
- 月1回程度、`git branch -vv` でブランチ状況を確認
- `[gone]` 表示のあるブランチは削除対象

---

## 開発環境セットアップ

### 前提条件
- Node.js 18以上
- Python 3.11以上（本番環境でのスケジューラー実行用）
- Docker, Docker Compose

### 環境変数設定

`.env`ファイルを作成し、以下の環境変数を設定してください：

```bash
# Supabase設定
# VITE_プレフィックスはフロントエンド（React/Vite）用
# バックエンド（Python）は自動的にVITE_プレフィックス付きも認識します
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_KEY=your_supabase_key

# API エンドポイント（本番環境）
VITE_API_BASE_URL=https://api.hey-watch.me

# 開発環境設定
VITE_PORT=9001
```

**重要**: 
- フロントエンド（React）は`VITE_`プレフィックス付きの環境変数のみ使用
- バックエンド（Python/スケジューラー）は`VITE_`プレフィックス付きも自動認識（2025年8月22日更新）
- 環境変数の重複記述は不要

### 起動手順

1.  **リポジトリのクローン**
    ```bash
    git clone git@github.com:matsumotokaya/watchme-api-manager.git
    cd watchme-api-manager
    ```

2.  **フロントエンド開発サーバーの起動**
    ```bash
    # 推奨：専用スクリプトでバックグラウンド起動
    ./start-frontend-dev.sh
    
    # または手動起動
    npm install
    npm run dev
    
    # => http://localhost:9001 でアクセス可能
    ```

### ⚠️ 重要：スケジューラー機能について

**スケジューラー機能は本番環境（EC2サーバー）でのみ動作します。**

理由：
- スケジューラーはホストOSのcronジョブと連携して動作
- 各APIコンテナへの接続はDocker内のwatchme-network経由で行われる
- ローカル環境では、UIの動作確認は可能だが、実際のスケジュール実行はできない

本番環境でのスケジューラーテスト方法については、「デプロイメント」セクションを参照してください。

---

## デプロイメント

### 🚨 重要：API ManagerとSchedulerの関係を理解する（必読）

**API Managerサービスは2つのコンテナで構成されています：**

| コンテナ名 | 役割 | ポート | 管理ファイル |
|-----------|------|--------|------------|
| **watchme-api-manager-prod** | WebUI（React） | 9001 | docker-compose.prod.yml |
| **watchme-scheduler-prod** | スケジューラーAPI（Python） | 8015 | docker-compose.all.yml（両方含む） |

### ⚠️ デプロイ時の最重要注意事項

**絶対に間違えてはいけないこと：**

1. **systemd設定は必ず`docker-compose.all.yml`を使用**
   - ❌ 間違い：`docker-compose.prod.yml`（API Managerのみ起動）
   - ✅ 正解：`docker-compose.all.yml`（API Manager + Scheduler両方起動）

2. **ネットワーク設定は必ず`external: true`**
   ```yaml
   # docker-compose.all.ymlの最後
   networks:
     watchme-network:
       external: true  # ✅ 既存ネットワークを使用
       # driver: bridge ❌ 新規作成してしまうので絶対NG
   ```

3. **デプロイ後は両方のコンテナが起動していることを必ず確認**
   ```bash
   docker ps | grep -E "api-manager|scheduler"
   # 両方表示されることを確認
   ```

### デプロイ手順

本アプリケーションのデプロイは、ECR (Elastic Container Registry) を利用して行います。フロントエンドとスケジューラーAPIは、それぞれ別のDockerイメージとしてビルドされ、EC2上でコンテナとして実行されます。

#### ⚠️ 前提条件：ネットワークインフラの確認（2025年8月28日追加）

デプロイ前に、`watchme-network`が存在することを確認してください：

```bash
# EC2サーバーで実行
ssh -i ~/watchme-key.pem ubuntu@3.24.16.82

# watchme-networkの存在確認と状態チェック
bash /home/ubuntu/watchme-server-configs/scripts/check-infrastructure.sh

# 問題がある場合は自動修復
python3 /home/ubuntu/watchme-server-configs/scripts/network_monitor.py --fix
```

#### 🚀 推奨デプロイ手順（安全な方法）

**重要：必ず両方のコンテナを一緒にデプロイしてください**

```bash
# 1. ローカルでイメージをビルドしてECRへプッシュ
./deploy-frontend.sh        # API Manager (UI)のイメージをプッシュ
./deploy-scheduler.sh       # Scheduler APIのイメージをプッシュ

# 2. EC2サーバーでコンテナを展開
ssh -i ~/watchme-key.pem ubuntu@3.24.16.82
cd /home/ubuntu/watchme-api-manager

# 3. 設定ファイルの確認（重要！）
# docker-compose.all.ymlの最後が以下のようになっていることを確認
tail -5 docker-compose.all.yml
# networks:
#   watchme-network:
#     external: true  ← これが重要！

# 4. 両方のコンテナを一緒に再起動（推奨方法）
docker-compose -f docker-compose.all.yml pull
docker-compose -f docker-compose.all.yml down
docker-compose -f docker-compose.all.yml up -d

# 5. 必ず両方が起動していることを確認
docker ps | grep -E "api-manager|scheduler"
# 以下の2行が表示されることを確認：
# watchme-api-manager-prod ... Up ... 9001
# watchme-scheduler-prod   ... Up ... 8015

# 6. ヘルスチェック
curl http://localhost:9001/  # UI応答確認
curl http://localhost:8015/  # スケジューラー応答確認
```

**⚠️ 警告：個別のデプロイスクリプト（deploy-frontend-ec2.sh等）は使用しないでください**
理由：片方のコンテナだけを再起動してしまい、もう片方が停止する可能性があります。

#### デプロイの基本的な流れ

1.  **イメージのビルド**: ローカルで `docker build` を実行し、本番用のDockerイメージを作成します。
2.  **ECRへのプッシュ**: 作成したイメージをECRにプッシュします。
3.  **サーバーでの実行**: EC2サーバー上で、ECRから最新のイメージをプルし、`docker-compose` を使ってコンテナを起動します。

#### 手動デプロイ手順（詳細）

##### 1️⃣ ローカルでのイメージビルドとECRへのプッシュ
```bash
# フロントエンドのデプロイ
./deploy-frontend.sh

# スケジューラーAPIのデプロイ
./deploy-scheduler.sh
```

##### 2️⃣ EC2サーバーにSSH接続
```bash
# EC2サーバーに接続
ssh -i ~/watchme-key.pem ubuntu@3.24.16.82
```

##### 3️⃣ EC2サーバーでのコンテナ起動（手動実行の場合）
```bash
# ECRにログイン
aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin 754724220380.dkr.ecr.ap-southeast-2.amazonaws.com

# 最新イメージをプル
docker pull 754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-api-manager:latest
docker pull 754724220380.dkr.ecr.ap-southeast-2.amazonaws.com/watchme-api-manager-scheduler:latest

# 既存コンテナを停止・削除
docker stop watchme-api-manager-prod watchme-scheduler-prod || true
docker rm watchme-api-manager-prod watchme-scheduler-prod || true

# ⚠️ 重要：必ずdocker-compose.all.ymlを使用（両方のコンテナを起動）
cd /home/ubuntu/watchme-api-manager
docker-compose -f docker-compose.all.yml up -d

# 起動確認（両方表示されることを確認）
docker ps | grep -E "api-manager|scheduler"
```

#### デプロイスクリプトの機能

**deploy-frontend-ec2.sh** の主な機能：
- ECRから最新イメージを自動プル
- 既存コンテナの安全な停止・削除
- docker-compose.prod.ymlを使用した起動
- watchme-networkへの自動接続
- ヘルスチェックとステータス確認

**deploy-scheduler-ec2.sh** の主な機能：
- ECRから最新イメージを自動プル
- 必要なディレクトリとログ権限の設定
- 環境変数ファイル(.env)の確認
- watchme-networkへの自動接続
- config.json生成の案内とテストコマンドの提供
- cron設定の手動更新手順の提示

#### ⚠️ **デプロイ時の重要な注意点**

##### 1. **環境変数の設定** 
**問題**: `.env` ファイルが古いAPIキーを使用していると `Invalid API key` エラーが発生します。
```bash
# ❌ エラー例: 2025-08-08 15:00:03,045 - ERROR - whisper: 未処理ファイル取得エラー: {'message': 'Invalid API key'}

# ✅ 解決方法: 他のサービスと同じ最新のAPIキーを使用
grep SUPABASE_KEY /home/ubuntu/watchme-vault-api-docker/.env
# この値を /home/ubuntu/watchme-api-manager/.env にコピーする
```

##### 2. **🚨 コンテナ間通信の設定（最重要）**
**問題**: スケジューラーが他のAPIを呼び出せない場合、必ずこの問題です。
```bash
# ❌ エラー例: Failed to resolve 'vibe-transcriber-v2' 
# ❌ エラー例: Failed to resolve 'watchme-behavior-yamnet'

# ✅ 解決方法: 全てのコンテナをwatchme-networkに接続
# 必須の接続先コンテナ一覧:
docker network connect watchme-network vibe-transcriber-v2      # Azure Speech (旧Whisperの代替)
docker network connect watchme-network api_gen_prompt_mood_chart # 心理グラフ用  
docker network connect watchme-network api-gpt-v1               # 心理グラフ用
docker network connect watchme-network sed-api                    # 行動グラフ用
docker network connect watchme-network opensmile-api            # 感情グラフ用
```

##### 3. **正しいコンテナ名の確認方法**
**問題**: `watchme-behavior-yamnet` のような名前で接続しようとしてもコンテナが存在しません。
```bash
# ✅ 実際のコンテナ名を確認する方法:
docker ps --format "{{.Names}}" | grep -E "(api|watchme|vibe|mood|behavior|emotion)"

# 出力例:
# sed-api                 <- これが行動グラフAPI（ポート8004）
# opensmile-api            <- これが感情グラフAPI（ポート8011）
# vibe-transcriber-v2      <- これがAzure Speech API（ポート8013） ※Whisperは削除済み
```

##### 4. **動作確認方法**
```bash
# 1. ネットワーク接続テスト
docker exec watchme-scheduler-prod ping -c 1 vibe-transcriber-v2  # Azure Speech
docker exec watchme-scheduler-prod ping -c 1 sed-api  
docker exec watchme-scheduler-prod ping -c 1 opensmile-api

# 2. 手動実行テスト
# whisperは2025/09/02削除済み - Azure Speech (azure-transcriber)を使用
docker exec watchme-scheduler-prod python /app/run-api-process-docker.py azure-transcriber
docker exec watchme-scheduler-prod python /app/run-api-process-docker.py behavior-features

# 3. WebUI確認
curl https://api.hey-watch.me/manager/
curl https://api.hey-watch.me/scheduler/status/whisper
```

##### 5. **トラブルシューティングチェックリスト**
デプロイ後に問題が発生した場合、必ず以下を順番に確認してください：

```bash
# ✅ チェック1: コンテナが起動しているか？
docker ps | grep -E "watchme-scheduler|watchme-api-manager"

# ✅ チェック2: 環境変数は正しいか？
docker exec watchme-scheduler-prod env | grep SUPABASE_KEY

# ✅ チェック3: ネットワークに接続されているか？
docker network inspect watchme-network | grep -A 3 "watchme-scheduler-prod"

# ✅ チェック4: 対象APIコンテナは動作しているか？
docker ps | grep -E "api-transcriber|sed-api|opensmile-api"

# ✅ チェック5: pingは通るか？
docker exec watchme-scheduler-prod ping -c 1 vibe-transcriber-v2  # Azure Speech
```

#### 🤖 **自動化スクリプト**
毎回手動で設定するのを避けるため、以下のスクリプトをEC2サーバーで実行してください：

```bash
#!/bin/bash
# 全コンテナをwatchme-networkに接続するスクリプト
# ファイル名: /home/ubuntu/connect-all-containers.sh

echo "=== 全コンテナをwatchme-networkに接続中 ==="

# 必須コンテナ一覧
CONTAINERS=(
  "watchme-scheduler-prod"
  "watchme-api-manager-prod"
  "api-transcriber"
  "api_gen_prompt_mood_chart"
  "api-gpt-v1"
  "sed-api"
  "opensmile-api"
  "watchme-vault-api"
  "watchme-web-prod"
  "watchme-admin"
  "api-sed-aggregator"
)

for container in "${CONTAINERS[@]}"; do
  echo "接続中: $container"
  docker network connect watchme-network "$container" 2>/dev/null && echo "✅ $container" || echo "⚠️ $container (既に接続済みまたはエラー)"
done

echo ""
echo "=== 接続テスト ==="
echo "スケジューラーから主要APIへのpingテスト:"
docker exec watchme-scheduler-prod ping -c 1 vibe-transcriber-v2  # Azure Speech >/dev/null 2>&1 && echo "✅ api-transcriber" || echo "❌ api-transcriber"
docker exec watchme-scheduler-prod ping -c 1 sed-api >/dev/null 2>&1 && echo "✅ sed-api" || echo "❌ sed-api"
docker exec watchme-scheduler-prod ping -c 1 opensmile-api >/dev/null 2>&1 && echo "✅ opensmile-api" || echo "❌ opensmile-api"

echo ""
echo "=== 完了 ==="
```

**実行方法**:
```bash
# スクリプトを作成して実行権限を付与
chmod +x /home/ubuntu/connect-all-containers.sh
/home/ubuntu/connect-all-containers.sh
```

### サーバー設定 (Nginx / systemd) 【重要】

本アプリケーションを本番環境で正しく動作させるには、EC2サーバー側で **Nginx** によるルーティング設定と、**systemd** によるサービス管理設定が必要です。

**⚠️ systemd設定の重要な注意事項：**
- systemdサービス（`watchme-api-manager.service`）は必ず`docker-compose.all.yml`を参照するように設定されています
- これにより、サーバー再起動時にAPI ManagerとSchedulerの両方が自動起動されます
- **絶対に`docker-compose.prod.yml`に変更しないでください**（スケジューラーが起動しなくなります）

これらのサーバー設定は、このリポジトリでは管理していません。**サーバー設定に関する全ての情報と設定ファイルは、以下の専用リポジトリで一元管理されています。**

**サーバー設定リポジトリ:**
[**watchme-server-configs**](https://github.com/matsumotokaya/watchme-server-configs)

デプロイや、新しいAPIを追加する際は、必ず上記リポジトリの `README.md` を熟読し、サーバー全体の設計思想と運用ルールを理解した上で、適切な設定を行ってください。

---

## 更新履歴

| 日付 | バージョン | 内容 |
|------|-----------|------|
| 2025-09-07 | v1.5.3 | timeblock-analysisスケジューラー追加、dashboardテーブルのChatGPT分析自動化 |
| 2025-09-03 | v1.5.2 | Whisper API削除に伴うドキュメント更新、Azure Speechへの完全移行完了 |
| 2025-09-01 | v1.5.1 | ダッシュボード機能改善（device_id取得の簡素化、analysis_resultカラム説明追加） |
| 2025-09-01 | v1.5.0 | ダッシュボード機能追加、タイムブロック単位プロンプト生成実装 |
| 2025-08-26 | v1.4.0 | Azure Speech Service API統合改善 |
| 2025-08-25 | v1.3.0 | オーディオファイル管理機能実装 |
| 2025-08-22 | v1.2.3 | 環境変数の統一、全デバイス処理の修正 |
| 2025-08-21 | v1.2.0 | 全デバイス対応実装、UI大幅改善 |
| 2025-08-10 | v1.1.0 | スケジューラー完全実装、UUID標準化 |

---

## トラブルシューティング

アプリケーションの運用中に発生した問題や、その解決策については、以下のドキュメントを参照してください。

- **過去の障害事例:**
  - [**2025-08-08: スケジューラーのコンテナ間通信エラー**](./docs/incidents/2025-08-08-scheduler-network-fix.md)
    - `host.docker.internal` の名前解決に失敗し、スケジューラーがAPIを呼び出せなかった問題の調査と解決の記録です。
  - **2025-08-11: スケジューラー500エラーの解決**
    - UIから設定変更時の500エラーを、アーキテクチャ改善により解決しました。詳細は上記「スケジューラーの仕組み」を参照。
  - **2025-08-30: Azure Transcriberスケジューラー権限エラー**
    - ログファイルの権限エラーでスケジューラーが動作しない問題を解決。詳細な診断手順を「スケジューラーが動作しない問題の完全診断ガイド」に追加。

### デプロイ時によくある問題と対策

#### 0. 🚨 スケジューラーが起動しない（最頻出問題）
- **症状**: API Manager UIは動作するが、スケジューラーが動かない
- **原因**: 
  - `docker-compose.prod.yml`を使ってしまった（API Managerのみ起動）
  - `docker-compose.all.yml`のネットワーク設定が間違っている
- **診断方法**:
  ```bash
  # 両方のコンテナが起動しているか確認
  docker ps | grep -E "api-manager|scheduler"
  # watchme-scheduler-prodが表示されない場合は問題あり
  ```
- **解決策**:
  ```bash
  # 1. docker-compose.all.ymlのネットワーク設定を確認
  tail -5 /home/ubuntu/watchme-api-manager/docker-compose.all.yml
  # external: trueになっていることを確認（driver: bridgeはNG）
  
  # 2. 両方のコンテナを再起動
  cd /home/ubuntu/watchme-api-manager
  docker-compose -f docker-compose.all.yml down
  docker-compose -f docker-compose.all.yml up -d
  
  # 3. 確認
  docker ps | grep -E "api-manager|scheduler"
  ```

#### 1. エンドポイントの混同による404エラー
- **症状**: APIが404エラーを返す、または「Cannot GET /api/scheduler/api/scheduler/...」のような二重パスエラー
- **原因**: 3種類のエンドポイント（管理用、実行用、公開用）を混同している
- **解決策**: 
  - [エンドポイントの3層構造](#-エンドポイントの3層構造を理解する重要) を理解する
  - FastAPIは `/api/scheduler/` でリスンする必要がある（Nginxが `/scheduler/` → `/api/scheduler/` にプロキシするため）
  - 各APIの実行エンドポイントはコンテナ名を使用（例: `http://api-transcriber:8001/fetch-and-transcribe`）

#### 2. 🚨 コンテナ再作成後のネットワーク切断問題【重要・頻発】
- **症状**: 
  - スケジューラーから他のAPIを呼び出せない
  - エラーログに「コンテナ名 'http://api-transcriber:8001/...' が解決できません」と表示
  - 今まで動いていたスケジューラーが急に動作しなくなる
- **原因**: 
  - **APIのチューニングやデプロイでコンテナを再作成すると、watchme-networkへの接続が自動的に切断される**
  - Dockerコンテナの再作成時、ネットワーク接続は自動復元されない仕様
- **診断方法**:
  ```bash
  # 診断スクリプトを実行（このリポジトリに含まれています）
  ./diagnose-scheduler.sh
  
  # または手動で確認
  docker network inspect watchme-network | grep "api-transcriber"
  ```
- **解決策**: 
  ```bash
  # 切断されたコンテナを再接続（例：Whisper APIの場合）
  docker network connect watchme-network api-transcriber
  
  # 全APIコンテナを一括で再接続するスクリプト
  for container in api-transcriber api-gpt-v1 api_gen_prompt_mood_chart \
                   sed-api api-sed-aggregator \
                   opensmile-api opensmile-aggregator; do
    docker network connect watchme-network $container 2>/dev/null && \
      echo "✅ $container 接続完了" || echo "⚠️ $container 既に接続済み"
  done
  ```
- **予防策**:
  - コンテナ再作成後は必ず `docker network connect` を実行
  - デプロイスクリプトに自動接続処理を追加することを推奨

#### 3. 🚨 スケジューラーが動作しない問題の完全診断ガイド【2025-08-30追加】

スケジューラーが動作しない場合、以下の手順で**必ず**順番に診断してください。

##### 症状の例
- UIで「最終処理」が更新されない
- 特定のAPIだけスケジュール実行されない
- cronは実行されているがAPIが処理されない

##### ステップ1: cronと全く同じコマンドを手動実行（最重要）
```bash
# SSHでEC2サーバーに接続
ssh -i ~/watchme-key.pem ubuntu@3.24.16.82

# cronが実行するのと全く同じコマンドを手動で実行
# これが最も確実な検証方法です
python3 /home/ubuntu/scheduler/run_if_enabled.py [API名] >> /var/log/scheduler/cron.log 2>&1

# 例：Azure Transcriberの場合
python3 /home/ubuntu/scheduler/run_if_enabled.py azure-transcriber >> /var/log/scheduler/cron.log 2>&1
```

##### ステップ2: エラーメッセージを確認
```bash
# cron.logでエラーを確認
tail -50 /var/log/scheduler/cron.log | grep -A 5 -B 5 [API名]

# よくあるエラー：Permission denied
# PermissionError: [Errno 13] Permission denied: '/var/log/scheduler/scheduler-[API名].log'
```

##### ステップ3: ログファイルの権限を確認・修正
```bash
# ログファイルの権限を確認
ls -la /var/log/scheduler/scheduler-*.log

# 正常なファイル: -rw-rw-r-- (664) ubuntu:ubuntu
# 問題のファイル: -rw-r--r-- (644) または root:root

# 権限を修正
sudo chown ubuntu:ubuntu /var/log/scheduler/scheduler-[API名].log
sudo chmod 664 /var/log/scheduler/scheduler-[API名].log
```

##### ステップ4: watchme-networkへの接続を確認
```bash
# ネットワーク診断スクリプトを実行
bash /home/ubuntu/watchme-server-configs/scripts/check-infrastructure.sh

# 特定のコンテナの接続を確認
docker network inspect watchme-network | grep -A 5 [コンテナ名]

# スケジューラーから対象APIへの疎通確認
docker exec watchme-scheduler-prod ping -c 1 [コンテナ名]
```

##### ステップ5: config.jsonの設定を確認
```bash
# APIが有効になっているか確認
cat /home/ubuntu/scheduler/config.json | jq '.apis["[API名]"]'

# enabledがtrueであることを確認
```

##### ステップ6: 手動でAPI処理を実行
```bash
# Dockerコンテナから直接実行してAPIが動作するか確認
docker exec watchme-scheduler-prod python /app/run-api-process-docker.py [API名] --date $(date +%Y-%m-%d)
```

##### 実際の事例：Azure Transcriber（2025-08-30）

**問題**: Azure Transcriberのスケジューラーが動作しない
- cronは毎時10分に実行されている（syslogで確認）
- しかし処理が実行されていない

**原因**: ログファイルの権限エラー
- `/var/log/scheduler/scheduler-azure-transcriber.log` が644（読み取り専用）
- ubuntuユーザーが書き込めないため、run_if_enabled.pyがクラッシュ

**解決方法**:
```bash
# 権限を修正
sudo chown ubuntu:ubuntu /var/log/scheduler/scheduler-azure-transcriber.log
sudo chmod 664 /var/log/scheduler/scheduler-azure-transcriber.log

# 動作確認（cronと同じコマンドを実行）
python3 /home/ubuntu/scheduler/run_if_enabled.py azure-transcriber >> /var/log/scheduler/cron.log 2>&1
```

##### チェックリスト（新しいAPIを追加した場合）

- [ ] ログファイルが自動作成され、権限が664になっているか
- [ ] config.jsonにAPIが登録され、enabledがtrueか
- [ ] watchme-networkにコンテナが接続されているか
- [ ] cron設定ファイルにAPIが追加されているか
- [ ] フロントエンドのスケジュール表示設定が追加されているか

##### 便利な診断コマンド集

```bash
# 🔍 総合診断（これ1つで基本的な問題を発見）
echo "=== スケジューラー総合診断 ===" && \
echo "1. 有効なAPI:" && cat /home/ubuntu/scheduler/config.json | jq -r '.apis | to_entries[] | select(.value.enabled == true) | .key' && \
echo "2. ログファイル権限:" && ls -la /var/log/scheduler/*.log | grep -v "rw-rw-r--" && \
echo "3. 最近のエラー:" && tail -100 /var/log/scheduler/cron.log | grep -i error | tail -5 && \
echo "4. ネットワーク接続状態:" && bash /home/ubuntu/watchme-server-configs/scripts/check-infrastructure.sh | grep -E "SUCCESS|ERROR"

# 📊 特定APIの完全診断
API_NAME="azure-transcriber"  # 診断したいAPI名に変更
echo "=== $API_NAME 診断 ===" && \
echo "設定:" && cat /home/ubuntu/scheduler/config.json | jq ".apis[\"$API_NAME\"]" && \
echo "ログ権限:" && ls -la /var/log/scheduler/scheduler-$API_NAME.log && \
echo "最終実行:" && tail -3 /var/log/scheduler/scheduler-$API_NAME.log && \
echo "cron実行:" && grep $API_NAME /etc/cron.d/watchme-scheduler && \
echo "即座に実行テスト:" && python3 /home/ubuntu/scheduler/run_if_enabled.py $API_NAME

# 🔧 全ログファイルの権限を一括修正
for log in /var/log/scheduler/scheduler-*.log; do
  sudo chown ubuntu:ubuntu "$log"
  sudo chmod 664 "$log"
done
echo "全ログファイルの権限を修正しました"

# 🌐 全APIコンテナのネットワーク接続を一括確認・修正
for container in api-transcriber vibe-transcriber-v2 api-gpt-v1 api_gen_prompt_mood_chart \
                 sed-api api-sed-aggregator \
                 opensmile-api opensmile-aggregator; do
  if docker ps --format "{{.Names}}" | grep -q "^$container$"; then
    docker network connect watchme-network $container 2>/dev/null && \
      echo "✅ $container を接続" || echo "⚠️ $container は既に接続済み"
  else
    echo "❌ $container コンテナが存在しません"
  fi
done

# 📈 スケジューラーの実行履歴を確認
echo "=== 過去1時間のスケジューラー実行履歴 ===" && \
for api in whisper azure-transcriber behavior-features vibe-aggregator behavior-aggregator emotion-features emotion-aggregator vibe-scorer; do
  count=$(grep -c "^$(date -u '+%Y-%m-%d %H').*$api.*実行成功" /var/log/scheduler/cron.log 2>/dev/null || echo 0)
  echo "$api: $count 回成功"
done
```

##### よくある落とし穴と対策

1. **ログファイルがrootユーザーで作成される問題**
   - 原因: 初回実行時にsudoを使用したり、手動でファイルを作成
   - 対策: 必ずubuntuユーザーで実行、権限は664に統一

2. **「動いているはず」の思い込み**
   - 原因: UIの表示だけ見て判断
   - 対策: 必ずcronと同じコマンドを手動実行して検証

3. **ネットワーク接続の見落とし**
   - 原因: コンテナ再作成時にwatchme-networkから切断
   - 対策: デプロイ後は必ずcheck-infrastructure.shを実行

4. **config.jsonの不整合**
   - 原因: UIから設定変更したが反映されていない
   - 対策: cat /home/ubuntu/scheduler/config.json で直接確認

#### 4. 環境変数の設定漏れ
- **症状**: API接続エラーやSupabase認証エラー
- **原因**: `.env` ファイルが存在しないか、必要な変数が不足
- **解決策**: 
  - EC2サーバーで `.env` ファイルを作成
  - 他のサービスの `.env` ファイルを参考に必要な値を設定

#### 4. Nginxルーティングの確認
- **症状**: ブラウザからAPIエンドポイントにアクセスできない
- **確認方法**: 
  ```bash
  # Nginx設定の確認
  sudo cat /etc/nginx/sites-available/api.hey-watch.me | grep -A 5 "location"
  ```

#### 5. スケジューラー設定の問題
- **症状**: UIから設定を変更しても500エラーが発生する
- **原因**: Dockerコンテナからホストのcronファイルへの書き込み権限がない
- **解決策**: 2025-08-11のアーキテクチャ改善で解決済み。cron設定は手動管理に変更。

#### 6. スケジュール実行されない
- **症状**: APIが自動実行されない
- **確認方法**:
  ```bash
  # cron設定の確認
  cat /etc/cron.d/watchme-scheduler
  
  # config.jsonの確認
  cat /home/ubuntu/scheduler/config.json
  
  # 実行ログの確認
  tail -f /var/log/scheduler/scheduler-[API名].log
  ```
- **解決策**: 
  - cron設定が正しいか確認
  - run_if_enabled.pyが実行可能か確認
  - config.jsonでAPIが有効になっているか確認

### 🔍 エンドポイントの3層構造を理解する（重要）

WatchMeシステムには**3種類の異なるエンドポイント**が存在し、それぞれ異なる役割を持っています。混同しないよう注意してください。

#### 1️⃣ **スケジューラーAPI管理エンドポイント**
- **用途**: API Managerのフロントエンドがスケジューラーの設定（ON/OFF、間隔等）を管理
- **例**: `https://api.hey-watch.me/scheduler/status/whisper`
- **内部パス**: FastAPIは `/api/scheduler/status/{api_name}` でリスン
- **Nginxルーティング**: `/scheduler/` → `http://localhost:8015/api/scheduler/`
- **定義場所**: `scheduler-api-server.py`

#### 2️⃣ **各APIサービスの実行エンドポイント**
- **用途**: スケジューラーが各APIを実際に実行する際に呼び出す
- **例**: whisperなら `/fetch-and-transcribe`
- **接続先**: `http://api-transcriber:8001/fetch-and-transcribe`（コンテナ間通信）
- **定義場所**: `scheduler/run-api-process-docker.py` の `API_CONFIGS` 辞書
- **注意**: コンテナ名を使用（localhostではない）

#### 3️⃣ **Nginx公開エンドポイント**
- **用途**: 外部（ブラウザ等）からAPIに直接アクセスする際のパス
- **例**: `https://api.hey-watch.me/vibe-transcriber/`
- **Nginxルーティング**: `/vibe-transcriber/` → `http://api-transcriber:8001/`
- **定義場所**: Nginxサーバー設定（watchme-server-configs リポジトリ）

#### 📊 エンドポイント相関図

```
[ブラウザ] 
    ↓ ① スケジューラー設定を変更
    https://api.hey-watch.me/scheduler/toggle/whisper
    ↓
[Nginx] → [scheduler-api-server:8015/api/scheduler/toggle/whisper]
    ↓ config.json更新
    ↓
[cron] → [run_if_enabled.py] 
    ↓ ② 定期実行時にAPIを呼び出し
    ↓
[run-api-process-docker.py]
    ↓ http://api-transcriber:8001/fetch-and-transcribe
    ↓
[api-transcriber コンテナ] ← 実際の処理
```

### 今後の実装・デプロイに向けた推奨事項

1. **🚨 エンドポイント設定の確認（最重要）**
   - 新しいAPIを追加する際は、必ず上記の「コンテナ名とAPI対応表」を更新
   - `run-api-process-docker.py`と手動実行用のAPIクライアントのエンドポイントを一致させる
   - **4つのファイルを必ず同期させる:**
     - `/scheduler/run-api-process-docker.py` (Docker環境用) - ②のエンドポイント
     - `/run-api-process.py` (ローカル環境用) - ②のエンドポイント
     - `/src/services/*ApiClient.js` (フロントエンド用) - ①のエンドポイント
     - Nginx設定 (watchme-server-configs) - ③のエンドポイント

2. **デプロイスクリプトの活用**
   - `deploy-frontend.sh` と `deploy-scheduler.sh` を使用してECRへのプッシュを自動化
   - EC2サーバー側の手順もスクリプト化することを推奨

3. **ネットワーク設定の標準化**（2025年8月28日更新）
   - 新しいコンテナは必ず `watchme-network` に接続
   - `docker-compose.yml` に `networks` セクションを明記：
     ```yaml
     networks:
       watchme-network:
         external: true  # 必須！driver: bridgeは使用しない
     ```
   - **コンテナ名の命名規則:** ハイフン区切りで統一（例: `api-transcriber`、`opensmile-api`）

4. **ヘルスチェックの実装**
   - 各APIにヘルスチェックエンドポイントを実装
   - docker-composeでヘルスチェックを設定

5. **ログ監視**
   - `docker logs` コマンドで定期的にログを確認
   - スケジューラーのログは `/var/log/scheduler/` に保存される

6. **エンドポイントのテスト方法**
   ```bash
   # Docker環境でのテスト（EC2サーバー上で実行）
   docker exec watchme-scheduler-prod python /app/run-api-process-docker.py [API名]
   
   # 例：emotion-aggregatorのテスト
   docker exec watchme-scheduler-prod python /app/run-api-process-docker.py emotion-aggregator
   ```

### 🆕 スケジューラーに新しいAPIを追加する詳細手順（2025年9月7日追加）

#### ⚠️ 今回の実装で判明した重要な注意点

スケジューラーにAPIを追加する際、見落としやすい重要な手順があります：

1. **🔴 Dockerコンテナ内のスクリプト更新を忘れずに！**
   ```bash
   # ホスト側のスクリプトを更新した後、必ずコンテナ内も更新
   docker cp /home/ubuntu/scheduler/run-api-process-docker.py \
             watchme-scheduler-prod:/app/run-api-process-docker.py
   ```
   これを忘れると「未対応のAPI」エラーが発生します。

2. **🔴 cronサービスの再起動が必要**
   ```bash
   # /etc/cron.d/watchme-scheduler を編集した後
   sudo systemctl restart cron
   ```
   これを忘れるとスケジュールが反映されません。

3. **🔴 ログファイルの権限設定**
   ```bash
   sudo touch /var/log/scheduler/scheduler-[API名].log
   sudo chown ubuntu:ubuntu /var/log/scheduler/scheduler-[API名].log
   sudo chmod 664 /var/log/scheduler/scheduler-[API名].log
   ```
   権限が不適切だとPermission deniedエラーが発生します。

#### 実装手順の詳細

1. **run-api-process-docker.pyへのAPI設定追加**
   - API_CONFIGS辞書に新しいAPIを追加
   - 処理タイプを選択：`file_based`、`device_based`、または独自タイプ
   - 必要に応じてカスタム処理関数を実装

2. **EC2サーバーでの設定**
   ```bash
   # スクリプトのバックアップと更新
   cp /home/ubuntu/scheduler/run-api-process-docker.py \
      /home/ubuntu/scheduler/run-api-process-docker.py.backup.$(date +%Y%m%d_%H%M%S)
   
   # GitHubから最新版を取得（またはローカルから転送）
   scp -i ~/watchme-key.pem /path/to/local/run-api-process-docker.py \
       ubuntu@3.24.16.82:/home/ubuntu/scheduler/
   
   # Dockerコンテナ内も更新（重要！）
   docker cp /home/ubuntu/scheduler/run-api-process-docker.py \
             watchme-scheduler-prod:/app/run-api-process-docker.py
   ```

3. **cron設定の追加**
   ```bash
   # /etc/cron.d/watchme-scheduler に追加
   # 実行時刻は他のAPIとの依存関係を考慮
   # 10分: データ収集 → 20分: 初期処理 → 30分: 集計 → 40分: 分析
   40 * * * * ubuntu python3 /home/ubuntu/scheduler/run_if_enabled.py [API名] >> /var/log/scheduler/cron.log 2>&1
   
   # 必ずcronを再起動
   sudo systemctl restart cron
   ```

4. **config.jsonへの設定追加**
   ```bash
   cat /home/ubuntu/scheduler/config.json | \
   jq '.apis["[API名]"] = {"enabled": false, "timeout": 120, "batchLimit": 50}' \
   > /tmp/config.json && mv /tmp/config.json /home/ubuntu/scheduler/config.json
   ```

5. **動作テスト**
   ```bash
   # まずDockerコンテナから直接テスト
   docker exec watchme-scheduler-prod python /app/run-api-process-docker.py [API名]
   
   # 成功したらrun_if_enabled.py経由でテスト
   python3 /home/ubuntu/scheduler/run_if_enabled.py [API名]
   ```

6. **本番稼働**
   ```bash
   # config.jsonでenabledをtrueに設定
   cat /home/ubuntu/scheduler/config.json | \
   jq '.apis["[API名]"].enabled = true' > /tmp/config.json && \
   mv /tmp/config.json /home/ubuntu/scheduler/config.json
   ```