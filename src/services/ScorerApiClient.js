import BaseApiClient from './BaseApiClient'

class ScorerApiClient extends BaseApiClient {
  constructor() {
    super({
      baseURL: 'https://api.hey-watch.me/vibe-scorer',
      timeout: 300000 // 5分
    })
  }

  async analyzeVibeGraph(deviceId, date) {
    const response = await this.api.post('/analyze-vibegraph-supabase', {
      device_id: deviceId,
      date: date
    })
    return response.data
  }
}

export default new ScorerApiClient()