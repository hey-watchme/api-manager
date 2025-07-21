# API Manager 実装計画書

## 概要

このドキュメントは、WatchMe API Managerの実装計画と技術的詳細を定義します。旧管理画面の機能を維持しながら、保守性と拡張性を大幅に向上させた新しいアーキテクチャで実装します。

## プロジェクト目標

1. **保守性の向上**: モジュール分離型アーキテクチャによる明確な責任分離
2. **拡張性の確保**: 新しいAPIの追加が容易な設計
3. **機能の維持**: 旧管理画面のすべての機能を継承
4. **開発効率**: 統一されたパターンによる開発時間の短縮

## 実装フェーズ

### Phase 1: プロジェクト基盤構築（3日間）

#### 1.1 プロジェクト初期化
- [ ] package.jsonの作成（React + Vite + Express）
- [ ] 基本的な設定ファイル（vite.config.js、tailwind.config.js）
- [ ] Expressサーバーのセットアップ
- [ ] プロキシ設定（本番APIへの接続）

#### 1.2 基本ディレクトリ構造
```
api-manager/
├── src/
│   ├── components/
│   │   ├── common/
│   │   ├── api/
│   │   └── scheduler/
│   ├── modules/
│   │   ├── psychology/
│   │   ├── behavior/
│   │   └── emotion/
│   ├── pages/
│   ├── services/
│   └── utils/
├── server/
│   ├── routes/
│   └── middleware/
└── public/
```

#### 1.3 共通基盤の実装
- [ ] APIクライアント基底クラス
- [ ] 共通UIコンポーネント（Button、Card、Input、Loading）
- [ ] エラーハンドリングユーティリティ
- [ ] 通知システム

### Phase 2: 心理グラフモジュール実装（5日間）

#### 2.1 Vibe Transcriberモジュール
```javascript
// modules/psychology/transcriber/
├── TranscriberModule.jsx      // メインコンテナ
├── TranscriberForm.jsx         // パラメータ入力フォーム
├── TranscriberResults.jsx      // 結果表示
├── TranscriberScheduler.jsx    // スケジューラー設定
└── transcriber.service.js      // APIクライアント
```

**主要機能**:
- file_pathsベースの音声文字起こし処理
- リアルタイムAPIステータス表示
- 自動スケジューラー（3時間毎、過去24時間分処理）
- 実行履歴管理

#### 2.2 Vibe Aggregatorモジュール
- プロンプト生成機能
- 自動スケジューラー（当日48スロット処理）
- リアルタイム更新対応

#### 2.3 Vibe Scorerモジュール
- ChatGPT連携によるスコアリング
- 結果の可視化（Chart.js）
- バッチ処理対応

### Phase 3: 行動グラフモジュール実装（3日間）

#### 3.1 SED音響イベント検出モジュール
- Whisper APIパターン準拠の実装
- file_pathsベースの処理
- behavior_features_statusの管理

#### 3.2 SED Aggregatorモジュール
- 行動パターンの分析と集計
- 時系列データの可視化

### Phase 4: 感情グラフモジュール実装（3日間）

#### 4.1 OpenSMILE特徴抽出モジュール
- 音声感情特徴の抽出
- emotion_features_statusの管理
- eGeMAPSv02特徴セット対応

#### 4.2 OpenSMILE Aggregatorモジュール
- 感情の時系列分析
- 感情推移の可視化

### Phase 5: 統合とテスト（3日間）

#### 5.1 統合機能
- [ ] ダッシュボード画面
- [ ] グローバルナビゲーション
- [ ] 統一されたスケジューラー管理画面
- [ ] 実行履歴の統合ビュー

#### 5.2 テスト
- [ ] ユニットテスト（各モジュール）
- [ ] 統合テスト（API連携）
- [ ] E2Eテスト（主要なユーザーフロー）

### Phase 6: デプロイメント準備（2日間）

#### 6.1 ビルド最適化
- [ ] コード分割の実装
- [ ] 静的アセットの最適化
- [ ] キャッシング戦略

#### 6.2 デプロイメント設定
- [ ] Docker設定
- [ ] CI/CDパイプライン設定
- [ ] 本番環境設定

## 技術的詳細

### 統一されたAPIクライアントパターン

