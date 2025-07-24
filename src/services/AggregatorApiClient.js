import BaseApiClient from './BaseApiClient'

class AggregatorApiClient extends BaseApiClient {
  constructor() {
    super({
      baseURL: 'https://api.hey-watch.me/vibe-aggregator',
      timeout: 300000 // 5分
    })
  }

  async generateMoodPrompt(deviceId, date) {
    const response = await this.api.get('/generate-mood-prompt-supabase', {
      params: {
        device_id: deviceId,
        date: date
      }
    })
    return response.data
  }
}

export default new AggregatorApiClient()