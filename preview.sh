#!/bin/bash

# WatchMe API Manager プレビュースクリプト

echo "👀 WatchMe API Manager（本番ビルド）をプレビューしています..."

# distディレクトリが存在するか確認
if [ ! -d "dist" ]; then
    echo "📦 ビルドファイルが見つかりません。ビルドを実行します..."
    ./build.sh
fi

echo "🌟 本番プレビューサーバーを起動します..."
echo "📍 URL: http://localhost:9001"
echo "🔗 API: https://api.hey-watch.me (直接接続)"
echo ""
echo "🛑 終了するには Ctrl+C を押してください"
echo ""

# プレビュー起動
npm start