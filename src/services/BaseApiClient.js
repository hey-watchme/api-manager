import axios from 'axios'

export default class BaseApiClient {
  constructor(config) {
    this.baseURL = config.baseURL
    this.timeout = config.timeout || 30000
    this.statusCheckInterval = null
  }

  async checkStatus() {
    // 個別のAPIクライアントでオーバーライドする
    throw new Error('checkStatus method must be implemented by subclass')
  }

  startStatusMonitoring(callback, interval = 30000) {
    // 初回チェック
    this.checkStatus().then(callback)
    
    // 定期チェック開始
    this.statusCheckInterval = setInterval(async () => {
      const isOnline = await this.checkStatus()
      callback(isOnline)
    }, interval)
  }

  stopStatusMonitoring() {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval)
      this.statusCheckInterval = null
    }
  }

  handleError(error) {
    if (error.response) {
      // サーバーからのエラーレスポンス
      throw {
        message: error.response.data.message || 'APIエラーが発生しました',
        status: error.response.status,
        data: error.response.data
      }
    } else if (error.request) {
      // リクエストは送信されたがレスポンスがない
      throw {
        message: 'APIサーバーに接続できません',
        status: null,
        data: null
      }
    } else {
      // その他のエラー
      throw {
        message: error.message || '予期しないエラーが発生しました',
        status: null,
        data: null
      }
    }
  }
}