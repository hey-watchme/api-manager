import BaseApiClient from './BaseApiClient'

class EmotionFeaturesApiClient extends BaseApiClient {
  constructor() {
    super({
      baseURL: 'https://api.hey-watch.me/emotion-features',
      timeout: 600000 // 10分のタイムアウト（音声処理は時間がかかる場合がある）
    })
  }

  async processEmotionFeatures(filePaths, featureSet = 'eGeMAPSv02', includeRawFeatures = false) {
    const response = await this.api.post('/process/emotion-features', {
      file_paths: filePaths,
      feature_set: featureSet,
      include_raw_features: includeRawFeatures
    })
    return response.data
  }
}

export default new EmotionFeaturesApiClient()