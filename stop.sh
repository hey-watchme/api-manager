#!/bin/bash

# API Manager 停止スクリプト

# スクリプトのあるディレクトリに移動
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "🛑 WatchMe API Manager を停止しています..."

# ポート9001を使用しているプロセスを停止
if lsof -i :9001 > /dev/null 2>&1; then
    echo "📍 ポート9001のプロセスを停止中..."
    lsof -ti :9001 | xargs kill -9 2>/dev/null
fi

# ポート3000を使用しているプロセスを停止
if lsof -i :3000 > /dev/null 2>&1; then
    echo "📍 ポート3000のプロセスを停止中..."
    lsof -ti :3000 | xargs kill -9 2>/dev/null
fi

echo "✅ API Manager が停止しました。"