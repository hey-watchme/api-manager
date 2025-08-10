#!/home/ubuntu/scheduler/venv/bin/python
"""
API自動処理実行スクリプト
指定されたAPIの自動処理を実行
"""

import sys
import requests
import json
import logging
from datetime import datetime, date
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
API_CONFIGS = {
    "whisper": {
        "endpoint": "http://localhost:8001/fetch-and-transcribe",
        "status_column": "transcriptions_status",
        "model": "base",
        "display_name": "Whisper Transcriber",
        "type": "file_based"
    },
    "vibe-aggregator": {
        "endpoint": "http://localhost:8009/generate-mood-prompt-supabase",
        "display_name": "Vibe Aggregator",
        "type": "device_based",
        "method": "GET"
    },
    "vibe-scorer": {
        "endpoint": "http://localhost:8002/analyze-vibegraph-supabase",
        "display_name": "Vibe Scorer",
        "type": "device_based"
    },
    "behavior-aggregator": {
        "endpoint": "http://localhost:8010/analysis/sed",
        "display_name": "Behavior Aggregator",
        "type": "device_based"
    },
    "emotion-aggregator": {
        "endpoint": "http://localhost:8012/analyze/opensmile-aggregator",
        "display_name": "Emotion Aggregator",
        "type": "device_based"
    },
    "emotion-features": {
        "endpoint": "http://localhost:8011/process/emotion-features",
        "status_column": "opensmile_status",
        "display_name": "Emotion Features",
        "type": "file_based"
    },
    "behavior-features": {
        "endpoint": "http://localhost:8004/fetch-and-process-paths",
        "status_column": "sed_status",
        "display_name": "Behavior Features",
        "type": "file_based"
    }
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

def load_scheduler_config() -> dict:
    """スケジューラー設定ファイル読み込み"""
    try:
        config_file = "/home/ubuntu/scheduler/config.json"
        if os.path.exists(config_file):
            with open(config_file, 'r') as f:
                return json.load(f)
    except Exception as e:
        logger.error(f"設定ファイル読み込みエラー: {e}")
    return {}

def call_device_based_api(api_name: str, device_id: str, process_date: str) -> bool:
    """デバイスベースのAPI呼び出し（vibe-aggregator等）"""
    try:
        config = API_CONFIGS[api_name]
        
        # process_dateが"today"の場合は今日の日付に変換
        if process_date == "today":
            process_date = date.today().strftime("%Y-%m-%d")
        
        request_data = {
            "device_id": device_id,
            "date": process_date
        }
        
        logger.info(f"{api_name}: API呼び出し開始 (device: {device_id}, date: {process_date})")
        
        # HTTPメソッドの選択（デフォルトはPOST）
        method = config.get('method', 'POST').upper()
        
        if method == 'GET':
            response = requests.get(
                config['endpoint'],
                params=request_data,
                timeout=config.get('timeout', 300)
            )
        else:
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
        return True
    except Exception as e:
        logger.error(f"{api_name}: API呼び出しエラー: {e}")
        return False

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
        
        api_type = config.get('type', 'file_based')
        
        if api_type == 'device_based':
            # デバイスベースのAPI処理
            scheduler_config = load_scheduler_config()
            api_config = scheduler_config.get('apis', {}).get(api_name, {})
            
            device_id = api_config.get('deviceId', 'm5cddc22-4f52-4d0d-8a7a-cda8b88e33fa')
            process_date = api_config.get('processDate', 'today')
            
            logger.info(f"デバイスベース処理: device={device_id}, date={process_date}")
            
            # API実行
            success = call_device_based_api(api_name, device_id, process_date)
            
            if success:
                log_execution(api_name, 1, "SUCCESS", f"処理完了 (device: {device_id})")
            else:
                log_execution(api_name, 1, "ERROR", f"処理失敗 (device: {device_id})")
                sys.exit(1)
        else:
            # ファイルベースのAPI処理（既存の処理）
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