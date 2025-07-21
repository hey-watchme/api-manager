import axios from 'axios'
import BaseApiClient from './BaseApiClient'

class TranscriberApiClient extends BaseApiClient {
  constructor() {
    super({
      baseURL: '/api/vibe-transcriber',
      timeout: 60000
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

  async transcribe(filePaths, model = 'base') {
    try {
      const response = await axios.post(
        `${this.baseURL}/fetch-and-transcribe`,
        {
          file_paths: filePaths,
          model: model
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

export default new TranscriberApiClient()