import BaseApiClient from './BaseApiClient'

class BehaviorFeaturesApiClient extends BaseApiClient {
  constructor() {
    super({
      baseURL: 'https://api.hey-watch.me/behavior-features',
      timeout: 600000 // 10分のタイムアウト（SED音響イベント検出処理は時間がかかる可能性がある）
    })
  }

  async fetchAndProcessPaths(filePaths) {
    const response = await this.api.post('/fetch-and-process-paths', {
      file_paths: filePaths
    })
    return response.data
  }
}

export default new BehaviorFeaturesApiClient()