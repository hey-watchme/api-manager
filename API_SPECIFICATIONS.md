# API仕様書 - WatchMe API Manager

## 概要

このドキュメントは、API Managerが管理する各マイクロサービスAPIの仕様を定義します。

## API カテゴリ

### 1. 心理グラフAPI (Psychology Graph APIs)

心理状態を分析・可視化するためのAPI群です。

#### 1.1 音声書き起こしAPI (Transcriber API)
- **エンドポイント**: `/api/psychology/transcribe`
- **メソッド**: POST
- **機能**: 音声ファイルをテキストに変換
- **パラメータ**:
  ```json
  {
    "device_id": "UUID",
    "date": "YYYY-MM-DD",
    "file_paths": ["path1", "path2"],
    "model": "whisper-1"
  }
  ```
- **レスポンス**:
  ```json
  {
    "status": "success",
    "transcriptions": [
      {
        "file_path": "path1",
        "text": "transcribed text",
        "timestamp": "2024-01-01T12:00:00Z"
      }
    ]
  }
  ```

#### 1.2 プロンプト生成API (Prompt Aggregator API)
- **エンドポイント**: `/api/psychology/aggregate`
- **メソッド**: POST
- **機能**: 心理分析用のプロンプトを生成
- **パラメータ**:
  ```json
  {
    "device_id": "UUID",
    "date": "YYYY-MM-DD",
    "transcription_data": ["text1", "text2"]
  }
  ```
- **レスポンス**:
  ```json
  {
    "status": "success",
    "prompts": [
      {
        "type": "emotion_analysis",
        "prompt": "generated prompt text"
      }
    ]
  }
  ```

#### 1.3 スコアリングAPI (Scorer API)
- **エンドポイント**: `/api/psychology/score`
- **メソッド**: POST
- **機能**: 心理状態のスコアを算出
- **パラメータ**:
  ```json
  {
    "device_id": "UUID",
    "date": "YYYY-MM-DD",
    "analysis_data": {
      "prompts": [],
      "responses": []
    }
  }
  ```
- **レスポンス**:
  ```json
  {
    "status": "success",
    "scores": {
      "mental_health": 85,
      "stress_level": 30,
      "mood_score": 75
    }
  }
  ```

### 2. 行動グラフAPI (Behavior Graph APIs)

行動パターンを分析・可視化するためのAPI群です。

#### 2.1 行動特徴抽出API (Behavior Features API)
- **エンドポイント**: `/api/behavior/extract`
- **メソッド**: POST
- **機能**: 行動データから特徴を抽出
- **パラメータ**:
  ```json
  {
    "device_id": "UUID",
    "date": "YYYY-MM-DD",
    "activity_data": {
      "steps": 10000,
      "active_minutes": 120,
      "location_changes": 5
    }
  }
  ```
- **レスポンス**:
  ```json
  {
    "status": "success",
    "features": {
      "activity_level": "high",
      "movement_pattern": "regular",
      "behavioral_score": 80
    }
  }
  ```

#### 2.2 行動分析API (Behavior Analyzer API)
- **エンドポイント**: `/api/behavior/analyze`
- **メソッド**: POST
- **機能**: 抽出された特徴を分析
- **パラメータ**:
  ```json
  {
    "device_id": "UUID",
    "date_range": {
      "start": "YYYY-MM-DD",
      "end": "YYYY-MM-DD"
    },
    "features": []
  }
  ```
- **レスポンス**:
  ```json
  {
    "status": "success",
    "analysis": {
      "trend": "improving",
      "patterns": ["consistent_exercise", "regular_sleep"],
      "recommendations": []
    }
  }
  ```

### 3. 感情グラフAPI (Emotion Graph APIs)

感情の変化を分析・可視化するためのAPI群です。

#### 3.1 感情特徴抽出API (Emotion Features API)
- **エンドポイント**: `/api/emotion/extract`
- **メソッド**: POST
- **機能**: 音声・テキストから感情特徴を抽出
- **パラメータ**:
  ```json
  {
    "device_id": "UUID",
    "date": "YYYY-MM-DD",
    "input_data": {
      "audio_features": {},
      "text_content": ""
    }
  }
  ```
- **レスポンス**:
  ```json
  {
    "status": "success",
    "features": {
      "valence": 0.7,
      "arousal": 0.5,
      "emotions": {
        "joy": 0.8,
        "sadness": 0.1,
        "anger": 0.1
      }
    }
  }
  ```

#### 3.2 感情分析API (Emotion Analyzer API)
- **エンドポイント**: `/api/emotion/analyze`
- **メソッド**: POST
- **機能**: 感情の時系列変化を分析
- **パラメータ**:
  ```json
  {
    "device_id": "UUID",
    "date_range": {
      "start": "YYYY-MM-DD",
      "end": "YYYY-MM-DD"
    },
    "emotion_data": []
  }
  ```
- **レスポンス**:
  ```json
  {
    "status": "success",
    "analysis": {
      "emotional_stability": 75,
      "dominant_emotions": ["joy", "contentment"],
      "emotional_trends": {
        "7_day": "stable",
        "30_day": "improving"
      }
    }
  }
  ```

## 共通仕様

### 認証
すべてのAPIは以下のヘッダーを必要とします：
```
Authorization: Bearer <token>
X-API-Key: <api-key>
```

### エラーレスポンス
```json
{
  "status": "error",
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {}
  }
}
```

### レート制限
- 1分あたり60リクエスト
- 1時間あたり1000リクエスト

### タイムアウト
- デフォルト: 30秒
- 音声処理API: 60秒
- バッチ処理API: 300秒

## スケジューラー仕様

### スケジュール設定
```json
{
  "api_type": "psychology_transcriber",
  "schedule": {
    "type": "daily|weekly|monthly",
    "time": "HH:MM",
    "days": [1, 3, 5],  // 週次の場合
    "date": 15          // 月次の場合
  },
  "parameters": {
    // API固有のパラメータ
  },
  "notifications": {
    "on_success": true,
    "on_failure": true,
    "email": "user@example.com"
  }
}
```

### スケジュール実行履歴
```json
{
  "schedule_id": "UUID",
  "execution_time": "2024-01-01T12:00:00Z",
  "status": "success|failure",
  "duration_ms": 1234,
  "result": {
    // API実行結果
  },
  "error": null
}
```

## データ保存仕様

### 実行履歴の保存
- 保存期間: 90日間
- 保存形式: JSON
- 保存場所: ローカルストレージ + バックエンドDB

### キャッシュ仕様
- APIレスポンス: 5分間キャッシュ
- 静的データ: 24時間キャッシュ
- キャッシュ無効化: 手動リフレッシュ可能

## 開発環境での使用

### モックサーバー
開発時は以下のモックエンドポイントを使用：
```
http://localhost:3001/mock/api/*
```

### テストデータ
`/test-data/`ディレクトリに各APIのテストデータを配置

## バージョニング

### APIバージョン
- 現在のバージョン: v1
- バージョン指定: URLパス（例: `/api/v1/psychology/transcribe`）

### 後方互換性
- マイナーバージョン: 後方互換性を維持
- メジャーバージョン: 破壊的変更を含む可能性

## サポート

### ドキュメント
- API仕様の詳細: 各APIのREADME.mdを参照
- 統合ガイド: INTEGRATION_GUIDE.mdを参照

### 問い合わせ
- 技術サポート: support@watchme.example.com
- バグ報告: GitHub Issues