```javascript
// 基底クラス
class BaseApiClient {
  constructor(config) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout || 30000;
    this.statusCheckInterval = null;
  }

  async checkStatus() {
    try {
      const response = await axios.get(`${this.baseURL}/health`);
      return response.status === 200;
    } catch {
      return false;
    }
  }

  startStatusMonitoring(callback, interval = 30000) {
    this.statusCheckInterval = setInterval(async () => {
      const isOnline = await this.checkStatus();
      callback(isOnline);
    }, interval);
  }

  stopStatusMonitoring() {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
    }
  }
}

// 個別実装例
class TranscriberApiClient extends BaseApiClient {
  constructor() {
    super({
      baseURL: 'https://api.hey-watch.me/vibe-transcriber',
      timeout: 60000
    });
  }

  async transcribe(filePaths, model = 'base') {
    const response = await axios.post(
      `${this.baseURL}/fetch-and-transcribe`,
      { file_paths: filePaths, model },
      { timeout: this.timeout }
    );
    return response.data;
  }
}
```

### 統一されたスケジューラーパターン

```javascript
// スケジューラー管理クラス
class SchedulerManager {
  constructor(apiName, config) {
    this.apiName = apiName;
    this.config = config;
    this.isRunning = false;
  }

  async start() {
    const response = await axios.post(`/api/${this.apiName}-scheduler/start`);
    this.isRunning = response.data.status === 'running';
    return this.isRunning;
  }

  async stop() {
    const response = await axios.post(`/api/${this.apiName}-scheduler/stop`);
    this.isRunning = false;
    return response.data;
  }

  async getStatus() {
    const response = await axios.get(`/api/${this.apiName}-scheduler/status`);
    this.isRunning = response.data.status === 'running';
    return response.data;
  }

  async runNow() {
    const response = await axios.post(`/api/${this.apiName}-scheduler/run-now`);
    return response.data;
  }
}
```

### 統一されたUIコンポーネントパターン

```jsx
// APIモジュールの基本構造
const ApiModule = ({ apiConfig }) => {
  const [status, setStatus] = useState('offline');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [scheduler, setScheduler] = useState(null);

  useEffect(() => {
    // APIステータス監視の開始
    apiClient.startStatusMonitoring(setStatus);
    
    // スケジューラー状態の取得
    schedulerManager.getStatus().then(setScheduler);

    return () => {
      apiClient.stopStatusMonitoring();
    };
  }, []);

  return (
    <div className="space-y-6">
      <ApiStatusCard status={status} />
      <ParameterForm onSubmit={handleSubmit} />
      <SchedulerControl 
        scheduler={scheduler}
        onToggle={handleSchedulerToggle}
        onRunNow={handleRunNow}
      />
      <ResultsDisplay results={results} />
    </div>
  );
};
```

## 重要な設計決定

### 1. file_pathsベースの処理
すべての音声処理APIは、device_id/dateではなくfile_pathsを直接受け取る方式に統一。これにより：
- APIの責務が明確化（ファイル処理のみに専念）
- 管理画面側で柔軟な処理対象選択が可能
- エラーハンドリングが簡潔に

### 2. リアルタイムステータス監視
各APIモジュールは30秒間隔でAPIの稼働状況を監視：
- ✅ 稼働中: 緑色のインジケータ
- ❌ オフライン: 赤色のインジケータ
- ユーザーは常にAPIの状態を把握可能

### 3. 統一されたスケジューラー
すべてのスケジューラーは同じインターフェースを実装：
- start/stop/status/run-nowの4エンドポイント
- 3時間毎の自動実行（0,3,6,9,12,15,18,21時）
- 過去24時間分（48スロット）の処理

### 4. Supabaseとの連携
- audio_filesテーブルのステータス管理
- 処理結果の保存
- 実行履歴の記録

## リスク管理

### 技術的リスク
1. **API互換性**: 本番APIとの互換性を常に確認
2. **パフォーマンス**: 大量データ処理時の最適化
3. **エラーハンドリング**: ネットワークエラーやタイムアウトの適切な処理

### 対策
1. **段階的リリース**: モジュール単位でのリリース
2. **ロールバック計画**: 各フェーズでのロールバック手順の準備
3. **モニタリング**: エラーログとパフォーマンスメトリクスの監視

## 成功指標

1. **コード品質**
   - モジュール間の依存関係ゼロ
   - 単体テストカバレッジ80%以上
   - ESLintエラーゼロ

2. **パフォーマンス**
   - 初期ロード時間3秒以内
   - API応答時間の95パーセンタイル5秒以内

3. **保守性**
   - 新規APIモジュール追加時間: 2時間以内
   - バグ修正時間: 平均1時間以内

## まとめ

この実装計画に従うことで、保守性が高く拡張可能なAPI Manager を約20日間で構築できます。旧管理画面の全機能を継承しながら、アーキテクチャの問題を解決し、将来的な拡張にも対応できる設計となっています。