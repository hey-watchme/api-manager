import { useState, useEffect } from 'react'
import Card from '../../../components/common/Card'
import BehaviorFeaturesForm from './BehaviorFeaturesForm'
import BehaviorFeaturesResults from './BehaviorFeaturesResults'
import ApiStatusIndicator from '../../../components/api/ApiStatusIndicator'
import behaviorFeaturesApiClient from '../../../services/BehaviorFeaturesApiClient'

export default function BehaviorFeaturesModule() {
  const [apiStatus, setApiStatus] = useState('checking')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    // CORS対応済みAPIなので、直接オンライン状態に設定
    setApiStatus('online')
  }, [])

  const handleSubmit = async (filePaths) => {
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const response = await behaviorFeaturesApiClient.fetchAndProcessPaths(filePaths)
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
            <h3 className="text-lg font-semibold text-gray-900">🎯 AST音響イベント検出（行動特徴抽出）</h3>
            <p className="text-sm text-gray-600 mt-1">
              Audio Spectrogram Transformerを使用して、527種類の音響イベントを高精度に検出します。
            </p>
          </div>
          <ApiStatusIndicator status={apiStatus} />
        </div>
        
        <div className="bg-gray-50 rounded-md p-3">
          <p className="text-xs text-gray-600">
            <span className="font-medium">APIエンドポイント:</span>{' '}
            <code className="bg-white px-1 py-0.5 rounded">
              https://api.hey-watch.me/behavior-features/fetch-and-process-paths
            </code>
          </p>
        </div>
      </div>

      <BehaviorFeaturesForm 
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
          <BehaviorFeaturesResults results={results} />
        </div>
      )}
    </Card>
  )
}