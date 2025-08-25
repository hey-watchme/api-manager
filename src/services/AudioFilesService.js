import { supabase } from './supabase'

// Vault API Base URL - 開発環境ではプロキシを使用、本番環境では直接アクセス
const VAULT_API_BASE = import.meta.env.PROD 
  ? (import.meta.env.VITE_VAULT_API_BASE_URL || 'https://api.hey-watch.me')
  : '' // 開発環境ではViteプロキシを使用

class AudioFilesService {
  // 汎用的な未処理ファイル取得メソッド
  async getPendingFilesByStatus(statusColumn, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('audio_files')
        .select('file_path, created_at, device_id')
        .eq(statusColumn, 'pending')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Supabaseエラー:', error)
        throw new Error(`データベースエラー: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error(`audio_files (${statusColumn})の取得に失敗:`, error)
      throw error
    }
  }

  // Transcriptions用
  async getPendingAudioFiles(limit = 50) {
    return this.getPendingFilesByStatus('transcriptions_status', limit)
  }

  // Behavior Features用
  async getPendingBehaviorFiles(limit = 50) {
    return this.getPendingFilesByStatus('behavior_features_status', limit)
  }

  // Emotion Features用（将来の拡張用）
  async getPendingEmotionFiles(limit = 50) {
    return this.getPendingFilesByStatus('emotion_features_status', limit)
  }

  async getAudioFilesByDateRange(startDate, endDate, deviceId = null) {
    try {
      let query = supabase
        .from('audio_files')
        .select('file_path, created_at, device_id, transcriptions_status')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })

      if (deviceId) {
        query = query.eq('device_id', deviceId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Supabaseエラー:', error)
        throw new Error(`データベースエラー: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('audio_filesの取得に失敗:', error)
      throw error
    }
  }

  // === Vault API連携メソッド ===
  
  // Vault API経由でファイル一覧取得
  async getAudioFilesList(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`${VAULT_API_BASE}/api/audio-files?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Vault APIファイル一覧取得エラー:', error);
      throw error;
    }
  }

  // 署名付きURL生成
  async getPresignedUrl(filePath) {
    try {
      const encodedFilePath = encodeURIComponent(filePath);
      const response = await fetch(`${VAULT_API_BASE}/api/audio-files/presigned-url?file_path=${encodedFilePath}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('署名付きURL生成エラー:', error);
      throw error;
    }
  }

  // デバイス一覧取得
  async getDevices() {
    try {
      const response = await fetch(`${VAULT_API_BASE}/api/devices`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('デバイス一覧取得エラー:', error);
      throw error;
    }
  }
}

export default new AudioFilesService()