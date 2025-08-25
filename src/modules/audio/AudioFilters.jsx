import React, { useState, useEffect } from 'react'
import AudioFilesService from '../../services/AudioFilesService'

const AudioFilters = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    device_id: '',
    local_date_from: '',
    local_date_to: '',
    transcriptions_status: 'all',
    behavior_features_status: 'all',
    emotion_features_status: 'all'
  })
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(false)

  // デバイス一覧を取得
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await AudioFilesService.getDevices()
        // APIレスポンスからdevices配列を取得
        const devicesList = response.devices || []
        setDevices(devicesList)
      } catch (error) {
        console.error('デバイス一覧の取得に失敗:', error)
        // エラー時は空配列を設定
        setDevices([])
      }
    }

    fetchDevices()
  }, [])

  // フィルター変更ハンドラー
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    
    // 空の値を除外してフィルターを適用
    const activeFilters = Object.entries(newFilters)
      .filter(([_, v]) => v && v !== 'all')
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {})
    
    if (onFilterChange) {
      onFilterChange(activeFilters)
    }
  }

  // フィルターをリセット
  const handleReset = () => {
    const resetFilters = {
      device_id: '',
      local_date_from: '',
      local_date_to: '',
      transcriptions_status: 'all',
      behavior_features_status: 'all',
      emotion_features_status: 'all'
    }
    setFilters(resetFilters)
    if (onFilterChange) {
      onFilterChange({})
    }
  }

  // 今日の日付を取得（YYYY-MM-DD形式）
  const getToday = () => {
    return new Date().toISOString().split('T')[0]
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border mb-4">
      <h3 className="text-lg font-semibold mb-3">🔍 フィルター</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* デバイスID選択 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            device_id
          </label>
          <select
            value={filters.device_id}
            onChange={(e) => handleFilterChange('device_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">全デバイス</option>
            {Array.isArray(devices) && devices.map((device) => (
              <option key={device.device_id} value={device.device_id}>
                {device.device_id.substring(0, 8)}...
                {device.device_name && ` (${device.device_name})`}
              </option>
            ))}
          </select>
        </div>

        {/* local_date開始日 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            local_date_from
          </label>
          <input
            type="date"
            value={filters.local_date_from}
            onChange={(e) => handleFilterChange('local_date_from', e.target.value)}
            max={getToday()}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* local_date終了日 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            local_date_to
          </label>
          <input
            type="date"
            value={filters.local_date_to}
            onChange={(e) => handleFilterChange('local_date_to', e.target.value)}
            max={getToday()}
            min={filters.local_date_from}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

      </div>

      {/* 処理ステータスフィルター */}
      <div className="mt-4">
        <h4 className="text-md font-medium text-gray-700 mb-3">Status Filters</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 転写ステータス */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              transcriptions_status
            </label>
            <select
              value={filters.transcriptions_status}
              onChange={(e) => handleFilterChange('transcriptions_status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">全て</option>
              <option value="completed">completed</option>
              <option value="processing">processing</option>
              <option value="failed">failed</option>
              <option value="pending">pending</option>
              <option value="error">error</option>
            </select>
          </div>

          {/* 行動ステータス */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              behavior_features_status
            </label>
            <select
              value={filters.behavior_features_status}
              onChange={(e) => handleFilterChange('behavior_features_status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">全て</option>
              <option value="completed">completed</option>
              <option value="processing">processing</option>
              <option value="failed">failed</option>
              <option value="pending">pending</option>
              <option value="error">error</option>
            </select>
          </div>

          {/* 感情ステータス */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              emotion_features_status
            </label>
            <select
              value={filters.emotion_features_status}
              onChange={(e) => handleFilterChange('emotion_features_status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">全て</option>
              <option value="completed">completed</option>
              <option value="processing">processing</option>
              <option value="failed">failed</option>
              <option value="pending">pending</option>
              <option value="error">error</option>
            </select>
          </div>
        </div>
      </div>

      {/* リセットボタン */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleReset}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md text-sm"
        >
          🔄 リセット
        </button>
      </div>

      {/* フィルター適用状況 */}
      {Object.values(filters).some(v => v && v !== 'all') && (
        <div className="mt-3 text-sm text-blue-600">
          📊 フィルターが適用されています
        </div>
      )}
    </div>
  )
}

export default AudioFilters