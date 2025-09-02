import BaseApiClient from './BaseApiClient'

class TimeblockAnalysisClient extends BaseApiClient {
  constructor() {
    // Vibe Scorer (api_gpt_v1) のエンドポイントを使用
    super({
      baseURL: 'https://api.hey-watch.me/vibe-scorer',
      timeout: 60000 // ChatGPT処理のため長めのタイムアウト
    })
  }

  /**
   * タイムブロック単位で分析を実行
   * @param {string} prompt - 分析用プロンプト
   * @param {string} deviceId - デバイスID
   * @param {string} date - 日付 (YYYY-MM-DD)
   * @param {string} timeBlock - タイムブロック (例: 14-30)
   */
  async analyzeTimeblock(prompt, deviceId, date, timeBlock) {
    try {
      const response = await this.api.post('/analyze-timeblock', {
        prompt,
        device_id: deviceId,
        date,
        time_block: timeBlock
      })
      return response.data
    } catch (error) {
      console.error('Timeblock analysis error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * 複数のタイムブロックを順次分析
   * @param {Array<Object>} timeblockData - プロンプトとタイムブロック情報の配列
   * @param {string} deviceId - デバイスID
   * @param {string} date - 日付
   * @param {Function} onProgress - 進捗コールバック
   */
  async analyzeMultipleTimeblocks(timeblockData, deviceId, date, onProgress) {
    const results = []
    const errors = []

    for (let i = 0; i < timeblockData.length; i++) {
      const { timeBlock, prompt } = timeblockData[i]
      
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: timeblockData.length,
          currentBlock: timeBlock,
          processing: true
        })
      }

      try {
        const result = await this.analyzeTimeblock(prompt, deviceId, date, timeBlock)
        results.push({
          timeBlock,
          status: 'success',
          ...result
        })
      } catch (error) {
        errors.push({
          timeBlock,
          status: 'error',
          error: error.message
        })
      }
    }

    if (onProgress) {
      onProgress({
        current: timeblockData.length,
        total: timeblockData.length,
        processing: false,
        completed: true
      })
    }

    return {
      success: errors.length === 0,
      results,
      errors,
      totalProcessed: timeblockData.length,
      successCount: results.length,
      errorCount: errors.length
    }
  }

  /**
   * ダッシュボードテーブルからプロンプトを取得
   * @param {string} deviceId - デバイスID
   * @param {string} date - 日付
   * @param {Array<string>} timeBlocks - タイムブロックの配列
   */
  async fetchPromptsFromDashboard(deviceId, date, timeBlocks) {
    // Supabaseから直接取得する場合はここに実装
    // 今回はDashboardApiClientと連携して使用することを想定
    console.log('Fetching prompts for:', { deviceId, date, timeBlocks })
    return []
  }
}

export default new TimeblockAnalysisClient()