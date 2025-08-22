#!/usr/bin/env python3
"""
API自動処理実行スクリプト（Dockerコンテナ用）
指定されたAPIの自動処理を実行
"""

import sys
import requests
import json
import logging
from datetime import datetime, date, timezone, timedelta
from supabase import create_client, Client
import os

# JSTタイムゾーン定義（このスケジューラーは日本向けテスト用）
JST = timezone(timedelta(hours=9))

# 設定をインポート
try:
    from config import DEFAULT_DEVICE_ID
except ImportError:
    # config.pyが存在しない場合のフォールバック
    DEFAULT_DEVICE_ID = '9f7d6e27-98c3-4c19-bdfb-f7fda58b9a93'

# ログ設定
LOG_DIR = "/var/log/scheduler"
os.makedirs(LOG_DIR, exist_ok=True)

# APIごとのログファイルを設定
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
# VITE_プレフィックス付きも考慮（フロントエンドと共通の.envファイルを使用するため）
SUPABASE_URL = os.getenv('SUPABASE_URL') or os.getenv('VITE_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY') or os.getenv('VITE_SUPABASE_KEY')

# API設定
# 注意: Dockerコンテナ間通信では、コンテナ名を使用する
# watchme-networkで接続されたコンテナは、コンテナ名で通信可能
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
        "method": "GET"  # GETメソッドを使用
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
        # 行動特徴抽出APIのコンテナ名とポートを指定
        "endpoint": "http://api_sed_v1-sed_api-1:8004/fetch-and-process-paths",
        # Supabaseで未処理ファイルを検索するためのカラム名
        "status_column": "behavior_features_status",
        "model": None, # このAPIにモデル指定が不要な場合はNone
        "display_name": "行動特徴抽出",
        "type": "file_based"
    },
    "emotion-features": {
        # 感情特徴抽出APIのコンテナ名とポートを指定
        "endpoint": "http://opensmile-api:8011/process/emotion-features",
        # Supabaseで未処理ファイルを検索するためのカラム名
        "status_column": "emotion_features_status",
        "model": None, # このAPIにモデル指定が不要な場合はNone
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
    try:
        config_file = "/home/ubuntu/scheduler/config.json"
        if os.path.exists(config_file):
            with open(config_file, 'r') as f:
                return json.load(f)
    except Exception as e:
        logger.error(f"設定ファイル読み込みエラー: {e}")
    return {}

def get_all_device_ids_for_date(process_date: str, api_logger=None) -> list:
    """指定日付の全デバイスIDを取得"""
    log = api_logger or logger
    try:
        supabase = get_supabase_client()
        
        # process_dateが"today"の場合はJSTでの今日の日付に変換
        if process_date == "today":
            jst_now = datetime.now(JST)
            process_date = jst_now.strftime("%Y-%m-%d")
        
        # audio_filesテーブルから指定日付のユニークなdevice_idを取得
        # created_atフィールドを使用して日付でフィルタリング
        start_date = f"{process_date}T00:00:00"
        end_date = f"{process_date}T23:59:59"
        
        response = supabase.table('audio_files') \
            .select('device_id') \
            .gte('created_at', start_date) \
            .lte('created_at', end_date) \
            .execute()
        
        if response.data:
            # ユニークなdevice_idのリストを作成
            device_ids = list(set([item['device_id'] for item in response.data if item.get('device_id')]))
            log.info(f"日付 {process_date} で {len(device_ids)} 個のデバイスIDを取得")
            return device_ids
        else:
            log.info(f"日付 {process_date} にはデータが存在しません")
            return []
            
    except Exception as e:
        log.error(f"デバイスID取得エラー: {e}")
        # エラー時はフォールバック値を返す
        log.warning(f"フォールバック: デフォルトデバイスIDを使用")
        return [DEFAULT_DEVICE_ID]

def call_device_based_api(api_name: str, device_id: str, process_date: str, api_logger=None) -> bool:
    """デバイスベースのAPI呼び出し（vibe-aggregator等）"""
    log = api_logger or logger
    try:
        config = API_CONFIGS[api_name]
        
        # process_dateが"today"の場合はJSTでの今日の日付に変換
        if process_date == "today":
            # JSTでの現在時刻を取得
            jst_now = datetime.now(JST)
            process_date = jst_now.strftime("%Y-%m-%d")
            log.info(f"JST日付を使用: {process_date}")
        
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
        log.error(f"{api_name}: API接続エラー - コンテナ名 '{config['endpoint']}' が解決できません。watchme-networkへの接続を確認してください。")
        return False
    except Exception as e:
        log.error(f"{api_name}: API呼び出しエラー: {e}")
        return False

def call_api(api_name: str, file_paths: list, api_logger=None) -> bool:
    """API呼び出し"""
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
        return True  # タイムアウトでも処理は継続されている可能性があるため成功扱い
    except requests.exceptions.ConnectionError as e:
        log.error(f"{api_name}: API接続エラー - コンテナ名 '{config['endpoint']}' が解決できません。watchme-networkへの接続を確認してください。")
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
        # JST時刻を表示
        jst_now = datetime.now(JST)
        api_logger.info(f"実行時刻: {jst_now.strftime('%Y-%m-%d %H:%M:%S JST')}")
        
        api_type = config.get('type', 'file_based')
        
        if api_type == 'device_based':
            # デバイスベースのAPI処理（全デバイス対応）
            scheduler_config = load_scheduler_config()
            api_config = scheduler_config.get('apis', {}).get(api_name, {})
            
            # config.jsonから日付設定を取得（デフォルトは'today'）
            process_date = api_config.get('processDate', 'today')
            
            # process_dateが"today"の場合はJSTでの今日の日付に変換
            if process_date == "today":
                jst_now = datetime.now(JST)
                process_date = jst_now.strftime("%Y-%m-%d")
            
            api_logger.info(f"=== 全デバイス処理開始: date={process_date} ===")
            
            # 指定日付の全デバイスIDを取得
            device_ids = get_all_device_ids_for_date(process_date, api_logger)
            
            if not device_ids:
                api_logger.warning(f"日付 {process_date} にはデータが存在するデバイスがありません")
                log_execution(api_name, 0, "SUCCESS", f"処理対象デバイスなし (date: {process_date})", api_logger)
                return
            
            api_logger.info(f"処理対象デバイス数: {len(device_ids)}")
            api_logger.info(f"デバイスID一覧: {device_ids}")
            
            # 各デバイスを順次処理
            success_count = 0
            failed_count = 0
            
            for idx, device_id in enumerate(device_ids, 1):
                api_logger.info(f"")
                api_logger.info(f"--- デバイス {idx}/{len(device_ids)}: {device_id} ---")
                
                # API実行
                success = call_device_based_api(api_name, device_id, process_date, api_logger)
                
                if success:
                    success_count += 1
                    api_logger.info(f"✅ デバイス {device_id} の処理完了")
                else:
                    failed_count += 1
                    api_logger.error(f"❌ デバイス {device_id} の処理失敗")
            
            # 全体の処理結果をログ出力
            api_logger.info(f"")
            api_logger.info(f"=== 全デバイス処理完了 ===")
            api_logger.info(f"成功: {success_count}/{len(device_ids)} デバイス")
            if failed_count > 0:
                api_logger.warning(f"失敗: {failed_count}/{len(device_ids)} デバイス")
            
            # 実行ログ記録
            if failed_count == 0:
                log_execution(api_name, len(device_ids), "SUCCESS", 
                            f"全デバイス処理完了 ({success_count}デバイス, date: {process_date})", api_logger)
            elif success_count > 0:
                log_execution(api_name, len(device_ids), "PARTIAL", 
                            f"一部成功 (成功: {success_count}, 失敗: {failed_count}, date: {process_date})", api_logger)
            else:
                log_execution(api_name, len(device_ids), "ERROR", 
                            f"全デバイス処理失敗 ({failed_count}デバイス, date: {process_date})", api_logger)
                sys.exit(1)
        else:
            # ファイルベースのAPI処理（既存の処理）
            # 未処理ファイル取得
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