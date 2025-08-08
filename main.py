#!/usr/bin/env python3
"""
WatchMe API Manager Server
複数のマイクロサービスAPIを統合管理するためのFastAPIサーバー
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Dict, List, Optional
import os
import logging
import httpx
from datetime import datetime

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="WatchMe API Manager",
    description="WatchMe Platform API統合管理システム",
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

# 静的ファイルのマウント（Reactビルド済みファイル）
app.mount("/static", StaticFiles(directory="dist/assets"), name="static")

# APIの定義
API_CONFIGS = {
    "whisper-transcriber": {
        "name": "Whisper Transcriber",
        "description": "OpenAI Whisperによる音声文字起こし",
        "category": "psychology",
        "url": "https://api.hey-watch.me/whisper-transcriber",
        "health_endpoint": "/health"
    },
    "azure-transcriber": {
        "name": "Azure Transcriber",
        "description": "Azure Speech Servicesによる音声文字起こし",
        "category": "psychology",
        "url": "https://api.hey-watch.me/azure-transcriber",
        "health_endpoint": "/health"
    },
    "vibe-aggregator": {
        "name": "Vibe Aggregator",
        "description": "プロンプト生成と集約",
        "category": "psychology",
        "url": "https://api.hey-watch.me/vibe-aggregator",
        "health_endpoint": "/health"
    },
    "vibe-scorer": {
        "name": "Vibe Scorer",
        "description": "心理状態スコアリング",
        "category": "psychology",
        "url": "https://api.hey-watch.me/vibe-scorer",
        "health_endpoint": "/health"
    },
    "behavior-features": {
        "name": "Behavior Features",
        "description": "SED音響イベント検出",
        "category": "behavior",
        "url": "https://api.hey-watch.me/behavior-features",
        "health_endpoint": "/health"
    },
    "behavior-aggregator": {
        "name": "Behavior Aggregator",
        "description": "行動データ分析と集約",
        "category": "behavior",
        "url": "https://api.hey-watch.me/behavior-aggregator",
        "health_endpoint": "/health"
    },
    "emotion-features": {
        "name": "Emotion Features",
        "description": "OpenSMILE感情特徴抽出",
        "category": "emotion",
        "url": "https://api.hey-watch.me/emotion-features",
        "health_endpoint": "/health"
    },
    "emotion-aggregator": {
        "name": "Emotion Aggregator",
        "description": "感情データ分析と集約",
        "category": "emotion",
        "url": "https://api.hey-watch.me/emotion-aggregator",
        "health_endpoint": "/health"
    }
}

# リクエストモデル
class ProcessRequest(BaseModel):
    api_name: str
    files: List[str]
    options: Optional[Dict] = {}

class ApiStatusResponse(BaseModel):
    name: str
    status: str
    description: str
    category: str
    url: str
    last_check: Optional[datetime] = None
    response_time: Optional[float] = None

# ヘルパー関数
async def check_api_health(api_key: str) -> Dict:
    """APIのヘルスチェック"""
    config = API_CONFIGS.get(api_key)
    if not config:
        return {"status": "unknown", "error": "API not found"}
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            start_time = datetime.now()
            response = await client.get(f"{config['url']}{config['health_endpoint']}")
            response_time = (datetime.now() - start_time).total_seconds()
            
            if response.status_code == 200:
                return {
                    "status": "healthy",
                    "response_time": response_time,
                    "last_check": datetime.now()
                }
            else:
                return {
                    "status": "unhealthy",
                    "status_code": response.status_code,
                    "last_check": datetime.now()
                }
    except httpx.TimeoutException:
        return {"status": "timeout", "error": "Request timeout"}
    except Exception as e:
        return {"status": "error", "error": str(e)}

# APIエンドポイント
@app.get("/")
async def serve_react_app():
    """Reactアプリケーションの提供"""
    return FileResponse("index.html")

@app.get("/api/health")
async def health_check():
    """APIマネージャー自体のヘルスチェック"""
    return {
        "name": "WatchMe API Manager",
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": datetime.now()
    }

@app.get("/api/apis")
async def list_apis():
    """管理対象API一覧の取得"""
    apis = []
    for key, config in API_CONFIGS.items():
        apis.append({
            "key": key,
            "name": config["name"],
            "description": config["description"],
            "category": config["category"],
            "url": config["url"]
        })
    return {"apis": apis}

@app.get("/api/apis/{api_name}/status")
async def get_api_status(api_name: str):
    """特定APIの状態確認"""
    if api_name not in API_CONFIGS:
        raise HTTPException(status_code=404, detail="API not found")
    
    config = API_CONFIGS[api_name]
    health_status = await check_api_health(api_name)
    
    return ApiStatusResponse(
        name=config["name"],
        status=health_status.get("status", "unknown"),
        description=config["description"],
        category=config["category"],
        url=config["url"],
        last_check=health_status.get("last_check"),
        response_time=health_status.get("response_time")
    )

@app.get("/api/status/all")
async def get_all_api_status():
    """全APIの状態確認"""
    statuses = {}
    for api_key in API_CONFIGS.keys():
        health_status = await check_api_health(api_key)
        statuses[api_key] = {
            "name": API_CONFIGS[api_key]["name"],
            "status": health_status.get("status", "unknown"),
            "response_time": health_status.get("response_time"),
            "last_check": health_status.get("last_check")
        }
    
    healthy_count = sum(1 for s in statuses.values() if s["status"] == "healthy")
    
    return {
        "total": len(statuses),
        "healthy": healthy_count,
        "unhealthy": len(statuses) - healthy_count,
        "apis": statuses
    }

@app.post("/api/process")
async def process_files(request: ProcessRequest):
    """ファイル処理の実行（プロキシ）"""
    if request.api_name not in API_CONFIGS:
        raise HTTPException(status_code=404, detail="API not found")
    
    config = API_CONFIGS[request.api_name]
    
    try:
        # 対象APIに処理をリクエスト
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                f"{config['url']}/api/process",
                json={
                    "files": request.files,
                    "options": request.options
                }
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"API処理エラー: {response.text}"
                )
    
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="処理タイムアウト")
    except Exception as e:
        logger.error(f"処理エラー: {str(e)}")
        raise HTTPException(status_code=500, detail=f"処理エラー: {str(e)}")

# Reactアプリケーションのフォールバック
@app.get("/{full_path:path}")
async def serve_react_routes(full_path: str):
    """React Routerのサポート"""
    return FileResponse("index.html")

if __name__ == "__main__":
    import uvicorn
    # ポート8000で起動（本番環境ではgunicornを使用）
    uvicorn.run(app, host="0.0.0.0", port=8000)