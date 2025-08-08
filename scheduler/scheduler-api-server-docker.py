#!/usr/bin/env python3
"""
WatchMe Scheduler API Server (Docker版)
APIマネージャーのスケジューラー機能を提供するサーバー
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional
import json
import os
import subprocess
import logging
from datetime import datetime, timedelta
import uvicorn

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="WatchMe Scheduler API",
    description="APIマネージャー用スケジューラーAPI（Docker版）",
    version="1.0.0"
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 設定ファイルパス（Docker環境用）
CONFIG_FILE = "/app/config/config.json"
LOG_DIR = "/var/log/scheduler"
CRON_FILE = "/etc/cron.d/watchme-scheduler"

# リクエストモデル
class SchedulerConfig(BaseModel):
    enabled: bool
    interval: int
    timeout: Optional[int] = 300
    max_files: Optional[int] = 100

# 設定管理
def load_config() -> Dict:
    """設定ファイル読み込み"""
    try:
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, 'r') as f:
                return json.load(f)
    except Exception as e:
        logger.error(f"設定読み込みエラー: {e}")
    
    # デフォルト設定
    return {
        "apis": {},
        "global": {
            "enabled": True,
            "timezone": "Asia/Tokyo"
        }
    }

def save_config(config: Dict):
    """設定ファイル保存"""
    try:
        os.makedirs(os.path.dirname(CONFIG_FILE), exist_ok=True)
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        logger.info("設定を保存しました")
    except Exception as e:
        logger.error(f"設定保存エラー: {e}")
        raise HTTPException(status_code=500, detail="設定の保存に失敗しました")

def get_api_log_file(api_name: str) -> str:
    """APIのログファイルパス取得"""
    os.makedirs(LOG_DIR, exist_ok=True)
    return f"{LOG_DIR}/scheduler-{api_name}.log"

def get_last_execution_info(api_name: str) -> Dict:
    """最終実行情報を取得"""
    log_file = get_api_log_file(api_name)
    
    try:
        if os.path.exists(log_file):
            with open(log_file, 'r') as f:
                lines = f.readlines()
                if lines:
                    last_line = lines[-1].strip()
                    # ログから成功・エラー回数を集計
                    success_count = sum(1 for line in lines if 'SUCCESS' in line)
                    error_count = sum(1 for line in lines if 'ERROR' in line)
                    
                    return {
                        "lastRun": datetime.now().isoformat() if success_count > 0 else None,
                        "successCount": success_count,
                        "errorCount": error_count,
                        "isRunning": False  # 簡易実装
                    }
    except Exception as e:
        logger.error(f"ログ読み込みエラー: {e}")
    
    return {
        "lastRun": None,
        "successCount": 0,
        "errorCount": 0,
        "isRunning": False
    }

def calculate_next_run(interval_hours: int) -> str:
    """次回実行時刻計算"""
    next_run = datetime.now() + timedelta(hours=interval_hours)
    return next_run.isoformat()

def update_cron_jobs(config: Dict):
    """cron設定を更新（Docker環境用）"""
    try:
        cron_lines = []
        
        # Docker環境では、ホストのcronから実行するため、
        # EC2ホスト上のパスを使用
        for api_name, settings in config["apis"].items():
            if settings.get("enabled", False):
                interval = settings.get("interval", 3)
                cron_expr = f"0 */{interval} * * *"
                
                # Docker execコマンドを使用してコンテナ内のスクリプトを実行
                cmd = f"docker exec watchme-scheduler-prod python /app/run-api-process-docker.py {api_name}"
                log_file = f"/var/log/scheduler/scheduler-{api_name}.log"
                
                cron_lines.append(
                    f"{cron_expr} ubuntu {cmd} >> {log_file} 2>&1"
                )
        
        # crontabファイル作成
        cron_content = "\n".join(cron_lines) + "\n" if cron_lines else ""
        
        # Dockerコンテナ内から直接cron設定ファイルに書き込み
        with open(CRON_FILE, "w") as f:
            f.write(cron_content)
        
        # ファイル権限設定
        os.chmod(CRON_FILE, 0o644)
        
        logger.info("cron設定を更新しました")
        logger.info(f"cron内容:\n{cron_content}")
        
    except Exception as e:
        logger.error(f"cron更新エラー: {e}")
        # 権限エラーの場合は警告のみ
        if "Permission denied" in str(e):
            logger.warning("cron設定の更新には適切な権限が必要です。ホスト側で手動設定してください。")
        else:
            raise HTTPException(status_code=500, detail="cron設定の更新に失敗しました")

# API エンドポイント
@app.get("/")
async def health_check():
    """ヘルスチェック"""
    return {
        "name": "WatchMe Scheduler API (Docker)",
        "status": "running",
        "version": "1.0.0",
        "environment": "docker"
    }

@app.get("/api/scheduler/status/{api_name}")
async def get_api_status(api_name: str):
    """個別API自動処理状況取得"""
    config = load_config()
    api_config = config["apis"].get(api_name, {
        "enabled": False,
        "interval": 3,
        "timeout": 300,
        "max_files": 100
    })
    
    execution_info = get_last_execution_info(api_name)
    
    return {
        "enabled": api_config.get("enabled", False),
        "interval": api_config.get("interval", 3),
        "timeout": api_config.get("timeout", 300),
        "max_files": api_config.get("max_files", 100),
        "nextRun": calculate_next_run(api_config.get("interval", 3)) if api_config.get("enabled") else None,
        **execution_info
    }

@app.post("/api/scheduler/toggle/{api_name}")
async def toggle_api_scheduler(api_name: str, scheduler_config: SchedulerConfig):
    """自動処理ON/OFF切り替え"""
    config = load_config()
    
    # API設定更新
    config["apis"][api_name] = {
        "enabled": scheduler_config.enabled,
        "interval": scheduler_config.interval,
        "timeout": scheduler_config.timeout,
        "max_files": scheduler_config.max_files,
        "updated_at": datetime.now().isoformat()
    }
    
    # 設定保存
    save_config(config)
    
    # cron設定更新
    update_cron_jobs(config)
    
    logger.info(f"{api_name}の自動処理設定を更新: {scheduler_config.enabled}")
    
    return {
        "status": "updated",
        "api_name": api_name,
        "config": config["apis"][api_name]
    }

@app.get("/api/scheduler/global")
async def get_global_status():
    """全体状況取得"""
    config = load_config()
    
    api_statuses = {}
    for api_name in config["apis"].keys():
        api_statuses[api_name] = await get_api_status(api_name)
    
    return {
        "global": config.get("global", {}),
        "apis": api_statuses,
        "total_apis": len(config["apis"]),
        "enabled_apis": sum(1 for api in config["apis"].values() if api.get("enabled", False))
    }

@app.get("/api/scheduler/cron")
async def get_cron_config():
    """現在のcron設定を取得"""
    try:
        if os.path.exists(CRON_FILE):
            with open(CRON_FILE, 'r') as f:
                cron_content = f.read()
            return {
                "status": "ok",
                "content": cron_content,
                "file_path": CRON_FILE
            }
        else:
            return {
                "status": "not_found",
                "content": "",
                "file_path": CRON_FILE
            }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "file_path": CRON_FILE
        }

if __name__ == "__main__":
    # ポート8015で起動
    uvicorn.run(app, host="0.0.0.0", port=8015)