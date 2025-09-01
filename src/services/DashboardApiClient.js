import BaseApiClient from './BaseApiClient'

class DashboardApiClient extends BaseApiClient {
  constructor() {
    // api_gen_prompt_mood_chartコンテナのエンドポイントを使用
    // 本番環境では必ずhttps://api.hey-watch.me/vibe-aggregatorを使用
    super({
      baseURL: 'https://api.hey-watch.me/vibe-aggregator',
      timeout: 30000
    })
  }

  /**
   * タイムブロック単位でプロンプトを生成
   * @param {string} deviceId - デバイスID
   * @param {string} date - 日付 (YYYY-MM-DD)
   * @param {string} timeBlock - タイムブロック (例: 14-30)
   */
  async generateTimeblockPrompt(deviceId, date, timeBlock) {
    try {
      const params = new URLSearchParams({
        device_id: deviceId,
        date: date,
        time_block: timeBlock
      })

      const response = await this.api.get(`/generate-timeblock-prompt?${params}`)
      return response.data
    } catch (error) {
      console.error('Timeblock prompt generation error:', error)
      throw this.handleError(error)
    }
  }

  /**
   * 複数のタイムブロックを順次処理
   * @param {string} deviceId - デバイスID
   * @param {string} date - 日付
   * @param {Array<string>} timeBlocks - タイムブロックの配列
   * @param {Function} onProgress - 進捗コールバック
   */
  async generateMultipleTimeblocks(deviceId, date, timeBlocks, onProgress) {
    const results = []
    const errors = []

    for (let i = 0; i < timeBlocks.length; i++) {
      const timeBlock = timeBlocks[i]
      
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: timeBlocks.length,
          currentBlock: timeBlock,
          processing: true
        })
      }

      try {
        const result = await this.generateTimeblockPrompt(deviceId, date, timeBlock)
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
        current: timeBlocks.length,
        total: timeBlocks.length,
        processing: false,
        completed: true
      })
    }

    return {
      success: errors.length === 0,
      results,
      errors,
      totalProcessed: timeBlocks.length,
      successCount: results.length,
      errorCount: errors.length
    }
  }
}

export default new DashboardApiClient()