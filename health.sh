#!/bin/bash

# WatchMe API Manager ヘルスチェックスクリプト

echo "🏥 WatchMe API Manager ヘルスチェック"
echo ""

# ローカルサーバーチェック
echo "📍 ローカルサーバー確認..."
if curl -s http://localhost:9001 > /dev/null 2>&1; then
    echo "   ✅ ローカルサーバー (9001): 正常"
else
    echo "   ❌ ローカルサーバー (9001): 停止中"
fi

# 本番APIチェック
echo "🔗 本番API接続確認..."

# Behavior Features API
if curl -s https://api.hey-watch.me/behavior-features/ > /dev/null 2>&1; then
    echo "   ✅ Behavior Features API: 正常"
else
    echo "   ❌ Behavior Features API: 接続失敗"
fi

# Transcriber API
if curl -s https://api.hey-watch.me/vibe-transcriber/ > /dev/null 2>&1; then
    echo "   ✅ Vibe Transcriber API: 正常"
else
    echo "   ❌ Vibe Transcriber API: 接続失敗"
fi

echo ""
echo "📊 プロセス確認..."
VITE_PIDS=$(lsof -ti:9001 2>/dev/null || echo "")
if [ ! -z "$VITE_PIDS" ]; then
    echo "   ✅ Viteプロセス: 稼働中 (PID: $VITE_PIDS)"
else
    echo "   ⚪ Viteプロセス: 停止中"
fi