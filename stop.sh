#!/bin/bash

# API Manager 停止スクリプト

# スクリプトのあるディレクトリに移動
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "🛑 WatchMe API Manager を停止しています..."

# 関連プロセスを特定して停止
stop_processes() {
    local port=$1
    local service_name=$2
    
    if lsof -i :$port > /dev/null 2>&1; then
        echo "📍 $service_name (ポート$port) を停止中..."
        lsof -ti :$port | xargs kill -9 2>/dev/null
        sleep 1
        
        # 停止確認
        if ! lsof -i :$port > /dev/null 2>&1; then
            echo "✅ $service_name を停止しました"
        else
            echo "⚠️  $service_name の停止に失敗しました"
        fi
    fi
}

# プロジェクト関連のnodeプロセスを停止
echo "🔍 プロジェクト関連プロセスを検索中..."
PROJECT_PIDS=$(ps aux | grep "watchme-api-manager\|nodemon\|vite.*9001\|concurrently" | grep -v grep | awk '{print $2}')

if [ ! -z "$PROJECT_PIDS" ]; then
    echo "📍 プロジェクト関連プロセスを停止中..."
    echo "$PROJECT_PIDS" | xargs kill -9 2>/dev/null
    sleep 1
fi

# ポート別停止
stop_processes 9001 "フロントエンド"
stop_processes 3001 "APIプロキシ"

# 追加クリーンアップ: 残存するnodemonプロセス
if pgrep -f "nodemon.*api-manager" > /dev/null; then
    echo "📍 残存するnodemonプロセスを停止中..."
    pkill -f "nodemon.*api-manager" 2>/dev/null
fi

echo "✅ API Manager が停止しました。"