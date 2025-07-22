#!/bin/bash

# API Manager ステータス確認スクリプト

echo "🔍 WatchMe API Manager ステータス確認"
echo "=================================="
echo ""

# ポートの使用状況
echo "📡 ポート使用状況:"
echo -n "   ポート 9001 (Web): "
if lsof -i :9001 > /dev/null 2>&1; then
    echo "✅ 使用中"
    lsof -i :9001 | grep LISTEN | head -1
else
    echo "❌ 未使用"
fi

echo -n "   ポート 3001 (API): "
if lsof -i :3001 > /dev/null 2>&1; then
    echo "✅ 使用中"
    lsof -i :3001 | grep LISTEN | head -1
else
    echo "❌ 未使用"
fi

echo ""

# プロセスの確認
echo "⚙️  実行中のプロセス:"
PROCESSES=$(ps aux | grep -E "watchme-api-manager|nodemon|vite.*9001|concurrently" | grep -v grep | grep -v status.sh)
if [ ! -z "$PROCESSES" ]; then
    echo "$PROCESSES" | while read line; do
        PID=$(echo $line | awk '{print $2}')
        CMD=$(echo $line | awk '{for(i=11;i<=NF;i++) printf "%s ", $i}')
        echo "   PID: $PID - $CMD"
    done
else
    echo "   プロセスが実行されていません"
fi

echo ""

# ヘルスチェック
echo "🏥 ヘルスチェック:"
echo -n "   APIサーバー: "
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    HEALTH=$(curl -s http://localhost:3001/health)
    echo "✅ 正常 - $HEALTH"
else
    echo "❌ 応答なし"
fi

echo -n "   Webサーバー: "
if curl -s http://localhost:9001 > /dev/null 2>&1; then
    echo "✅ 正常"
elif curl -s "http://[::1]:9001" > /dev/null 2>&1; then
    echo "✅ 正常 (IPv6)"
else
    echo "❌ 応答なし"
fi

echo ""

# ログファイルの確認
if [ -f "start.log" ]; then
    echo "📄 最新のログ (start.log):"
    echo "----------------------------"
    tail -10 start.log | sed 's/^/   /'
    echo "----------------------------"
fi

echo ""
echo "💡 ヒント:"
echo "   起動: ./start.sh"
echo "   停止: ./stop.sh"
echo "   ログ確認: tail -f start.log"