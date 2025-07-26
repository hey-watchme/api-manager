import { supabase } from './supabase'

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
}

export default new AudioFilesService()