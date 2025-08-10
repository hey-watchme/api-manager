#!/usr/bin/env python3
"""
API自動処理実行スクリプト（Docker環境用）- 改善版
設定の一元管理を重視した実装

重要: デバイスIDはフロントエンドから設定されたconfig.jsonを使用
      config.jsonが存在しない場合はエラーとして明確に通知
"""

import sys
import requests
import json
import logging
from datetime import datetime, date
from supabase import create_client, Client
import os

# ========================================
# デバイスID設定に関する重要な注意事項
# ========================================
# デバイスIDはフロントエンドから設定されるべきです。
# /home/ubuntu/scheduler/config.json に保存されます。
# 
# テストデバイスIDを変更する場合：
# 1. フロントエンド: src/config/constants.js の DEFAULT_DEVICE_ID を変更
# 2. バックエンド: このファイルのFALLBACK_DEVICE_IDを変更（非推奨）
# 
# 推奨: フロントエンドから設定を行い、config.jsonを生成する
# ========================================

FALLBACK_DEVICE_ID = '9f7d6e27-98c3-4c19-bdfb-f7fda58b9a93'  # 緊急時のフォールバック値

# ログ設定
LOG_DIR = "/var/log/scheduler"
os.makedirs(LOG_DIR, exist_ok=True)

def get_logger(api_name: str):
    """API専用のロガーを取得"""
    logger = logging.getLogger(f"scheduler.{api_name}")
    logger.setLevel(logging.INFO)
    
    # 既存のハンドラーをクリア
    logger.handlers = []
    
    # ファイルハンドラー
    log_file = f"{LOG_DIR}/scheduler-{api_name}.log"
    file_handler = logging.FileHandler(log_file)
    file_handler.setLevel(logging.INFO)
    
    # コンソールハンドラー
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    
    # フォーマット設定
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)
    
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger

# デフォルトロガー
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# 環境変数からSupabase設定取得
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

# API設定（エンドポイントのみ管理）
API_CONFIGS = {
    "whisper": {
        "endpoint": "http://api-transcriber:8001/fetch-and-transcribe",
        "status_column": "transcriptions_status",
        "model": "base",
        "display_name": "Whisper Transcriber",
        "type": "file_based"
    },
    "vibe-aggregator": {
        "endpoint": "http://api_gen_prompt_mood_chart:8009/generate-mood-prompt-supabase",
        "display_name": "Vibe Aggregator",
        "type": "device_based",
        "method": "GET"
    },
    "vibe-scorer": {
        "endpoint": "http://api-gpt-v1:8002/analyze-vibegraph-supabase",
        "display_name": "Vibe Scorer",
        "type": "device_based"
    },
    "behavior-aggregator": {
        "endpoint": "http://api-sed-aggregator:8010/analysis/sed",
        "display_name": "Behavior Aggregator",
        "type": "device_based"
    },
    "emotion-aggregator": {
        "endpoint": "http://opensmile-aggregator:8012/analyze/opensmile-aggregator",
        "display_name": "Emotion Aggregator",
        "type": "device_based"
    },
    "behavior-features": {
        "endpoint": "http://api_sed_v1-sed_api-1:8004/fetch-and-process-paths",
        "status_column": "behavior_features_status",
        "model": None,
        "display_name": "行動特徴抽出",
        "type": "file_based"
    },
    "emotion-features": {
        "endpoint": "http://opensmile-api:8011/process/emotion-features",
        "status_column": "emotion_features_status",
        "model": None,
        "display_name": "感情特徴抽出",
        "type": "file_based"
    }
}

