#!/bin/bash

# WatchMe API Manager 起動スクリプト（シンプル版）

echo "🚀 WatchMe API Manager を起動しています..."
echo "📍 構成: フロントエンドのみ（直接HTTPS接続）"
echo ""

# 既存プロセス停止
./stop.sh

# 依存関係確認
if [ ! -d "node_modules" ]; then
    echo "📦 依存関係をインストールしています..."
    npm install
fi

echo "🌟 開発サーバーを起動します..."
echo "📍 URL: http://localhost:9001"
echo "🔗 API: https://api.hey-watch.me (直接接続)"
echo ""

# バックグラウンドでVite起動
nohup npm run dev > api-manager.log 2>&1 &
PID=$!

# 起動待機
echo "⏳ サーバー起動中..."
sleep 3

# 起動確認
if lsof -i :9001 > /dev/null 2>&1; then
    echo "✅ API Manager が正常に起動しました！"
    echo "📄 ログファイル: api-manager.log"
    echo "🛑 停止するには: ./stop.sh"
    echo ""
    echo "🌐 ブラウザで http://localhost:9001 にアクセスしてください"
else
    echo "❌ 起動に失敗しました"
    echo "📄 詳細はログを確認してください: tail -f api-manager.log"
    exit 1
fi