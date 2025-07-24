import BaseApiClient from './BaseApiClient'

class EmotionAggregatorApiClient extends BaseApiClient {
  constructor() {
    super({
      baseURL: 'https://api.hey-watch.me/emotion-aggregator',
      timeout: 300000 // 5分のタイムアウト
    })
  }

  async analyzeEmotions(deviceId, date) {
    const response = await this.api.post('/analyze/opensmile-aggregator', {
      device_id: deviceId,
      date: date
    })
    return response.data
  }
}

export default new EmotionAggregatorApiClient()