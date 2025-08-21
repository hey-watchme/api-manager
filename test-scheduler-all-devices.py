#!/usr/bin/env python3
"""
スケジューラーの全デバイス処理をテストするスクリプト
ローカル環境でrun-api-process-docker.pyの動作を確認
"""

import sys
import os
import subprocess
from datetime import datetime, date

# スケジューラーディレクトリをPythonパスに追加
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'scheduler'))

def test_get_device_ids():
    """デバイスID取得機能のテスト"""
    print("=" * 60)
    print("1. デバイスID取得機能のテスト")
    print("=" * 60)
    
    try:
        from scheduler.run_api_process_docker import get_all_device_ids_for_date, get_supabase_client
        
        # 環境変数の確認
        if not os.getenv('SUPABASE_URL') or not os.getenv('SUPABASE_KEY'):
            print("❌ エラー: SUPABASE_URLとSUPABASE_KEYの環境変数が設定されていません")
            print("以下のコマンドで.envファイルから環境変数を読み込んでください:")
            print("export $(cat .env | xargs)")
            return False
        
        # 今日の日付でテスト
        today = date.today().strftime("%Y-%m-%d")
        print(f"テスト日付: {today}")
        
        device_ids = get_all_device_ids_for_date(today)
        
        if device_ids:
            print(f"✅ 成功: {len(device_ids)}個のデバイスIDを取得")
            for idx, device_id in enumerate(device_ids, 1):
                print(f"  {idx}. {device_id}")
        else:
            print("⚠️ 警告: デバイスIDが見つかりませんでした")
        
        return True
        
    except Exception as e:
        print(f"❌ エラー: {e}")
        return False

def test_behavior_aggregator():
    """Behavior Aggregatorの実行テスト"""
    print("\n" + "=" * 60)
    print("2. Behavior Aggregatorの実行テスト（ドライラン）")
    print("=" * 60)
    
    try:
        # run-api-process-docker.pyを直接実行
        cmd = [
            sys.executable,
            "scheduler/run-api-process-docker.py",
            "behavior-aggregator"
        ]
        
        print(f"実行コマンド: {' '.join(cmd)}")
        print("注意: これはドライランです。実際のAPIは呼び出されません。")
        print("\n実行中...")
        
        # 実際にはコメントアウトしておく（本番環境でのみ実行）
        # result = subprocess.run(cmd, capture_output=True, text=True)
        # print(result.stdout)
        # if result.stderr:
        #     print("エラー出力:", result.stderr)
        
        print("✅ テストコマンドの生成に成功")
        print("\n本番環境での実行方法:")
        print("docker exec watchme-scheduler-prod python /app/run-api-process-docker.py behavior-aggregator")
        
        return True
        
    except Exception as e:
        print(f"❌ エラー: {e}")
        return False

def check_api_config():
    """API設定の確認"""
    print("\n" + "=" * 60)
    print("3. デバイスベースAPI設定の確認")
    print("=" * 60)
    
    try:
        from scheduler.run_api_process_docker import API_CONFIGS
        
        device_based_apis = [
            "behavior-aggregator",
            "emotion-aggregator", 
            "vibe-aggregator",
            "vibe-scorer"
        ]
        
        print("デバイスベースAPIの設定:")
        for api_name in device_based_apis:
            if api_name in API_CONFIGS:
                config = API_CONFIGS[api_name]
                print(f"\n{api_name}:")
                print(f"  - エンドポイント: {config['endpoint']}")
                print(f"  - 表示名: {config.get('display_name', 'N/A')}")
                print(f"  - タイプ: {config.get('type', 'N/A')}")
                print(f"  - HTTPメソッド: {config.get('method', 'POST')}")
            else:
                print(f"\n❌ {api_name}: 設定が見つかりません")
        
        return True
        
    except Exception as e:
        print(f"❌ エラー: {e}")
        return False

def main():
    """メインテスト実行"""
    print("=" * 60)
    print("スケジューラー全デバイス処理テスト")
    print("=" * 60)
    print(f"実行時刻: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 各テストを実行
    tests = [
        ("デバイスID取得", test_get_device_ids),
        ("API設定確認", check_api_config),
        ("Behavior Aggregator実行", test_behavior_aggregator),
    ]
    
    results = []
    for test_name, test_func in tests:
        success = test_func()
        results.append((test_name, success))
    
    # 結果サマリー
    print("\n" + "=" * 60)
    print("テスト結果サマリー")
    print("=" * 60)
    
    for test_name, success in results:
        status = "✅ 成功" if success else "❌ 失敗"
        print(f"{test_name}: {status}")
    
    # デプロイ手順
    print("\n" + "=" * 60)
    print("本番環境へのデプロイ手順")
    print("=" * 60)
    print("1. ローカルでDockerイメージをビルド:")
    print("   ./deploy-scheduler.sh")
    print("")
    print("2. EC2サーバーにSSH接続:")
    print("   ssh -i ~/watchme-key.pem ubuntu@3.24.16.82")
    print("")
    print("3. 最新イメージをプルして再起動:")
    print("   cd /home/ubuntu/watchme-api-manager")
    print("   ./deploy-scheduler-ec2.sh")
    print("")
    print("4. 動作確認（1つのAPIでテスト）:")
    print("   docker exec watchme-scheduler-prod python /app/run-api-process-docker.py behavior-aggregator")
    print("")
    print("5. ログ確認:")
    print("   tail -f /var/log/scheduler/scheduler-behavior-aggregator.log")

if __name__ == "__main__":
    main()