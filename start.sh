#!/bin/bash

# API Manager 起動スクリプト

# スクリプトのあるディレクトリに移動
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "🚀 WatchMe API Manager を起動しています..."

# 既存プロセスのクリーンアップ
echo "🔍 既存プロセスをチェック中..."
./stop.sh

# ポート競合チェック
check_port() {
    local port=$1
    if lsof -i :$port > /dev/null 2>&1; then
        echo "⚠️  ポート$portが使用中です。プロセスを停止します..."
        lsof -ti :$port | xargs kill -9 2>/dev/null
        sleep 1
    fi
}

check_port 9001
check_port 3001

# 設定ファイルの整合性チェック
echo "🔧 設定ファイルをチェック中..."

# vite.config.jsのプロキシ設定をチェック
if grep -q "target: 'http://localhost:3000'" vite.config.js; then
    echo "⚠️  vite.config.jsのプロキシ設定を修正中..."
    sed -i '' "s/target: 'http:\/\/localhost:3000'/target: 'http:\/\/localhost:3001'/" vite.config.js
    echo "✅ プロキシ設定を3001番ポートに修正しました"
fi

# .envファイルのPORT設定をチェック
if ! grep -q "^PORT=3001" .env; then
    echo "⚠️  .envファイルにPORT設定を追加中..."
    if grep -q "^PORT=" .env; then
        # 既存のPORT設定を更新
        sed -i '' "s/^PORT=.*/PORT=3001/" .env
    else
        # 新しくPORT設定を追加
        echo "" >> .env
        echo "# サーバーポート設定" >> .env
        echo "PORT=3001" >> .env
    fi
    echo "✅ .envファイルにPORT=3001を設定しました"
fi

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
echo "📍 API Base URL: https://api.hey-watch.me (本番環境)"
echo ""
echo "💡 起動確認: curl http://localhost:3001/health でヘルスチェック可能"
echo ""
echo "終了するには Ctrl+C を押してください"
echo ""

# 起動と起動確認
npm run dev &
DEV_PID=$!

# 3秒待って起動確認
sleep 3
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo ""
    echo "✅ サーバーが正常に起動しました！"
    echo "🌐 ブラウザで http://localhost:9001 を開いてください"
else
    echo ""
    echo "⚠️  サーバーの起動確認ができませんでした。ログを確認してください。"
fi

# プロセスを前面に戻す
wait $DEV_PID