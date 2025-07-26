import BaseApiClient from './BaseApiClient'

class AzureTranscriberApiClient extends BaseApiClient {
  constructor() {
    super('Azure Transcriber API', 'https://api.hey-watch.me/vibe-transcriber-v2')
  }

  async transcribe(filePaths, model = 'azure') {
    try {
      console.log('Azure Transcriber API - リクエスト開始:', { filePaths, model })
      
      const response = await this.post('/fetch-and-transcribe', {
        file_paths: filePaths,
        model: model
      })

      console.log('Azure Transcriber API - レスポンス:', response.data)
      return response.data
    } catch (error) {
      console.error('Azure Transcriber API - エラー:', error)
      throw error
    }
  }
}

export default new AzureTranscriberApiClient()