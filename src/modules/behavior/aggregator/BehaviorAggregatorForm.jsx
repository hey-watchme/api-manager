import { useState } from 'react'
import Button from '../../../components/common/Button'

export default function BehaviorAggregatorForm({ onSubmit, loading, disabled }) {
  const [deviceId, setDeviceId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!deviceId.trim()) {
      alert('デバイスIDを入力してください')
      return
    }
    
    if (!date) {
      alert('日付を選択してください')
      return
    }
    
    onSubmit(deviceId.trim(), date)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="deviceId" className="block text-sm font-medium text-gray-700 mb-2">
          デバイスID
        </label>
        <input
          id="deviceId"
          type="text"
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
          placeholder="例: d067d407-cf73-4174-a9c1-d91fb60d64d0"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={disabled || loading}
        />
        <p className="mt-1 text-xs text-gray-500">
          行動パターンを分析するデバイスのIDを入力してください
        </p>
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
          分析日付
        </label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={disabled || loading}
        />
        <p className="mt-1 text-xs text-gray-500">
          分析する日付を選択してください
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="text-xs text-blue-800">
          <span className="font-medium">🤖 分析内容：</span>
          YamNetモデルによる音響イベント検出データを集計し、日常の行動パターンを分析します。
          トップ5の音響イベントと時間帯別の行動分布を生成します。
        </p>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          loading={loading}
          disabled={disabled}
        >
          {loading ? '🔄 分析中...' : '🤖 行動分析開始'}
        </Button>
      </div>
    </form>
  )
}