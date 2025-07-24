import axios from 'axios'

export default class BaseApiClient {
  constructor(config) {
    this.baseURL = config.baseURL
    this.timeout = config.timeout || 30000
    this.statusCheckInterval = null
    
    // axiosインスタンスを作成
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    // レスポンスインターセプターでエラーハンドリングを統一
    this.api.interceptors.response.use(
      response => response,
      error => {
        this.handleError(error)
      }
    )
  }

  async checkStatus() {
    // CORS設定済みなので、常にオンラインとして返す
    // 実際のAPI接続は処理実行時にチェックされる
    return true
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
        message: error.response.data.message || `APIエラー (${error.response.status})`,
        status: error.response.status,
        data: error.response.data
      }
    } else if (error.request) {
      // リクエストは送信されたがレスポンスがない（タイムアウトを含む）
      if (error.code === 'ECONNABORTED') {
        throw {
          message: 'タイムアウトが発生しました。処理が長時間実行中の可能性があります。データベースで処理状況を確認してください。',
          status: 'timeout',
          data: null
        }
      } else {
        throw {
          message: 'APIサーバーに接続できません。サーバーが起動しているか確認してください。',
          status: 'connection_error',
          data: null
        }
      }
    } else {
      // その他のエラー
      throw {
        message: error.message || '予期しないエラーが発生しました',
        status: 'unknown',
        data: null
      }
    }
  }
}