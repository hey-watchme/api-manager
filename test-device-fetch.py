#!/usr/bin/env python3
"""
デバイスID取得機能の診断スクリプト
全デバイス処理が動作しない問題を特定するため
"""

import os
import sys
from datetime import datetime, timezone, timedelta
from supabase import create_client

# JSTタイムゾーン定義
JST = timezone(timedelta(hours=9))

def test_supabase_connection():
    """Supabase接続テスト"""
    print("=" * 60)
    print("1. Supabase接続テスト")
    print("=" * 60)
    
    # VITE_プレフィックス付きとプレフィックスなし両方を試す
    url = os.getenv('SUPABASE_URL') or os.getenv('VITE_SUPABASE_URL')
    key = os.getenv('SUPABASE_KEY') or os.getenv('VITE_SUPABASE_KEY')
    
    if not url or not key:
        print("❌ 環境変数が設定されていません")
        print("   SUPABASE_URL:", "設定済み" if url else "未設定")
        print("   SUPABASE_KEY:", "設定済み" if key else "未設定")
        return None
    
    print("✅ 環境変数は設定済み")
    
    try:
        supabase = create_client(url, key)
        print("✅ Supabaseクライアント作成成功")
        return supabase
    except Exception as e:
        print(f"❌ Supabaseクライアント作成失敗: {e}")
        return None

def test_get_device_ids(supabase, test_date="2025-08-21"):
    """指定日付のデバイスID取得テスト"""
    print("\n" + "=" * 60)
    print(f"2. デバイスID取得テスト（日付: {test_date}）")
    print("=" * 60)
    
    # 方法1: 元の実装（created_atで絞り込み）
    print("\n【方法1】created_atで絞り込み:")
    try:
        start_date = f"{test_date}T00:00:00"
        end_date = f"{test_date}T23:59:59"
        
        print(f"  検索範囲: {start_date} ～ {end_date}")
        
        response = supabase.table('audio_files') \
            .select('device_id, created_at') \
            .gte('created_at', start_date) \
            .lte('created_at', end_date) \
            .execute()
        
        if response.data:
            device_ids = list(set([item['device_id'] for item in response.data if item.get('device_id')]))
            print(f"  ✅ {len(response.data)}件のレコードから{len(device_ids)}個のユニークなデバイスIDを取得")
            
            # 最初の3件のサンプルを表示
            print("\n  サンプルデータ（最初の3件）:")
            for item in response.data[:3]:
                print(f"    - device_id: {item['device_id']}")
                print(f"      created_at: {item['created_at']}")
            
            print(f"\n  取得したデバイスID一覧:")
            for idx, device_id in enumerate(device_ids, 1):
                print(f"    {idx}. {device_id}")
            
            return device_ids
        else:
            print(f"  ⚠️ {test_date}のデータが見つかりません")
            return []
            
    except Exception as e:
        print(f"  ❌ エラー: {e}")
        return []

