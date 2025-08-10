import { useState, useEffect } from 'react'
import Card from '../../../components/common/Card'
import BehaviorAggregatorForm from './BehaviorAggregatorForm'
import BehaviorAggregatorResults from './BehaviorAggregatorResults'
import ApiStatusIndicator from '../../../components/api/ApiStatusIndicator'
import AutoProcessControlWithParams from '../../../components/scheduler/AutoProcessControlWithParams'
import behaviorAggregatorApiClient from '../../../services/BehaviorAggregatorApiClient'
import { DEFAULT_DEVICE_ID } from '../../../config/constants'

export default function BehaviorAggregatorModule() {
  const [apiStatus, setApiStatus] = useState('checking')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [taskId, setTaskId] = useState(null)
  const [checkingStatus, setCheckingStatus] = useState(false)

  useEffect(() => {
    // CORS対応済みAPIなので、直接オンライン状態に設定
    setApiStatus('online')
  }, [])

  useEffect(() => {
    let intervalId

    if (taskId && results?.status === 'started') {
      setCheckingStatus(true)
      
      // 3秒ごとにタスクの状態を確認
      intervalId = setInterval(async () => {
        try {
          const statusResponse = await behaviorAggregatorApiClient.getTaskStatus(taskId)
          setResults(statusResponse)
          
          if (statusResponse.status === 'completed' || statusResponse.status === 'failed') {
            setCheckingStatus(false)
            clearInterval(intervalId)
          }
        } catch (err) {
          console.error('タスクステータス確認エラー:', err)
        }
      }, 3000)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [taskId, results?.status])

  const handleSubmit = async (deviceId, date) => {
    setLoading(true)
    setError(null)
    setResults(null)
    setTaskId(null)

    try {
      const response = await behaviorAggregatorApiClient.analyzeBehavior(deviceId, date)
      setResults(response)
      
      if (response.task_id) {
        setTaskId(response.task_id)
      }
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
            <h3 className="text-lg font-semibold text-gray-900">🤖 行動分析（SED Aggregator）</h3>
            <p className="text-sm text-gray-600 mt-1">
              音響イベント検出データを集計し、行動パターンの分析レポートを生成します。
            </p>
          </div>
          <ApiStatusIndicator status={apiStatus} />
        </div>
        
        <div className="bg-gray-50 rounded-md p-3">
          <p className="text-xs text-gray-600">
            <span className="font-medium">APIエンドポイント:</span>{' '}
            <code className="bg-white px-1 py-0.5 rounded">
              https://api.hey-watch.me/behavior-aggregator/analysis/sed
            </code>
          </p>
        </div>
      </div>

      {/* 自動処理セクション */}
      <div className="mb-8">
        <AutoProcessControlWithParams 
          apiName="behavior-aggregator"
          displayName="Behavior Aggregator"
          disabled={apiStatus !== 'online'}
          defaultDeviceId={DEFAULT_DEVICE_ID}
          showDeviceSelector={true}
          showDateSelector={true}
        />
      </div>

      {/* 手動処理セクション */}
      <div className="border-t pt-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">🔧 手動処理</h4>
        
        <BehaviorAggregatorForm 
          onSubmit={handleSubmit}
          loading={loading || checkingStatus}
          disabled={apiStatus !== 'online'}
        />
        
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {results && (
          <div className="mt-6">
            <BehaviorAggregatorResults 
              results={results} 
              loading={checkingStatus}
            />
          </div>
        )}
      </div>
    </Card>
  )
}