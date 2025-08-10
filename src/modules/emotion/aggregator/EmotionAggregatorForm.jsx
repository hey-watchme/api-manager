import { useState } from 'react'
import Button from '../../../components/common/Button'
import DeviceIdInput from '../../../components/common/DeviceIdInput'
import { DEFAULT_DEVICE_ID } from '../../../config/constants'

export default function EmotionAggregatorForm({ onSubmit, loading, disabled }) {
  const [deviceId, setDeviceId] = useState(DEFAULT_DEVICE_ID)
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
      <DeviceIdInput
        value={deviceId}
        onChange={setDeviceId}
        disabled={disabled || loading}
        helpText="感情特徴量を分析するデバイスのIDを入力してください"
      />

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
          <span className="font-medium">📊 分析内容：</span>
          選択した日付の感情特徴量データを集計し、時系列の感情変化パターンを分析します。
          1日分のデータから感情の推移と統計情報を生成します。
        </p>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          loading={loading}
          disabled={disabled}
        >
          📊 感情分析開始
        </Button>
      </div>
    </form>
  )
}