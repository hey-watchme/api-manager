import BaseApiClient from './BaseApiClient'

class ScorerApiClient extends BaseApiClient {
  constructor() {
    super({
      baseURL: 'https://api.hey-watch.me/vibe-scorer',
      timeout: 300000 // 5分
    })
  }

  async analyzeVibeGraph(deviceId, date) {
    // デバッグ用：送信データをログ出力
    console.log('Vibe Scorer API Request:', {
      device_id: deviceId,
      date: date,
      timestamp: new Date().toISOString()
    })
    
    const response = await this.api.post('/analyze-vibegraph-supabase', {
      device_id: deviceId,
      date: date
    })
    
    // デバッグ用：レスポンスデータをログ出力
    console.log('Vibe Scorer API Response:', response.data)
    
    return response.data
  }

  // 全デバイス処理メソッド
  async analyzeAllDevices(date, onProgress = null) {
    try {
      // 指定日付のデバイスID一覧を取得
      const deviceIds = await this.getDeviceIdsForDate(date)
      
      if (deviceIds.length === 0) {
        return { 
          success: true, 
          message: `${date}にはデータが存在するデバイスがありませんでした`,
          processedDevices: [],
          results: []
        }
      }

      const results = []
      const processedDevices = []

      // 各デバイスを順次処理
      for (let i = 0; i < deviceIds.length; i++) {
        const deviceId = deviceIds[i]
        
        if (onProgress) {
          onProgress(deviceIds, i, true) // processing = true
        }

        try {
          const result = await this.analyzeVibeGraph(deviceId, date)
          results.push({ deviceId, success: true, data: result })
          processedDevices.push(deviceId)
        } catch (error) {
          console.error(`Device ${deviceId} processing failed:`, error)
          results.push({ 
            deviceId, 
            success: false, 
            error: error.message || 'Unknown error'
          })
        }

        if (onProgress) {
          onProgress(deviceIds, i + 1, false) // processing = false
        }
      }

      return {
        success: true,
        message: `${processedDevices.length}/${deviceIds.length} デバイスの処理が完了しました`,
        processedDevices,
        totalDevices: deviceIds.length,
        results
      }

    } catch (error) {
      throw new Error(`全デバイス処理に失敗しました: ${error.message}`)
    }
  }

  // 指定日付のデバイスID一覧を取得（仮実装）
  async getDeviceIdsForDate(date) {
    try {
      // 実際のAPIエンドポイントがない場合は、既知のテストデバイスIDを返す
      // TODO: バックエンドに実際のエンドポイントを実装する必要がある
      const response = await this.api.get(`/devices?date=${date}`)
      return response.data.device_ids || []
    } catch (error) {
      // フォールバック: テストデバイスIDを返す
      console.warn('デバイスID取得APIが利用できません。フォールバック値を使用します:', error.message)
      return ['9f7d6e27-98c3-4c19-bdfb-f7fda58b9a93']
    }
  }
}

export default new ScorerApiClient()