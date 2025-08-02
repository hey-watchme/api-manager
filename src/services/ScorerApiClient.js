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
}

export default new ScorerApiClient()