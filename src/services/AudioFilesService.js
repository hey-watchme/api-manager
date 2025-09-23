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

  // Transcriptions用 - completed以外のすべてのファイルを取得
  async getPendingAudioFiles(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('audio_files')
        .select('file_path, created_at, device_id, transcriptions_status')
        .neq('transcriptions_status', 'completed')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Supabaseエラー:', error)
        throw new Error(`データベースエラー: ${error.message}`)
      }

      console.log(`未処理ファイル取得: ${data?.length || 0}件 (completed以外)`)
      return data || []
    } catch (error) {
      console.error('audio_files (completed以外)の取得に失敗:', error)
      throw error
    }
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
      
      const data = await response.json();
      
      // transcriptionとeventsデータを追加で取得
      if (data.files && data.files.length > 0) {
        const filesWithResults = await Promise.all(
          data.files.map(async (file) => {
            // local_dateとtime_blockがある場合のみデータを取得
            if (file.device_id && file.local_date && file.time_block) {
              const [transcription, events, featuresTimeline] = await Promise.all([
                this.getTranscription(file.device_id, file.local_date, file.time_block),
                this.getEvents(file.device_id, file.local_date, file.time_block),
                this.getFeaturesTimeline(file.device_id, file.local_date, file.time_block)
              ]);
              return { ...file, transcription, events, featuresTimeline };
            }
            return file;
          })
        );
        data.files = filesWithResults;
      }
      
      return data;
    } catch (error) {
      console.error('Vault APIファイル一覧取得エラー:', error);
      throw error;
    }
  }
  
  // vibe_whisperテーブルからtranscription取得
  async getTranscription(deviceId, localDate, timeBlock) {
    try {
      const { data, error } = await supabase
        .from('vibe_whisper')
        .select('transcription')
        .eq('device_id', deviceId)
        .eq('date', localDate)
        .eq('time_block', timeBlock)
        .single();
      
      if (error) {
        // エラーの場合はnullを返す（データが存在しない場合も含む）
        return null;
      }
      
      return data?.transcription || null;
    } catch (error) {
      console.error('Transcription取得エラー:', error);
      return null;
    }
  }

  // behavior_yamnetテーブルからevents取得
  async getEvents(deviceId, localDate, timeBlock) {
    try {
      const { data, error } = await supabase
        .from('behavior_yamnet')
        .select('events')
        .eq('device_id', deviceId)
        .eq('date', localDate)
        .eq('time_block', timeBlock)
        .single();
      
      if (error) {
        // エラーの場合はnullを返す（データが存在しない場合も含む）
        return null;
      }
      
      return data?.events || null;
    } catch (error) {
      console.error('Events取得エラー:', error);
      return null;
    }
  }

  // emotion_opensmileテーブルからfeatures_timeline取得
  async getFeaturesTimeline(deviceId, localDate, timeBlock) {
    try {
      const { data, error } = await supabase
        .from('emotion_opensmile')
        .select('features_timeline')
        .eq('device_id', deviceId)
        .eq('date', localDate)
        .eq('time_block', timeBlock)
        .single();
      
      if (error) {
        // エラーの場合はnullを返す（データが存在しない場合も含む）
        return null;
      }
      
      return data?.features_timeline || null;
    } catch (error) {
      console.error('Features Timeline取得エラー:', error);
      return null;
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