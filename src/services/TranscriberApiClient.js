import axios from 'axios'
import BaseApiClient from './BaseApiClient'

class TranscriberApiClient extends BaseApiClient {
  constructor() {
    super({
      baseURL: 'https://api.hey-watch.me/vibe-transcriber',
      timeout: 600000 // 10分のタイムアウト（Whisper処理は最大10分程度）
    })
  }

  async checkStatus() {
    // CORS設定済みなので、常にオンラインとして返す
    // 実際のAPI接続は処理実行時にチェックされる
    return true
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