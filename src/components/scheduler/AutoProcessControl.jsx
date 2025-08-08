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

  // 実行間隔変更
  const handleIntervalChange = async (newInterval) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/scheduler/toggle/${apiName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...autoStatus,
          interval: parseInt(newInterval)
        })
      })
      
      if (response.ok) {
        await loadAutoStatus()
      } else {
        throw new Error('間隔設定の更新に失敗しました')
      }
    } catch (error) {
      console.error('間隔変更エラー:', error)
      alert('設定の更新に失敗しました: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h5 className="font-medium text-blue-900">
            🤖 {displayName} 自動処理
          </h5>
          <p className="text-sm text-blue-600">
            {autoStatus.enabled ? '有効' : '無効'} | 
            間隔: {autoStatus.interval}時間
            {autoStatus.lastRun && (
              <> | 最終実行: {new Date(autoStatus.lastRun).toLocaleString()}</>
            )}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select 
            value={autoStatus.interval}
            onChange={(e) => handleIntervalChange(e.target.value)}
            disabled={disabled || loading}
            className="text-sm border rounded px-2 py-1 disabled:bg-gray-100"
          >
            <option value={1}>1時間</option>
            <option value={3}>3時間</option>
            <option value={6}>6時間</option>
            <option value={12}>12時間</option>
            <option value={24}>24時間</option>
          </select>
          
          <button
            onClick={handleToggle}
            disabled={disabled || loading}
            className={`px-3 py-1 rounded text-sm font-medium disabled:opacity-50 ${
              autoStatus.enabled 
                ? 'bg-green-100 text-green-800 border border-green-300' 
                : 'bg-gray-100 text-gray-600 border border-gray-300'
            }`}
          >
            {loading ? '...' : (autoStatus.enabled ? '🟢 ON' : '⚪ OFF')}
          </button>
        </div>
      </div>
      
      {autoStatus.isRunning && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-3">
          <p className="text-sm text-yellow-800">🔄 実行中...</p>
        </div>
      )}
      
      <div className="text-xs text-blue-600">
        成功: {autoStatus.successCount}回 | 
        エラー: {autoStatus.errorCount}回
        {autoStatus.nextRun && (
          <> | 次回実行: {new Date(autoStatus.nextRun).toLocaleString()}</>
        )}
      </div>
    </div>
  )
}