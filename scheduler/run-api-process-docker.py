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
    # 2025/09/02: Whisper API削除済み - Azure Speechへ移行
    # "whisper": {
    #     "endpoint": "http://api-transcriber:8001/fetch-and-transcribe",
    #     "status_column": "transcriptions_status",
    #     "model": "base",
    #     "display_name": "Whisper Transcriber (停止中)",
    #     "type": "file_based"
    # },
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
        "endpoint": "http://sed-api:8004/fetch-and-process-paths",
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
    },
    "azure-transcriber": {
        # Azure Speech Service APIのコンテナ名とポートを指定
        "endpoint": "http://vibe-transcriber-v2:8013/fetch-and-transcribe",
        # Supabaseで未処理ファイルを検索するためのカラム名（Whisperと同じ）
        "status_column": "transcriptions_status",
        "model": "azure",  # Azureモデルを指定
        "display_name": "Azure Transcriber",
        "type": "file_based"
    },
    "timeblock-prompt": {
        # タイムブロック単位プロンプト生成API
        "endpoint": "http://api_gen_prompt_mood_chart:8009/generate-timeblock-prompt",
        "display_name": "Timeblock Prompt Generator",
        "type": "timeblock_based",  # 新しいタイプ：未処理タイムブロック検出型
        "method": "GET",
        "timeout": 120,
        "status_tables": [  # STATUS管理対象テーブル
            "vibe_whisper",
            "behavior_yamnet", 
            "emotion_opensmile"
        ]
    },
    "timeblock-analysis": {
        # タイムブロック単位ChatGPT分析API
        "endpoint": "http://api-gpt-v1:8002/analyze-timeblock",
        "display_name": "Timeblock ChatGPT Analysis",
        "type": "dashboard_based",  # dashboardテーブルのpendingステータスを処理
        "method": "POST",
        "timeout": 60,  # ChatGPT処理のため60秒
        "status_table": "dashboard",  # 対象テーブル
        "batch_limit": 50  # 一度に処理する最大件数
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

def get_pending_timeblocks(limit: int = 50, api_logger=None) -> list:
    """
    3つのテーブルから未処理（pending）のタイムブロックを検出
    重複を除いてユニークなタイムブロックのリストを返す
    """
    log = api_logger or logger
    try:
        supabase = get_supabase_client()
        
        # 複数テーブルから未処理データを検出
        pending_blocks = {}  # キーで重複を管理
        tables = ['vibe_whisper', 'behavior_yamnet', 'emotion_opensmile']
        
        for table in tables:
            try:
                response = supabase.table(table) \
                    .select('device_id, date, time_block') \
                    .eq('status', 'pending') \
                    .order('date', desc=False) \
                    .order('time_block', desc=False) \
                    .limit(limit) \
                    .execute()
                
                if response.data:
                    for item in response.data:
                        # ユニークキーを生成
                        block_key = f"{item['device_id']}_{item['date']}_{item['time_block']}"
                        if block_key not in pending_blocks:
                            pending_blocks[block_key] = {
                                'device_id': item['device_id'],
                                'date': item['date'],
                                'time_block': item['time_block']
                            }
                    log.info(f"{table}: {len(response.data)}件の未処理データを検出")
            except Exception as e:
                log.warning(f"{table}テーブルからのデータ取得エラー: {e}")
                continue
        
        # リストに変換して制限数まで返す
        result = list(pending_blocks.values())[:limit]
        log.info(f"timeblock-prompt: 合計{len(result)}件の未処理タイムブロックを検出")
        return result
        
    except Exception as e:
        log.error(f"未処理タイムブロック検出エラー: {e}")
        return []

def call_timeblock_api(device_id: str, date: str, time_block: str, api_logger=None) -> bool:
    """
    タイムブロック単位のAPI呼び出し
    GETメソッドでgenerate-timeblock-promptエンドポイントを呼び出す
    """
    log = api_logger or logger
    try:
        config = API_CONFIGS['timeblock-prompt']
        
        # GETリクエストでパラメータを送信
        params = {
            "device_id": device_id,
            "date": date,
            "time_block": time_block
        }
        
        log.info(f"timeblock-prompt: API呼び出し開始 (device: {device_id}, date: {date}, block: {time_block})")
        
        response = requests.get(
            config['endpoint'],
            params=params,
            timeout=config.get('timeout', 120)
        )
        
        if response.status_code == 200:
            result = response.json()
            # status_updatesフィールドをチェック
            status_updates = result.get('status_updates', {})
            if status_updates:
                log.info(f"timeblock-prompt: 処理成功 - {time_block} (whisper:{status_updates.get('whisper_updated')}, yamnet:{status_updates.get('yamnet_updated')}, opensmile:{status_updates.get('opensmile_updated')})")
            else:
                log.info(f"timeblock-prompt: 処理成功 - {time_block}")
            return True
        else:
            log.error(f"timeblock-prompt: 処理失敗 - {response.status_code}: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        log.warning(f"timeblock-prompt: API呼び出しタイムアウト（処理は継続中の可能性）")
        return True
    except requests.exceptions.ConnectionError as e:
        log.error(f"timeblock-prompt: API接続エラー - コンテナ名 '{config['endpoint']}' が解決できません。")
        return False
    except Exception as e:
        log.error(f"timeblock-prompt: API呼び出しエラー: {e}")
        return False

def get_pending_dashboard_items(limit: int = 50, api_logger=None) -> list:
    """
    dashboardテーブルから未処理（pending）のアイテムを取得
    promptが存在し、statusがpendingのレコードを検出
    """
    log = api_logger or logger
    try:
        supabase = get_supabase_client()
        
        # dashboardテーブルからpendingステータスのレコードを取得
        # promptが存在するもののみ対象
        response = supabase.table('dashboard') \
            .select('device_id, date, time_block, prompt') \
            .eq('status', 'pending') \
            .not_.is_('prompt', 'null') \
            .order('date', desc=False) \
            .order('time_block', desc=False) \
            .limit(limit) \
            .execute()
        
        if response.data:
            log.info(f"dashboard: {len(response.data)}件の未処理レコードを検出")
            return response.data
        else:
            log.info(f"dashboard: 未処理レコードなし")
            return []
            
    except Exception as e:
        log.error(f"dashboard未処理レコード取得エラー: {e}")
        return []

def call_dashboard_analysis_api(item: dict, api_logger=None) -> bool:
    """
    dashboard分析APIを呼び出し、結果をdashboardテーブルに保存
    処理後にstatusをcompletedに更新
    """
    log = api_logger or logger
    try:
        config = API_CONFIGS['timeblock-analysis']
        
        # POSTリクエストでChatGPT分析を実行
        request_data = {
            "prompt": item['prompt'],
            "device_id": item['device_id'],
            "date": item['date'],
            "time_block": item['time_block']
        }
        
        log.info(f"timeblock-analysis: API呼び出し開始 (device: {item['device_id']}, date: {item['date']}, block: {item['time_block']}）")
        
        response = requests.post(
            config['endpoint'],
            json=request_data,
            timeout=config.get('timeout', 60)
        )
        
        if response.status_code == 200:
            result = response.json()
            
            # Supabaseでstatusをcompletedに更新
            try:
                supabase = get_supabase_client()
                update_response = supabase.table('dashboard') \
                    .update({'status': 'completed', 'processed_at': datetime.now(JST).isoformat()}) \
                    .eq('device_id', item['device_id']) \
                    .eq('date', item['date']) \
                    .eq('time_block', item['time_block']) \
                    .execute()
                
                log.info(f"timeblock-analysis: 処理成功 - {item['time_block']} (vibe_score: {result.get('vibe_score', 'N/A')})")
                return True
            except Exception as e:
                log.error(f"timeblock-analysis: ステータス更新エラー - {e}")
                return False
        else:
            log.error(f"timeblock-analysis: API呼び出し失敗 - {response.status_code}: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        log.warning(f"timeblock-analysis: API呼び出しタイムアウト")
        return False
    except requests.exceptions.ConnectionError as e:
        log.error(f"timeblock-analysis: API接続エラー - コンテナ名が解決できません。")
        return False
    except Exception as e:
        log.error(f"timeblock-analysis: API呼び出しエラー: {e}")
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
        
        if api_type == 'timeblock_based':
            # タイムブロックベースの処理（未処理データ自動検出）
            api_logger.info("=== タイムブロック未処理データ検出処理 ===")
            
            # config.jsonから設定を読み込み
            scheduler_config = load_scheduler_config()
            api_config = scheduler_config.get('apis', {}).get(api_name, {})
            batch_limit = api_config.get('batchLimit', 50)
            
            # 未処理タイムブロックを取得
            pending_blocks = get_pending_timeblocks(limit=batch_limit, api_logger=api_logger)
            
            if not pending_blocks:
                api_logger.info("未処理タイムブロックなし")
                log_execution(api_name, 0, "SUCCESS", "未処理データなし", api_logger)
                return
            
            api_logger.info(f"処理対象: {len(pending_blocks)} タイムブロック")
            
            # 各タイムブロックを順次処理
            success_count = 0
            failed_count = 0
            
            for idx, block in enumerate(pending_blocks, 1):
                api_logger.info(f"")
                api_logger.info(f"--- 処理中 {idx}/{len(pending_blocks)}: {block['device_id']}/{block['date']}/{block['time_block']} ---")
                
                success = call_timeblock_api(
                    block['device_id'],
                    block['date'], 
                    block['time_block'],
                    api_logger
                )
                
                if success:
                    success_count += 1
                    api_logger.info(f"✅ タイムブロック {block['time_block']} の処理完了")
                else:
                    failed_count += 1
                    api_logger.error(f"❌ タイムブロック {block['time_block']} の処理失敗")
            
            # 全体の処理結果をログ出力
            api_logger.info(f"")
            api_logger.info(f"=== タイムブロック処理完了 ===")
            api_logger.info(f"成功: {success_count}/{len(pending_blocks)} タイムブロック")
            if failed_count > 0:
                api_logger.warning(f"失敗: {failed_count}/{len(pending_blocks)} タイムブロック")
            
            # 実行ログ記録
            if failed_count == 0:
                log_execution(api_name, len(pending_blocks), "SUCCESS", 
                            f"全タイムブロック処理完了 ({success_count}件)", api_logger)
            elif success_count > 0:
                log_execution(api_name, len(pending_blocks), "PARTIAL", 
                            f"一部成功 (成功: {success_count}, 失敗: {failed_count})", api_logger)
            else:
                log_execution(api_name, len(pending_blocks), "ERROR", 
                            f"全タイムブロック処理失敗 ({failed_count}件)", api_logger)
                sys.exit(1)
                
        elif api_type == 'dashboard_based':
            # dashboardベースの処理（pendingステータスを処理）
            api_logger.info("=== Dashboard未処理データ分析処理 ===")
            
            # config.jsonから設定を読み込み
            scheduler_config = load_scheduler_config()
            api_config = scheduler_config.get('apis', {}).get(api_name, {})
            batch_limit = api_config.get('batchLimit', 50)
            
            # 未処理レコードを取得
            pending_items = get_pending_dashboard_items(limit=batch_limit, api_logger=api_logger)
            
            if not pending_items:
                api_logger.info("未処理レコードなし")
                log_execution(api_name, 0, "SUCCESS", "未処理データなし", api_logger)
                return
            
            api_logger.info(f"処理対象: {len(pending_items)} レコード")
            
            # 各レコードを順次処理
            success_count = 0
            failed_count = 0
            
            for idx, item in enumerate(pending_items, 1):
                api_logger.info(f"")
                api_logger.info(f"--- 処理中 {idx}/{len(pending_items)}: {item['device_id']}/{item['date']}/{item['time_block']} ---")
                
                success = call_dashboard_analysis_api(item, api_logger)
                
                if success:
                    success_count += 1
                    api_logger.info(f"✅ タイムブロック {item['time_block']} の分析完了")
                else:
                    failed_count += 1
                    api_logger.error(f"❌ タイムブロック {item['time_block']} の分析失敗")
            
            # 全体の処理結果をログ出力
            api_logger.info(f"")
            api_logger.info(f"=== Dashboard分析処理完了 ===")
            api_logger.info(f"成功: {success_count}/{len(pending_items)} レコード")
            if failed_count > 0:
                api_logger.warning(f"失敗: {failed_count}/{len(pending_items)} レコード")
            
            # 実行ログ記録
            if failed_count == 0:
                log_execution(api_name, len(pending_items), "SUCCESS", 
                            f"全レコード分析完了 ({success_count}件)", api_logger)
            elif success_count > 0:
                log_execution(api_name, len(pending_items), "PARTIAL", 
                            f"一部成功 (成功: {success_count}, 失敗: {failed_count})", api_logger)
            else:
                log_execution(api_name, len(pending_items), "ERROR", 
                            f"全レコード分析失敗 ({failed_count}件)", api_logger)
                sys.exit(1)
                
        elif api_type == 'device_based':
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