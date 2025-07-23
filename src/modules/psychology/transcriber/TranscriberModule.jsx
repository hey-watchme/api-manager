import { useState, useEffect } from 'react'
import Card from '../../../components/common/Card'
import TranscriberForm from './TranscriberForm'
import TranscriberResults from './TranscriberResults'
import ApiStatusIndicator from '../../../components/api/ApiStatusIndicator'
import transcriberApiClient from '../../../services/TranscriberApiClient'

export default function TranscriberModule() {
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
      const response = await transcriberApiClient.transcribe(filePaths, model)
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
            <h3 className="text-lg font-semibold text-gray-900">🎤 Transcriber（音声文字起こし）</h3>
            <p className="text-sm text-gray-600 mt-1">
              指定したファイルパスの音声データを文字起こしして、データベースに保存します。
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

      <TranscriberForm 
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
          <TranscriberResults results={results} />
        </div>
      )}
    </Card>
  )
}