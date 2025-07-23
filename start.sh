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
echo "🛑 終了するには Ctrl+C を押してください"
echo ""

# Vite起動
npm run dev