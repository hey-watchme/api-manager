import { useState, useEffect } from 'react'
import Card from '../../../components/common/Card'
import WhisperTranscriberForm from './WhisperTranscriberForm'
import WhisperTranscriberResults from './WhisperTranscriberResults'
import ApiStatusIndicator from '../../../components/api/ApiStatusIndicator'
import whisperTranscriberApiClient from '../../../services/WhisperTranscriberApiClient'

export default function WhisperTranscriberModule() {
  const [apiStatus, setApiStatus] = useState('checking')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    // CORS対応済みAPIなので、直接オンライン状態に設定
    setApiStatus('online')
  }, [])

  const handleSubmit = async (filePaths, model) => {
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const response = await whisperTranscriberApiClient.transcribe(filePaths, model)
      setResults(response)
    } catch (err) {
      setError(err.message || 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">🎤 Whisper Transcriber（OpenAI音声文字起こし）</h3>
            <p className="text-sm text-gray-600 mt-1">
              OpenAI Whisperを使用して音声データを文字起こしし、データベースに保存します。
            </p>
          </div>
          <ApiStatusIndicator status={apiStatus} />
        </div>
        
        <div className="bg-gray-50 rounded-md p-3">
          <p className="text-xs text-gray-600">
            <span className="font-medium">APIエンドポイント:</span>{' '}
            <code className="bg-white px-1 py-0.5 rounded">
              https://api.hey-watch.me/vibe-transcriber/fetch-and-transcribe
            </code>
          </p>
        </div>
      </div>

      <WhisperTranscriberForm 
        onSubmit={handleSubmit}
        loading={loading}
        disabled={apiStatus !== 'online'}
      />

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {results && (
        <div className="mt-6">
          <WhisperTranscriberResults results={results} />
        </div>
      )}
    </Card>
  )
}