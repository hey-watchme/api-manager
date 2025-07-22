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
    try {
      // APIのルートパスにGETリクエストを送信
      // 405 Method Not Allowedが返ってきてもAPIは稼働していると判断
      const response = await axios.get(this.baseURL + '/', {
        timeout: 5000,
        validateStatus: (status) => true // すべてのステータスコードを受け入れる
      })
      
      // 200, 404, 405のいずれかが返ってきたらオンライン
      return [200, 404, 405].includes(response.status)
    } catch (error) {
      console.warn('APIステータスチェックエラー:', error.message)
      return false
    }
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