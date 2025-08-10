"""
スケジューラー設定ファイル
デバイスIDなどの共通設定を管理
"""

# デフォルトデバイスID
# 全てのテスト、デフォルト値で使用される統一ID
# 正式なUUID v4形式を使用
DEFAULT_DEVICE_ID = '9f7d6e27-98c3-4c19-bdfb-f7fda58b9a93'

# デバイスベースAPIの設定
DEVICE_BASED_API_CONFIG = {
    'default_device_id': DEFAULT_DEVICE_ID,
    'default_process_date': 'today',  # 特別な値として'today'を使用
}

# APIエンドポイント設定
API_ENDPOINTS = {
    'whisper': '/fetch-and-transcribe',
    'vibe-aggregator': '/generate-mood-prompt-supabase',
    'vibe-scorer': '/analyze-vibegraph-supabase',
    'behavior-features': '/fetch-and-process-paths',
    'behavior-aggregator': '/analysis/sed',
    'emotion-features': '/process/emotion-features',
    'emotion-aggregator': '/analyze/batch',
}