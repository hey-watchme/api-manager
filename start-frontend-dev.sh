#!/bin/bash

# API Manager フロントエンド開発サーバーをバックグラウンドで起動

echo "🚀 API Manager フロントエンド開発サーバーを起動しています..."
echo "📍 フロントエンドのみ（React + Vite）"
echo ""

# 既存のプロセスを停止（ポート9001をチェック）
if lsof -i :9001 > /dev/null 2>&1; then
    echo "⏹️  既存のプロセスを停止中..."
    lsof -ti:9001 | xargs kill -TERM 2>/dev/null || true
    sleep 2
fi

# 依存関係の確認
if [ ! -d "node_modules" ]; then
    echo "📦 依存関係をインストール中..."
    npm install
fi

# バックグラウンドで起動
echo "🌟 バックグラウンドで起動中..."
nohup npm run dev > api-manager.log 2>&1 &
echo $! > api-manager.pid

# 起動確認（3秒待機）
sleep 3

if lsof -i :9001 > /dev/null 2>&1; then
    echo "✅ フロントエンド開発サーバーが起動しました！"
    echo "📍 URL: http://localhost:9001"
    echo "📋 ログ: tail -f api-manager.log"
    echo "🛑 停止: Ctrl+C または kill \$(cat api-manager.pid)"
    echo ""
    echo "🌐 ブラウザでアクセスしてください: http://localhost:9001"
else
    echo "❌ 起動に失敗しました"
    echo "📋 ログを確認: cat api-manager.log"
fi