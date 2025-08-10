/**
 * 共通定数設定ファイル
 * プロジェクト全体で使用する定数を一元管理
 */

// デフォルトデバイスID
// このIDは全てのテスト、デフォルト値、プレースホルダーで使用されます
// 正式なUUID v4形式を使用
export const DEFAULT_DEVICE_ID = '9f7d6e27-98c3-4c19-bdfb-f7fda58b9a93';

// デバイスID関連の設定
export const DEVICE_CONFIG = {
  defaultId: DEFAULT_DEVICE_ID,
  placeholder: `例: ${DEFAULT_DEVICE_ID}`,
  testId: DEFAULT_DEVICE_ID,
};

// APIエンドポイント設定
export const API_ENDPOINTS = {
  whisper: '/fetch-and-transcribe',
  vibeAggregator: '/generate-mood-prompt-supabase',
  vibeScorer: '/analyze-vibegraph-supabase',
  behaviorFeatures: '/fetch-and-process-paths',
  behaviorAggregator: '/analysis/sed',
  emotionFeatures: '/process/emotion-features',
  emotionAggregator: '/analyze/batch',
};