def get_supabase_client() -> Client:
    """Supabaseクライアント取得"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("Supabase設定が見つかりません")
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def get_pending_files(api_name: str, limit: int = 100, api_logger=None) -> list:
    """未処理ファイル取得"""
    log = api_logger or logger
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
            log.info(f"{api_name}: {len(response.data)}件の未処理ファイルを取得")
            return [item['file_path'] for item in response.data]
        else:
            log.info(f"{api_name}: 未処理ファイルなし")
            return []
            
    except Exception as e:
        log.error(f"{api_name}: 未処理ファイル取得エラー: {e}")
        return []

def load_scheduler_config() -> dict:
    """スケジューラー設定ファイル読み込み"""
    config_file = "/home/ubuntu/scheduler/config.json"
    
    try:
        if os.path.exists(config_file):
            with open(config_file, 'r') as f:
                config = json.load(f)
                logger.info(f"✅ config.json読み込み成功: {config_file}")
                return config
        else:
            logger.warning(f"⚠️ config.jsonが存在しません: {config_file}")
            logger.warning(f"⚠️ フロントエンドから設定を行ってください")
            logger.warning(f"⚠️ 緊急フォールバック値を使用: {FALLBACK_DEVICE_ID}")
    except Exception as e:
        logger.error(f"❌ 設定ファイル読み込みエラー: {e}")
    
    return {}

def get_device_id_and_date(api_name: str, scheduler_config: dict, api_logger=None):
    """デバイスIDと処理日付を取得"""
    log = api_logger or logger
    api_config = scheduler_config.get('apis', {}).get(api_name, {})
    
    # デバイスIDの取得（優先順位）
    # 1. config.jsonから読み込んだ値
    # 2. フォールバック値（警告付き）
    device_id = api_config.get('deviceId')
    if not device_id:
        log.warning(f"⚠️ {api_name}: config.jsonにdeviceIdが設定されていません")
        log.warning(f"⚠️ フロントエンドから設定を保存してください")
        log.warning(f"⚠️ 緊急フォールバック値を使用: {FALLBACK_DEVICE_ID}")
        device_id = FALLBACK_DEVICE_ID
    else:
        log.info(f"✅ config.jsonからdeviceId取得: {device_id}")
    
    process_date = api_config.get('processDate', 'today')
    
    return device_id, process_date

def call_device_based_api(api_name: str, device_id: str, process_date: str, api_logger=None) -> bool:
    """デバイスベースのAPI呼び出し"""
    log = api_logger or logger
    try:
        config = API_CONFIGS[api_name]
        
        # process_dateが"today"の場合は今日の日付に変換
        if process_date == "today":
            process_date = date.today().strftime("%Y-%m-%d")
        
        request_data = {
            "device_id": device_id,
            "date": process_date
        }
        
        log.info(f"{api_name}: API呼び出し開始 (device: {device_id}, date: {process_date})")
        
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
            log.info(f"{api_name}: API呼び出し成功 - {result.get('message', 'OK')}")
            return True
        else:
            log.error(f"{api_name}: API呼び出し失敗 - {response.status_code}: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        log.warning(f"{api_name}: API呼び出しタイムアウト（バックグラウンド処理は継続中の可能性）")
        return True
    except requests.exceptions.ConnectionError as e:
        log.error(f"{api_name}: API接続エラー - コンテナ名 '{config['endpoint']}' が解決できません。")
        log.error(f"watchme-networkへの接続を確認してください。")
        return False
    except Exception as e:
        log.error(f"{api_name}: API呼び出しエラー: {e}")
        return False

def call_api(api_name: str, file_paths: list, api_logger=None) -> bool:
    """ファイルベースAPI呼び出し"""
    log = api_logger or logger
    try:
        if api_name not in API_CONFIGS:
            raise ValueError(f"未対応のAPI: {api_name}")
        
        config = API_CONFIGS[api_name]
        
        request_data = {
            "file_paths": file_paths
        }
        
        # modelが指定されている場合のみ追加
        if config.get("model") is not None:
            request_data["model"] = config["model"]
        
        log.info(f"{api_name}: API呼び出し開始 ({len(file_paths)}件)")
        
        response = requests.post(
            config['endpoint'],
            json=request_data,
            timeout=config.get('timeout', 300)
        )
        
        if response.status_code == 200:
            result = response.json()
            log.info(f"{api_name}: API呼び出し成功 - {result.get('message', 'OK')}")
            return True
        else:
            log.error(f"{api_name}: API呼び出し失敗 - {response.status_code}: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        log.warning(f"{api_name}: API呼び出しタイムアウト（バックグラウンド処理は継続中の可能性）")
        return True
    except requests.exceptions.ConnectionError as e:
        log.error(f"{api_name}: API接続エラー - コンテナ名 '{config['endpoint']}' が解決できません。")
        return False
    except Exception as e:
        log.error(f"{api_name}: API呼び出しエラー: {e}")
        return False

def log_execution(api_name: str, file_count: int, status: str, message: str = "", api_logger=None):
    """実行ログ記録"""
    log = api_logger or logger
    timestamp = datetime.now().isoformat()
    log_entry = f"[{timestamp}] {status}: {api_name} - {file_count}件処理 {message}"
    
    if status == "SUCCESS":
        log.info(log_entry)
    else:
        log.error(log_entry)

def main():
    """メイン処理"""
    if len(sys.argv) < 2:
        logger.error("使用方法: python run-api-process.py <api_name>")
        sys.exit(1)
    
    api_name = sys.argv[1]
    
    # API専用のロガーを取得
    api_logger = get_logger(api_name)
    
    try:
        # 設定チェック
        if api_name not in API_CONFIGS:
            log_execution(api_name, 0, "ERROR", f"未対応のAPI: {api_name}", api_logger)
            sys.exit(1)
        
        config = API_CONFIGS[api_name]
        display_name = config.get('display_name', api_name)
        
        api_logger.info(f"=== {display_name} 自動処理開始 ===")
        api_logger.info(f"=================================")
        api_logger.info(f"デバイスID管理について:")
        api_logger.info(f"フロントエンドから設定されたconfig.jsonを使用します")
        api_logger.info(f"=================================")
        
        api_type = config.get('type', 'file_based')
        
        if api_type == 'device_based':
            # デバイスベースのAPI処理
            scheduler_config = load_scheduler_config()
            device_id, process_date = get_device_id_and_date(api_name, scheduler_config, api_logger)
            
            api_logger.info(f"デバイスベース処理: device={device_id}, date={process_date}")
            
            # API実行
            success = call_device_based_api(api_name, device_id, process_date, api_logger)
            
            if success:
                log_execution(api_name, 1, "SUCCESS", f"処理完了 (device: {device_id})", api_logger)
            else:
                log_execution(api_name, 1, "ERROR", f"処理失敗 (device: {device_id})", api_logger)
                sys.exit(1)
        else:
            # ファイルベースのAPI処理
            pending_files = get_pending_files(api_name, api_logger=api_logger)
            
            if not pending_files:
                log_execution(api_name, 0, "SUCCESS", "未処理ファイルなし", api_logger)
                return
            
            # API実行
            success = call_api(api_name, pending_files, api_logger)
            
            if success:
                log_execution(api_name, len(pending_files), "SUCCESS", "処理完了", api_logger)
            else:
                log_execution(api_name, len(pending_files), "ERROR", "処理失敗", api_logger)
                sys.exit(1)
        
        api_logger.info(f"=== {display_name} 自動処理完了 ===")
        
    except Exception as e:
        log_execution(api_name, 0, "ERROR", f"予期しないエラー: {e}", api_logger)
        api_logger.exception("詳細エラー:")
        sys.exit(1)

if __name__ == "__main__":
    main()