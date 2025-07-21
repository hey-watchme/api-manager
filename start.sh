#!/bin/bash

# API Manager 起動スクリプト

# スクリプトのあるディレクトリに移動
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "🚀 WatchMe API Manager を起動しています..."

# 依存関係の確認
if [ ! -d "node_modules" ]; then
    echo "📦 依存関係をインストールしています..."
    npm install
fi

# .envファイルの確認
if [ ! -f ".env" ]; then
    echo "⚠️  .envファイルが見つかりません。.env.exampleからコピーします..."
    cp .env.example .env
    echo "📝 .envファイルを作成しました。必要に応じて設定を更新してください。"
fi

# サーバーの起動
echo "🌟 開発サーバーを起動します..."
echo "📍 アプリケーション: http://localhost:9001"
echo "📍 APIプロキシ: http://localhost:3001"
echo ""
echo "終了するには Ctrl+C を押してください"
echo ""

npm run dev