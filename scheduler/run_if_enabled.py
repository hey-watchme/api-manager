#!/usr/bin/env python3
"""
APIの有効/無効状態を確認して、有効な場合のみDockerコンテナ内で実行するスクリプト
ホストOS側のcronから呼び出される

使用方法:
    python3 /home/ubuntu/scheduler/run_if_enabled.py [API名]
"""

import sys
import json
import subprocess
import logging
from datetime import datetime
import os

# ログ設定
LOG_DIR = "/var/log/scheduler"
os.makedirs(LOG_DIR, exist_ok=True)

def setup_logger(api_name):
    """API専用のロガーを設定"""
    log_file = f"{LOG_DIR}/scheduler-{api_name}.log"
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler()
        ]
    )
    return logging.getLogger(__name__)

def main():
    # 引数チェック
    if len(sys.argv) < 2:
        print("使用方法: python3 run_if_enabled.py [API名]")
        sys.exit(1)
    
    api_name = sys.argv[1]
    logger = setup_logger(api_name)
    
    # 設定ファイルのパス
    config_path = '/home/ubuntu/scheduler/config.json'
    
    try:
        # config.jsonが存在しない場合はスキップ
        if not os.path.exists(config_path):
            logger.warning(f"設定ファイルが存在しません: {config_path}")
            logger.info(f"{api_name}: スキップ（設定ファイルなし）")
            sys.exit(0)
        
        # 設定ファイルを読み込み
        with open(config_path, 'r') as f:
            config = json.load(f)
        
        # APIの有効/無効を確認
        api_config = config.get('apis', {}).get(api_name, {})
        is_enabled = api_config.get('enabled', False)
        
        if is_enabled:
            logger.info(f"{api_name}: 有効 - 実行開始")
            
            # デバイスIDとprocessDateを取得（デバイスベースAPIの場合）
            device_id = api_config.get('deviceId')
            process_date = api_config.get('processDate')
            
            # Dockerコンテナ内でAPIを実行
            command = f"docker exec watchme-scheduler-prod python /app/run-api-process-docker.py {api_name}"
            
            # コマンド実行
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=600  # 10分のタイムアウト
            )
            
            if result.returncode == 0:
                logger.info(f"{api_name}: 実行成功")
                if result.stdout:
                    logger.info(f"出力: {result.stdout[:500]}")  # 最初の500文字のみ
            else:
                logger.error(f"{api_name}: 実行失敗 (exit code: {result.returncode})")
                if result.stderr:
                    logger.error(f"エラー: {result.stderr[:500]}")
        else:
            logger.info(f"{api_name}: 無効 - スキップ")
            
    except FileNotFoundError:
        logger.error(f"設定ファイルが見つかりません: {config_path}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        logger.error(f"設定ファイルのパースエラー: {e}")
        sys.exit(1)
    except subprocess.TimeoutExpired:
        logger.error(f"{api_name}: タイムアウト（10分）")
        sys.exit(1)
    except Exception as e:
        logger.error(f"{api_name}: 予期しないエラー: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()