import { useState, useEffect } from 'react'
import Card from '../../../components/common/Card'
import EmotionFeaturesForm from './EmotionFeaturesForm'
import EmotionFeaturesResults from './EmotionFeaturesResults'
import ApiStatusIndicator from '../../../components/api/ApiStatusIndicator'
import emotionFeaturesApiClient from '../../../services/EmotionFeaturesApiClient'

export default function EmotionFeaturesModule() {
  const [apiStatus, setApiStatus] = useState('checking')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    // CORS対応済みAPIなので、直接オンライン状態に設定
    setApiStatus('online')
  }, [])

  const handleSubmit = async (filePaths, featureSet, includeRawFeatures) => {
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const response = await emotionFeaturesApiClient.processEmotionFeatures(
        filePaths, 
        featureSet, 
        includeRawFeatures
      )
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
            <h3 className="text-lg font-semibold text-gray-900">😊 SUPERB感情認識（感情特徴抽出）</h3>
            <p className="text-sm text-gray-600 mt-1">
              wav2vec2ベースの最新モデルを使用して8種類の感情を高精度に分類します。
            </p>
          </div>
          <ApiStatusIndicator status={apiStatus} />
        </div>
        
        <div className="bg-gray-50 rounded-md p-3">
          <p className="text-xs text-gray-600">
            <span className="font-medium">APIエンドポイント:</span>{' '}
            <code className="bg-white px-1 py-0.5 rounded">
              https://api.hey-watch.me/emotion-features/process/emotion-features
            </code>
          </p>
        </div>
      </div>

      <EmotionFeaturesForm 
        onSubmit={handleSubmit}
        loading={loading}
        disabled={apiStatus !== 'online'}
        onError={setError}
      />

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {results && (
        <div className="mt-6">
          <EmotionFeaturesResults results={results} />
        </div>
      )}
    </Card>
  )
}