import { useState, useEffect } from 'react'
import AggregatorForm from './AggregatorForm'
import AggregatorResults from './AggregatorResults'
import Card from '../../../components/common/Card'
import ApiStatusIndicator from '../../../components/api/ApiStatusIndicator'
import DeviceProcessingProgress from '../../../components/common/DeviceProcessingProgress'
import aggregatorApiClient from '../../../services/AggregatorApiClient'
import { DEFAULT_DEVICE_ID } from '../../../config/constants'

function AggregatorModule() {
  const [apiStatus, setApiStatus] = useState('checking')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  
  // 全デバイス処理用の状態
  const [processingDevices, setProcessingDevices] = useState([])
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0)
  const [isProcessingAllDevices, setIsProcessingAllDevices] = useState(false)

  useEffect(() => {
    // CORS対応済みAPIなので、直接オンライン状態に設定
    setApiStatus('online')
  }, [])

  const handleSubmit = async (date) => {
    setLoading(true)
    setIsProcessingAllDevices(true)
    setError(null)
    setResult(null)
    setProcessingDevices([])
    setCurrentDeviceIndex(0)

    try {
      const response = await aggregatorApiClient.generateAllDevices(
        date,
        (devices, currentIndex, processing) => {
          setProcessingDevices(devices)
          setCurrentDeviceIndex(currentIndex)
          // processing状態は個別デバイスの処理中を表す
        }
      )
      
      setResult(response)
    } catch (error) {
      setError(error.message || 'プロンプト生成に失敗しました')
    } finally {
      setLoading(false)
      setIsProcessingAllDevices(false)
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
      {/* 自動処理セクションは削除済み（スケジューラーUI機能停止のため） */}
      {/* 手動処理セクション */}
      <div className="border-t pt-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">🔧 手動処理</h4>
        
        <AggregatorForm 
          onSubmit={handleSubmit} 
          loading={loading || isProcessingAllDevices}
          disabled={apiStatus !== 'online'}
        />
        
        {/* 全デバイス処理の進捗表示 */}
        {isProcessingAllDevices && processingDevices.length > 0 && (
          <div className="mt-6">
            <DeviceProcessingProgress
              devices={processingDevices}
              currentIndex={currentDeviceIndex}
              processing={loading}
            />
          </div>
        )}
        
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        
        {result && !isProcessingAllDevices && (
          <div className="mt-6">
            <AggregatorResults result={result} />
          </div>
        )}
      </div>
    </Card>
  )
}

export default AggregatorModule