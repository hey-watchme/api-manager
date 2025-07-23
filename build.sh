#!/bin/bash

# WatchMe API Manager ビルドスクリプト

echo "🏗️  WatchMe API Manager をビルドしています..."

# 依存関係確認
if [ ! -d "node_modules" ]; then
    echo "📦 依存関係をインストールしています..."
    npm install
fi

# 既存のdistディレクトリを削除
if [ -d "dist" ]; then
    echo "🗑️  既存のビルドファイルを削除しています..."
    rm -rf dist
fi

# ビルド実行
echo "⚡ ビルドを実行しています..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ ビルド成功！"
    echo "📁 ビルドファイル: ./dist/"
    echo "🚀 本番確認: npm start"
else
    echo "❌ ビルド失敗"
    exit 1
fi