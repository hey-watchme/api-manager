#!/usr/bin/env python3
"""
behavior-aggregator API テストスクリプト
本番環境での問題を特定するためのデバッグツール
"""

import requests
import json
from datetime import date
import sys

# デフォルトのデバイスID（run-api-process-docker.pyと同じ）
DEFAULT_DEVICE_ID = 'm5cddc22-4f52-4d0d-8a7a-cda8b88e33fa'

def test_local_api():
    """ローカル環境でのテスト（開発用）"""
    print("\n=== ローカル環境テスト ===")
    url = "http://localhost:8010/analysis/sed"
    test_api(url, "ローカル")

def test_production_api():
    """本番環境へのテスト（外部からのアクセス）"""
    print("\n=== 本番環境テスト（外部アクセス） ===")
    url = "https://api.hey-watch.me/behavior-aggregator/analysis/sed"
    test_api(url, "本番（外部）")

def test_docker_api():
    """Docker環境でのテスト（コンテナ間通信をシミュレート）"""
    print("\n=== Docker環境テスト（コンテナ間通信） ===")
    print("注意: このテストは本番サーバー上で実行する必要があります")
    url = "http://api-sed-aggregator:8010/analysis/sed"
    test_api(url, "Docker（内部）")

def test_api(url, env_name):
    """APIテスト実行"""
    # テストデータ
    test_data = {
        "device_id": DEFAULT_DEVICE_ID,
        "date": date.today().strftime("%Y-%m-%d")
    }
    
    print(f"\nテスト環境: {env_name}")
    print(f"URL: {url}")
    print(f"リクエストデータ: {json.dumps(test_data, indent=2)}")
    print("-" * 50)
    
    try:
        # POSTリクエスト送信
        response = requests.post(
            url,
            json=test_data,
            timeout=30
        )
        
        print(f"ステータスコード: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ 成功!")
            result = response.json()
            print(f"レスポンス: {json.dumps(result, indent=2, ensure_ascii=False)}")
        else:
            print("❌ エラー!")
            print(f"レスポンス: {response.text}")
            
    except requests.exceptions.ConnectionError as e:
        print("❌ 接続エラー!")
        print(f"詳細: {e}")
        print("\n考えられる原因:")
        print("1. APIサーバーが起動していない")
        print("2. ネットワーク設定の問題")
        print("3. コンテナ名が間違っている（Docker環境の場合）")
        
    except requests.exceptions.Timeout:
        print("❌ タイムアウト!")
        print("APIの処理に時間がかかりすぎています")
        
    except Exception as e:
        print(f"❌ 予期しないエラー: {e}")

def check_docker_network():
    """Dockerネットワーク接続確認コマンドを表示"""
    print("\n" + "=" * 60)
    print("📋 本番サーバーで実行すべき確認コマンド:")
    print("=" * 60)
    
    commands = [
        "# 1. api-sed-aggregatorコンテナが存在するか確認",
        "docker ps | grep api-sed-aggregator",
        "",
        "# 2. コンテナがwatchme-networkに接続されているか確認",
        "docker network inspect watchme-network | grep -A 5 api-sed-aggregator",
        "",
        "# 3. コンテナ間の接続テスト（scheduler-prodから）",
        "docker exec watchme-scheduler-prod ping -c 1 api-sed-aggregator",
        "",
        "# 4. APIエンドポイントの直接テスト",
        "docker exec watchme-scheduler-prod curl -X POST http://api-sed-aggregator:8010/analysis/sed \\",
        "  -H 'Content-Type: application/json' \\",
        "  -d '{\"device_id\": \"m5cddc22-4f52-4d0d-8a7a-cda8b88e33fa\", \"date\": \"2025-08-11\"}'",
        "",
        "# 5. スケジューラーのログ確認（8月11日の実行ログ）",
        "grep '2025-08-11' /var/log/scheduler/scheduler-behavior-aggregator.log | tail -20",
        "",
        "# 6. コンテナのログ確認",
        "docker logs api-sed-aggregator --tail 50",
        "",
        "# 7. ネットワーク接続の修正（必要な場合）",
        "docker network connect watchme-network api-sed-aggregator",
    ]
    
    for cmd in commands:
        print(cmd)

def main():
    """メイン処理"""
    print("=" * 60)
    print("🔍 behavior-aggregator API デバッグツール")
    print("=" * 60)
    
    if len(sys.argv) > 1:
        env = sys.argv[1].lower()
        if env == "local":
            test_local_api()
        elif env == "production":
            test_production_api()
        elif env == "docker":
            test_docker_api()
        else:
            print(f"不明な環境: {env}")
            print("使用方法: python test-behavior-aggregator.py [local|production|docker]")
    else:
        # デフォルトは本番環境をテスト
        test_production_api()
    
    # 確認コマンドを表示
    check_docker_network()

if __name__ == "__main__":
    main()