def test_with_timezone_adjustment(supabase, test_date="2025-08-21"):
    """タイムゾーン調整版のテスト"""
    print("\n" + "=" * 60)
    print(f"3. タイムゾーン考慮版テスト（日付: {test_date}）")
    print("=" * 60)
    
    print("\n【方法2】UTC時刻に変換して検索:")
    try:
        # JSTの00:00:00と23:59:59をUTCに変換
        # JST 00:00:00 = UTC 前日15:00:00
        # JST 23:59:59 = UTC 当日14:59:59
        
        from datetime import datetime
        jst_start = datetime.strptime(f"{test_date} 00:00:00", "%Y-%m-%d %H:%M:%S")
        jst_end = datetime.strptime(f"{test_date} 23:59:59", "%Y-%m-%d %H:%M:%S")
        
        # JSTからUTCへ（-9時間）
        utc_start = (jst_start - timedelta(hours=9)).strftime("%Y-%m-%dT%H:%M:%S")
        utc_end = (jst_end - timedelta(hours=9)).strftime("%Y-%m-%dT%H:%M:%S")
        
        print(f"  JST範囲: {test_date} 00:00:00 ～ {test_date} 23:59:59")
        print(f"  UTC範囲: {utc_start} ～ {utc_end}")
        
        response = supabase.table('audio_files') \
            .select('device_id, created_at') \
            .gte('created_at', utc_start) \
            .lte('created_at', utc_end) \
            .execute()
        
        if response.data:
            device_ids = list(set([item['device_id'] for item in response.data if item.get('device_id')]))
            print(f"  ✅ {len(response.data)}件のレコードから{len(device_ids)}個のユニークなデバイスIDを取得")
            
            print(f"\n  取得したデバイスID一覧:")
            for idx, device_id in enumerate(device_ids, 1):
                print(f"    {idx}. {device_id}")
            
            return device_ids
        else:
            print(f"  ⚠️ データが見つかりません")
            return []
            
    except Exception as e:
        print(f"  ❌ エラー: {e}")
        return []

def test_all_devices_no_filter(supabase):
    """フィルタなしで全デバイスを確認"""
    print("\n" + "=" * 60)
    print("4. 全データ確認（日付フィルタなし、最新10件）")
    print("=" * 60)
    
    try:
        response = supabase.table('audio_files') \
            .select('device_id, created_at') \
            .order('created_at', desc=True) \
            .limit(10) \
            .execute()
        
        if response.data:
            print(f"  最新10件のデータ:")
            for item in response.data:
                print(f"    - device_id: {item['device_id']}")
                print(f"      created_at: {item['created_at']}")
            
            # ユニークなデバイスID
            all_device_ids = list(set([item['device_id'] for item in response.data if item.get('device_id')]))
            print(f"\n  最新10件に含まれるユニークなデバイスID: {len(all_device_ids)}個")
            for device_id in all_device_ids:
                print(f"    - {device_id}")
        else:
            print("  ⚠️ データが見つかりません")
            
    except Exception as e:
        print(f"  ❌ エラー: {e}")

def main():
    """メイン処理"""
    print("=" * 60)
    print("デバイスID取得機能診断")
    print("=" * 60)
    print(f"実行時刻: {datetime.now(JST).strftime('%Y-%m-%d %H:%M:%S JST')}")
    
    # Supabase接続
    supabase = test_supabase_connection()
    if not supabase:
        print("\n❌ Supabase接続に失敗しました。.envファイルを確認してください。")
        print("実行方法: export $(cat .env | xargs) && python test-device-fetch.py")
        return
    
    # テスト実行
    test_date = "2025-08-21"
    
    # 方法1: 元の実装
    device_ids_1 = test_get_device_ids(supabase, test_date)
    
    # 方法2: タイムゾーン調整版
    device_ids_2 = test_with_timezone_adjustment(supabase, test_date)
    
    # 全データ確認
    test_all_devices_no_filter(supabase)
    
    # 結果サマリー
    print("\n" + "=" * 60)
    print("診断結果サマリー")
    print("=" * 60)
    
    if device_ids_1:
        print(f"✅ 方法1で{len(device_ids_1)}個のデバイスIDを取得")
    else:
        print("❌ 方法1ではデバイスIDを取得できませんでした")
    
    if device_ids_2:
        print(f"✅ 方法2で{len(device_ids_2)}個のデバイスIDを取得")
    else:
        print("❌ 方法2ではデバイスIDを取得できませんでした")
    
    if not device_ids_1 and not device_ids_2:
        print("\n⚠️ 問題: どちらの方法でもデバイスIDが取得できません")
        print("考えられる原因:")
        print("  1. 指定日付にデータが存在しない")
        print("  2. created_atフィールドのフォーマットが異なる")
        print("  3. タイムゾーンの問題")

if __name__ == "__main__":
    main()