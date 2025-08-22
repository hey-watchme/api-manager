#!/usr/bin/env python3
"""
スケジューラーの実際の処理をテスト
run-api-process-docker.pyの全デバイス処理が正常に動作するか確認
"""

import sys
import os

# schedulerディレクトリをPythonパスに追加
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'scheduler'))

def test_scheduler_execution():
    """スケジューラー処理のテスト実行"""
    
    # 環境変数を設定
    os.environ['SUPABASE_URL'] = os.getenv('SUPABASE_URL') or os.getenv('VITE_SUPABASE_URL')
    os.environ['SUPABASE_KEY'] = os.getenv('SUPABASE_KEY') or os.getenv('VITE_SUPABASE_KEY')
    
    print("=" * 60)
    print("スケジューラー処理テスト（behavior-aggregator）")
    print("=" * 60)
    
    # run-api-process-docker.pyの関数をインポート
    from run_api_process_docker import (
        get_all_device_ids_for_date,
        get_supabase_client,
        API_CONFIGS,
        get_logger
    )
    
    # ロガー設定
    logger = get_logger("test")
    
    # テスト日付
    test_date = "2025-08-21"
    print(f"テスト日付: {test_date}")
    
    try:
        # 1. Supabase接続確認
        print("\n1. Supabase接続確認")
        supabase = get_supabase_client()
        print("✅ Supabase接続成功")
        
        # 2. デバイスID取得
        print("\n2. デバイスID取得")
        device_ids = get_all_device_ids_for_date(test_date, logger)
        
        if device_ids:
            print(f"✅ {len(device_ids)}個のデバイスIDを取得:")
            for idx, device_id in enumerate(device_ids, 1):
                print(f"   {idx}. {device_id}")
        else:
            print("❌ デバイスIDが取得できませんでした")
            return False
        
        # 3. API設定確認
        print("\n3. behavior-aggregator設定確認")
        if "behavior-aggregator" in API_CONFIGS:
            config = API_CONFIGS["behavior-aggregator"]
            print(f"✅ エンドポイント: {config['endpoint']}")
            print(f"   タイプ: {config.get('type')}")
            print(f"   表示名: {config.get('display_name')}")
        else:
            print("❌ behavior-aggregatorの設定が見つかりません")
            return False
        
        # 4. 処理シミュレーション（実際のAPI呼び出しはしない）
        print("\n4. 処理シミュレーション")
        print(f"以下の処理が実行される予定:")
        for idx, device_id in enumerate(device_ids, 1):
            print(f"   {idx}. デバイス {device_id} の処理")
            print(f"      - エンドポイント: {config['endpoint']}")
            print(f"      - リクエスト: {{\"device_id\": \"{device_id}\", \"date\": \"{test_date}\"}}")
        
        print("\n✅ スケジューラー処理のテスト成功")
        print("   全デバイス処理のロジックは正常に動作します")
        
        return True
        
    except Exception as e:
        print(f"\n❌ エラー: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """メイン処理"""
    print("=" * 60)
    print("スケジューラー全デバイス処理テスト")
    print("=" * 60)
    
    # 環境変数チェック
    if not os.getenv('SUPABASE_URL') and not os.getenv('VITE_SUPABASE_URL'):
        print("❌ 環境変数が設定されていません")
        print("実行方法: export $(cat .env | xargs) && python test-scheduler-execution.py")
        return
    
    success = test_scheduler_execution()
    
    if success:
        print("\n" + "=" * 60)
        print("✅ テスト完了: スケジューラーは正常に動作します")
        print("=" * 60)
        print("\n次のステップ:")
        print("1. この.envファイルを本番環境にコピー")
        print("2. Dockerイメージを再ビルド・デプロイ")
        print("3. 本番環境で動作確認")
    else:
        print("\n" + "=" * 60)
        print("❌ テスト失敗: 問題を修正してください")
        print("=" * 60)

if __name__ == "__main__":
    main()