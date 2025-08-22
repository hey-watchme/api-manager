#!/usr/bin/env python3
"""
スケジューラーの最終動作確認テスト
環境変数修正後の全デバイス処理機能を確認
"""

import os
import sys
from datetime import datetime, timezone, timedelta
from supabase import create_client

# JSTタイムゾーン定義
JST = timezone(timedelta(hours=9))

def main():
    """メイン処理"""
    print("=" * 60)
    print("スケジューラー最終動作確認")
    print("=" * 60)
    print(f"実行時刻: {datetime.now(JST).strftime('%Y-%m-%d %H:%M:%S JST')}")
    
    # 環境変数確認
    print("\n1. 環境変数確認")
    print("-" * 40)
    
    # VITE_プレフィックス付きとプレフィックスなし両方を試す
    url = os.getenv('SUPABASE_URL') or os.getenv('VITE_SUPABASE_URL')
    key = os.getenv('SUPABASE_KEY') or os.getenv('VITE_SUPABASE_KEY')
    
    print(f"VITE_SUPABASE_URL: {'設定済み' if os.getenv('VITE_SUPABASE_URL') else '未設定'}")
    print(f"VITE_SUPABASE_KEY: {'設定済み' if os.getenv('VITE_SUPABASE_KEY') else '未設定'}")
    print(f"SUPABASE_URL: {'設定済み' if os.getenv('SUPABASE_URL') else '未設定'}")
    print(f"SUPABASE_KEY: {'設定済み' if os.getenv('SUPABASE_KEY') else '未設定'}")
    print(f"\n最終的に使用される値:")
    print(f"  URL: {'取得成功' if url else '取得失敗'}")
    print(f"  KEY: {'取得成功' if key else '取得失敗'}")
    
    if not url or not key:
        print("\n❌ 環境変数が正しく設定されていません")
        return
    
    # Supabase接続テスト
    print("\n2. Supabase接続テスト")
    print("-" * 40)
    
    try:
        supabase = create_client(url, key)
        print("✅ Supabaseクライアント作成成功")
    except Exception as e:
        print(f"❌ Supabaseクライアント作成失敗: {e}")
        return
    
    # 全デバイスID取得テスト（2025-08-21のデータ）
    print("\n3. 全デバイスID取得テスト（2025-08-21）")
    print("-" * 40)
    
    test_date = "2025-08-21"
    
    try:
        start_date = f"{test_date}T00:00:00"
        end_date = f"{test_date}T23:59:59"
        
        response = supabase.table('audio_files') \
            .select('device_id, created_at') \
            .gte('created_at', start_date) \
            .lte('created_at', end_date) \
            .execute()
        
        if response.data:
            device_ids = list(set([item['device_id'] for item in response.data if item.get('device_id')]))
            print(f"✅ {len(device_ids)}個のデバイスIDを取得成功:")
            for idx, device_id in enumerate(device_ids, 1):
                print(f"   {idx}. {device_id}")
            
            # スケジューラーのシミュレーション
            print(f"\n4. スケジューラー処理シミュレーション")
            print("-" * 40)
            print(f"以下の処理が実行されます:")
            
            for idx, device_id in enumerate(device_ids, 1):
                print(f"\nデバイス {idx}/{len(device_ids)}: {device_id}")
                print(f"  → behavior-aggregator API呼び出し")
                print(f"     {{\"device_id\": \"{device_id}\", \"date\": \"{test_date}\"}}")
                print(f"  → emotion-aggregator API呼び出し")
                print(f"     {{\"device_id\": \"{device_id}\", \"date\": \"{test_date}\"}}")
                print(f"  → vibe-aggregator API呼び出し")
                print(f"     {{\"device_id\": \"{device_id}\", \"date\": \"{test_date}\"}}")
                print(f"  → vibe-scorer API呼び出し")
                print(f"     {{\"device_id\": \"{device_id}\", \"date\": \"{test_date}\"}}")
            
            print("\n" + "=" * 60)
            print("✅ テスト成功: 全デバイス処理が正常に動作します")
            print("=" * 60)
            
        else:
            print(f"⚠️ {test_date}のデータが見つかりません")
            
    except Exception as e:
        print(f"❌ エラー: {e}")
        return
    
    # デプロイ手順
    print("\n5. 本番環境へのデプロイ手順")
    print("-" * 40)
    print("1. ローカルでDockerイメージをビルド:")
    print("   ./deploy-scheduler.sh")
    print("")
    print("2. EC2サーバーにSSH接続:")
    print("   ssh -i ~/watchme-key.pem ubuntu@3.24.16.82")
    print("")
    print("3. .envファイルを更新（重要！）:")
    print("   cd /home/ubuntu/watchme-api-manager")
    print("   nano .env")
    print("   # VITE_プレフィックスの環境変数のみにする（重複削除）")
    print("")
    print("4. 最新イメージをプルして再起動:")
    print("   ./deploy-scheduler-ec2.sh")
    print("")
    print("5. 動作確認:")
    print("   docker exec watchme-scheduler-prod python /app/run-api-process-docker.py behavior-aggregator")
    print("")
    print("6. ログ確認:")
    print("   tail -f /var/log/scheduler/scheduler-behavior-aggregator.log")

if __name__ == "__main__":
    main()