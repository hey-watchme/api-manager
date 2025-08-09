import { useState, useEffect } from 'react'
import ScorerForm from './ScorerForm'
import ScorerResults from './ScorerResults'
import Card from '../../../components/common/Card'
import ApiStatusIndicator from '../../../components/api/ApiStatusIndicator'
import AutoProcessControlWithParams from '../../../components/scheduler/AutoProcessControlWithParams'
import scorerApiClient from '../../../services/ScorerApiClient'

function ScorerModule() {
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
      const response = await scorerApiClient.analyzeVibeGraph(data.deviceId, data.date)
      setResult(response)
    } catch (error) {
      setError(error.message || 'スコアリングに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">🤖 Vibe Scorer（スコアリング）</h3>
            <p className="text-sm text-gray-600 mt-1">
              ChatGPTを使用して心理状態のスコアを算出します。
            </p>
          </div>
          <ApiStatusIndicator status={apiStatus} />
        </div>
        
        <div className="bg-gray-50 rounded-md p-3">
          <p className="text-xs text-gray-600">
            <span className="font-medium">APIエンドポイント:</span>{' '}
            <code className="bg-white px-1 py-0.5 rounded">
              https://api.hey-watch.me/vibe-scorer/analyze-vibegraph-supabase
            </code>
          </p>
        </div>
      </div>

      {/* 自動処理セクション */}
      <div className="mb-8">
        <AutoProcessControlWithParams 
          apiName="vibe-scorer"
          displayName="Vibe Scorer"
          disabled={apiStatus !== 'online'}
          defaultDeviceId="m5core2_auto"
          showDeviceSelector={true}
          showDateSelector={true}
        />
      </div>

      {/* 手動処理セクション */}
      <div className="border-t pt-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">🔧 手動処理</h4>
        
        <ScorerForm 
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
            <ScorerResults result={result} />
          </div>
        )}
      </div>
    </Card>
  )
}

export default ScorerModule