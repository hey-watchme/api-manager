import BaseApiClient from './BaseApiClient'

class TranscriberApiClient extends BaseApiClient {
  constructor() {
    super({
      baseURL: 'https://api.hey-watch.me/vibe-transcriber',
      timeout: 600000 // 10分のタイムアウト（Whisper処理は最大10分程度）
    })
  }

  async transcribe(filePaths, model = 'base') {
    const response = await this.api.post('/fetch-and-transcribe', {
      file_paths: filePaths,
      model: model
    })
    return response.data
  }
}

export default new TranscriberApiClient()