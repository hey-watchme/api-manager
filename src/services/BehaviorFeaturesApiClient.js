import axios from 'axios'
import BaseApiClient from './BaseApiClient'

class BehaviorFeaturesApiClient extends BaseApiClient {
  constructor() {
    super({
      baseURL: 'https://api.hey-watch.me/behavior-features',
      timeout: 600000 // 10分のタイムアウト（SED音響イベント検出処理は時間がかかる可能性がある）
    })
  }

  async checkStatus() {
    // CORS設定済みなので、常にオンラインとして返す
    // 実際のAPI接続は処理実行時にチェックされる
    return true
  }

  async fetchAndProcessPaths(filePaths) {
    try {
      const response = await axios.post(
        `${this.baseURL}/fetch-and-process-paths`,
        {
          file_paths: filePaths
        },
        {
          timeout: this.timeout
        }
      )
      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }
}

export default new BehaviorFeaturesApiClient()