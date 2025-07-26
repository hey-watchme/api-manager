import BaseApiClient from './BaseApiClient'

class WhisperTranscriberApiClient extends BaseApiClient {
  constructor() {
    super({
      baseURL: 'https://api.hey-watch.me/vibe-transcriber'
    })
  }

  async transcribe(filePaths, model = 'base') {
    try {
      console.log('Whisper Transcriber API - リクエスト開始:', { filePaths, model })
      
      const response = await this.api.post('/fetch-and-transcribe', {
        file_paths: filePaths,
        model: model
      })

      console.log('Whisper Transcriber API - レスポンス:', response.data)
      return response.data
    } catch (error) {
      console.error('Whisper Transcriber API - エラー:', error)
      throw error
    }
  }
}

export default new WhisperTranscriberApiClient()