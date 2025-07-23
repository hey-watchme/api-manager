#!/bin/bash

echo "🛑 WatchMe API Manager を停止しています..."

# Viteプロセス（9001番ポート）を停止
PIDS=$(lsof -ti:9001 2>/dev/null || true)
if [ ! -z "$PIDS" ]; then
    echo "📍 Viteサーバー (9001) を停止中..."
    echo "$PIDS" | xargs kill -TERM 2>/dev/null || true
    sleep 1
    echo "$PIDS" | xargs kill -9 2>/dev/null || true
fi

# 関連プロセスを停止
npm_pids=$(ps aux | grep -E 'vite.*--port.*9001|npm.*dev' | grep -v grep | awk '{print $2}')
if [ ! -z "$npm_pids" ]; then
    echo "📍 関連プロセスを停止中..."
    echo "$npm_pids" | xargs kill -TERM 2>/dev/null || true
    sleep 1
    echo "$npm_pids" | xargs kill -9 2>/dev/null || true
fi

echo "✅ 停止完了"