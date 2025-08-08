#!/usr/bin/env python3
"""
API自動処理実行スクリプト（Dockerコンテナ用）
指定されたAPIの自動処理を実行
"""

import sys
import requests
import json
import logging
from datetime import datetime
from supabase import create_client, Client
import os

# ログ設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 環境変数からSupabase設定取得
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

# API設定
# 注意: Dockerコンテナ間通信では、コンテナ名を使用する
# watchme-networkで接続されたコンテナは、コンテナ名で通信可能
API_CONFIGS = {
    "whisper": {
        "endpoint": "http://api-transcriber:8001/fetch-and-transcribe",
        "status_column": "transcriptions_status",
        "model": "base",
        "display_name": "Whisper Transcriber"
    },
    # 他のAPIは後で追加
}

def get_supabase_client() -> Client:
    """Supabaseクライアント取得"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("Supabase設定が見つかりません")
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def get_pending_files(api_name: str, limit: int = 100) -> list:
    """未処理ファイル取得"""
    try:
        if api_name not in API_CONFIGS:
            raise ValueError(f"未対応のAPI: {api_name}")
        
        config = API_CONFIGS[api_name]
        supabase = get_supabase_client()
        
        response = supabase.table('audio_files') \
            .select('file_path, created_at, device_id') \
            .eq(config['status_column'], 'pending') \
            .order('created_at', desc=False) \
            .limit(limit) \
            .execute()
        
        if response.data:
            logger.info(f"{api_name}: {len(response.data)}件の未処理ファイルを取得")
            return [item['file_path'] for item in response.data]
        else:
            logger.info(f"{api_name}: 未処理ファイルなし")
            return []
            
    except Exception as e:
        logger.error(f"{api_name}: 未処理ファイル取得エラー: {e}")
        return []

def call_api(api_name: str, file_paths: list) -> bool:
    """API呼び出し"""
    try:
        if api_name not in API_CONFIGS:
            raise ValueError(f"未対応のAPI: {api_name}")
        
        config = API_CONFIGS[api_name]
        
        request_data = {
            "file_paths": file_paths,
            "model": config.get("model", "base")
        }
        
        logger.info(f"{api_name}: API呼び出し開始 ({len(file_paths)}件)")
        
        response = requests.post(
            config['endpoint'],
            json=request_data,
            timeout=config.get('timeout', 300)
        )
        
        if response.status_code == 200:
            result = response.json()
            logger.info(f"{api_name}: API呼び出し成功 - {result.get('message', 'OK')}")
            return True
        else:
            logger.error(f"{api_name}: API呼び出し失敗 - {response.status_code}: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        logger.warning(f"{api_name}: API呼び出しタイムアウト（バックグラウンド処理は継続中の可能性）")
        return True  # タイムアウトでも処理は継続されている可能性があるため成功扱い
    except Exception as e:
        logger.error(f"{api_name}: API呼び出しエラー: {e}")
        return False

def log_execution(api_name: str, file_count: int, status: str, message: str = ""):
    """実行ログ記録"""
    timestamp = datetime.now().isoformat()
    log_entry = f"[{timestamp}] {status}: {api_name} - {file_count}件処理 {message}"
    
    if status == "SUCCESS":
        logger.info(log_entry)
    else:
        logger.error(log_entry)

def main():
    """メイン処理"""
    if len(sys.argv) < 2:
        logger.error("使用方法: python run-api-process.py <api_name>")
        sys.exit(1)
    
    api_name = sys.argv[1]
    
    try:
        # 設定チェック
        if api_name not in API_CONFIGS:
            log_execution(api_name, 0, "ERROR", f"未対応のAPI: {api_name}")
            sys.exit(1)
        
        config = API_CONFIGS[api_name]
        display_name = config.get('display_name', api_name)
        
        logger.info(f"=== {display_name} 自動処理開始 ===")
        
        # 未処理ファイル取得
        pending_files = get_pending_files(api_name)
        
        if not pending_files:
            log_execution(api_name, 0, "SUCCESS", "未処理ファイルなし")
            return
        
        # API実行
        success = call_api(api_name, pending_files)
        
        if success:
            log_execution(api_name, len(pending_files), "SUCCESS", "処理完了")
        else:
            log_execution(api_name, len(pending_files), "ERROR", "処理失敗")
            sys.exit(1)
        
        logger.info(f"=== {display_name} 自動処理完了 ===")
        
    except Exception as e:
        log_execution(api_name, 0, "ERROR", f"予期しないエラー: {e}")
        logger.exception("詳細エラー:")
        sys.exit(1)

if __name__ == "__main__":
    main()