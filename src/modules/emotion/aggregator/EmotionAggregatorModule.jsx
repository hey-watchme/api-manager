import { useState, useEffect } from 'react'
import Card from '../../../components/common/Card'
import EmotionAggregatorForm from './EmotionAggregatorForm'
import EmotionAggregatorResults from './EmotionAggregatorResults'
import ApiStatusIndicator from '../../../components/api/ApiStatusIndicator'
import AutoProcessControlWithParams from '../../../components/scheduler/AutoProcessControlWithParams'
import emotionAggregatorApiClient from '../../../services/EmotionAggregatorApiClient'

export default function EmotionAggregatorModule() {
  const [apiStatus, setApiStatus] = useState('checking')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    // CORS対応済みAPIなので、直接オンライン状態に設定
    setApiStatus('online')
  }, [])

  const handleSubmit = async (deviceId, date) => {
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const response = await emotionAggregatorApiClient.analyzeEmotions(deviceId, date)
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
            <h3 className="text-lg font-semibold text-gray-900">📊 感情分析（OpenSMILE Aggregator）</h3>
            <p className="text-sm text-gray-600 mt-1">
              抽出された感情特徴量を分析し、時系列の感情変化パターンを生成します。
            </p>
          </div>
          <ApiStatusIndicator status={apiStatus} />
        </div>
        
        <div className="bg-gray-50 rounded-md p-3">
          <p className="text-xs text-gray-600">
            <span className="font-medium">APIエンドポイント:</span>{' '}
            <code className="bg-white px-1 py-0.5 rounded">
              https://api.hey-watch.me/emotion-aggregator/analyze/opensmile-aggregator
            </code>
          </p>
        </div>
      </div>

      {/* 自動処理セクション */}
      <div className="mb-8">
        <AutoProcessControlWithParams 
          apiName="emotion-aggregator"
          displayName="Emotion Aggregator"
          disabled={apiStatus !== 'online'}
          defaultDeviceId="m5core2_auto"
          showDeviceSelector={true}
          showDateSelector={true}
        />
      </div>

      {/* 手動処理セクション */}
      <div className="border-t pt-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">🔧 手動処理</h4>
        
        <EmotionAggregatorForm 
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
            <EmotionAggregatorResults results={results} />
          </div>
        )}
      </div>
    </Card>
  )
}