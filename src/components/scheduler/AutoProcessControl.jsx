import { useState, useEffect } from 'react'
import schedulerApiClient from '../../services/SchedulerApiClient'

export default function AutoProcessControl({ 
  apiName, 
  displayName = apiName,
  disabled = false 
}) {
  const [autoStatus, setAutoStatus] = useState({
    enabled: false,
    interval: 3,
    lastRun: null,
    nextRun: null,
    isRunning: false,
    successCount: 0,
    errorCount: 0
  })
  const [loading, setLoading] = useState(false)

  // 自動処理状況取得
  const loadAutoStatus = async () => {
    try {
      const data = await schedulerApiClient.getStatus(apiName)
      setAutoStatus(data)
    } catch (error) {
      console.error('自動処理状況取得エラー:', error)
    }
  }

  // 初回読み込み
  useEffect(() => {
    loadAutoStatus()
  }, [apiName])

  // 自動処理ON/OFF切り替え
  const handleToggle = async () => {
    setLoading(true)
    try {
      await schedulerApiClient.toggle(apiName, {
        ...autoStatus,
        enabled: !autoStatus.enabled 
      })
      
      await loadAutoStatus() // 最新状況を再取得
    } catch (error) {
      console.error('自動処理切り替えエラー:', error)
      alert('設定の更新に失敗しました: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // 実行時刻の定義（固定スケジュール）
  const getScheduleInfo = (apiName) => {
    const schedules = {
      // 'whisper': { time: '毎時10分', frequency: '毎時間' },  // 2025/09/02 削除済み
      'azure-transcriber': { time: '毎時10分', frequency: '毎時間' },
      'behavior-features': { time: '毎時10分', frequency: '毎時間' },
      'vibe-aggregator': { time: '毎時20分', frequency: '毎時間' },
      'behavior-aggregator': { time: '毎時20分', frequency: '毎時間' },
      'emotion-features': { time: '毎時20分', frequency: '毎時間' },
      'emotion-aggregator': { time: '毎時30分', frequency: '毎時間' },
      'vibe-scorer': { time: '30分', frequency: '3時間ごと (0:30, 3:30, 6:30, 9:30, 12:30, 15:30, 18:30, 21:30)' }
    }
    return schedules[apiName] || { time: '未設定', frequency: '未設定' }
  }

  const scheduleInfo = getScheduleInfo(apiName)

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h5 className="font-medium text-blue-900">
            🤖 {displayName} 自動処理
          </h5>
          <p className="text-sm text-blue-600">
            {autoStatus.enabled ? '✅ 有効' : '⏸️ 無効'}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            📅 実行時刻: {scheduleInfo.time} ({scheduleInfo.frequency})
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleToggle}
            disabled={disabled || loading}
            className={`px-4 py-2 rounded text-sm font-medium disabled:opacity-50 ${
              autoStatus.enabled 
                ? 'bg-green-100 text-green-800 border border-green-300 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
            }`}
          >
            {loading ? '処理中...' : (autoStatus.enabled ? '🟢 有効' : '⚪ 無効')}
          </button>
        </div>
      </div>
      
      {autoStatus.isRunning && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-3">
          <p className="text-sm text-yellow-800">🔄 実行中...</p>
        </div>
      )}
      
      {autoStatus.lastRun && (
        <div className="text-xs text-gray-600 border-t pt-2 mt-2">
          <div className="flex items-center justify-between">
            <span>📊 最終処理: {new Date(autoStatus.lastRun).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</span>
            {autoStatus.errorCount > 0 && (
              <span className="text-red-600">エラー: {autoStatus.errorCount}回</span>
            )}
            {autoStatus.errorCount === 0 && autoStatus.successCount > 0 && (
              <span className="text-green-600">✅ 成功</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}