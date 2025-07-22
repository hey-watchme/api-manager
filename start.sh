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

# vite.config.jsのhost設定を確認
if ! grep -q "host: '0.0.0.0'" vite.config.js; then
    echo "⚠️  vite.config.jsにhost設定がありません。localhostでのアクセスに問題が発生する可能性があります。"
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
    echo "❌ .envファイルが見つかりません。.envファイルを作成してください。"
    exit 1
fi

# サーバーの起動
echo "🌟 開発サーバーを起動します..."
echo "📍 アプリケーション: http://localhost:9001"
echo "📍 APIプロキシ: http://localhost:3001"
echo "📍 API Base URL: https://api.hey-watch.me (本番環境)"
echo ""
echo "💡 起動確認: curl http://localhost:3001/health でヘルスチェック可能"
echo ""
echo ""
echo "🛑 終了するには Ctrl+C を押してください"
echo "🔄 再起動するには ./start.sh を実行してください"
echo ""

# ログファイルの準備
LOG_FILE="start.log"
echo "" > $LOG_FILE

# 起動と起動確認
echo "🔄 サーバーを起動中..."
npm run dev 2>&1 | tee -a $LOG_FILE &
DEV_PID=$!

# 起動待機（最大10秒）
echo -n "  起動待機中 "
for i in {1..10}; do
    sleep 1
    echo -n "."
    
    # 両方のポートがリッスンされているか確認
    if lsof -i :9001 > /dev/null 2>&1 && lsof -i :3001 > /dev/null 2>&1; then
        echo " ✅"
        break
    fi
done
echo ""

# 詳細な起動確認
# APIサーバーのヘルスチェック
echo "🏥 APIサーバーの状態を確認中..."
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "   ✅ APIサーバー (3001) - 正常"
else
    echo "   ❌ APIサーバー (3001) - エラー"
    API_ERROR=true
fi

# Viteサーバーの確認
echo "🌐 Webサーバーの状態を確認中..."
# IPv4とIPv6の両方を試す
if curl -s http://localhost:9001 > /dev/null 2>&1 || curl -s "http://[::1]:9001" > /dev/null 2>&1; then
    echo "   ✅ Webサーバー (9001) - 正常"
else
    echo "   ❌ Webサーバー (9001) - エラー"
    WEB_ERROR=true
fi

echo ""

# 結果表示
if [ -z "$API_ERROR" ] && [ -z "$WEB_ERROR" ]; then
    echo "✅ サーバーが正常に起動しました！"
    echo "🌐 ブラウザで http://localhost:9001 を開いてください"
    echo ""
    echo "📊 ネットワークアドレス:"
    # ネットワークIPを表示
    NETWORK_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
    if [ ! -z "$NETWORK_IP" ]; then
        echo "   http://$NETWORK_IP:9001"
    fi
else
    echo "⚠️  サーバーの起動に問題があります。"
    echo ""
    echo "🔍 トラブルシューティング:"
    echo "   1. ポートの使用状況を確認: lsof -i :9001 && lsof -i :3001"
    echo "   2. ログを確認: tail -n 50 $LOG_FILE"
    echo "   3. プロセスを確認: ps aux | grep -E 'vite|nodemon'"
    echo "   4. 手動で起動: npm run dev"
fi

# プロセスを前面に戻す
wait $DEV_PID