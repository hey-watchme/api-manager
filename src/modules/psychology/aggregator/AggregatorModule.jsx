import { useState, useEffect } from 'react'
import AggregatorForm from './AggregatorForm'
import AggregatorResults from './AggregatorResults'
import Card from '../../../components/common/Card'
import ApiStatusIndicator from '../../../components/api/ApiStatusIndicator'
import AutoProcessControlWithParams from '../../../components/scheduler/AutoProcessControlWithParams'
import aggregatorApiClient from '../../../services/AggregatorApiClient'
import { DEFAULT_DEVICE_ID } from '../../../config/constants'

function AggregatorModule() {
  const [apiStatus, setApiStatus] = useState('checking')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // CORS対応済みAPIなので、直接オンライン状態に設定
    setApiStatus('online')
  }, [])

  const handleSubmit = async (data) => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await aggregatorApiClient.generateMoodPrompt(data.deviceId, data.date)
      setResult(response)
    } catch (error) {
      setError(error.message || 'プロンプト生成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">📝 Vibe Aggregator（プロンプト生成）</h3>
            <p className="text-sm text-gray-600 mt-1">
              心理分析用のプロンプトを生成します。
            </p>
          </div>
          <ApiStatusIndicator status={apiStatus} />
        </div>
        
        <div className="bg-gray-50 rounded-md p-3">
          <p className="text-xs text-gray-600">
            <span className="font-medium">APIエンドポイント:</span>{' '}
            <code className="bg-white px-1 py-0.5 rounded">
              https://api.hey-watch.me/vibe-aggregator/generate-mood-prompt-supabase
            </code>
          </p>
        </div>
      </div>

      {/* 自動処理セクション */}
      <div className="mb-8">
        <AutoProcessControlWithParams 
          apiName="vibe-aggregator"
          displayName="Vibe Aggregator"
          disabled={apiStatus !== 'online'}
          defaultDeviceId={DEFAULT_DEVICE_ID}
          showDeviceSelector={true}
          showDateSelector={true}
        />
      </div>

      {/* 手動処理セクション */}
      <div className="border-t pt-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">🔧 手動処理</h4>
        
        <AggregatorForm 
          onSubmit={handleSubmit} 
          loading={loading}
          disabled={apiStatus !== 'online'}
        />
        
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        
        {result && (
          <div className="mt-6">
            <AggregatorResults result={result} />
          </div>
        )}
      </div>
    </Card>
  )
}

export default AggregatorModule