import { useState, useEffect } from 'react'
import Button from '../../../components/common/Button'

function ScorerForm({ onSubmit, loading }) {
  const [deviceId, setDeviceId] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    // デフォルトデバイスIDを設定
    setDeviceId('d067d407-cf73-4174-a9c1-d91fb60d64d0')
    // 今日の日付を設定
    setDate(new Date().toISOString().split('T')[0])
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // UUID形式のバリデーション
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(deviceId)) {
      alert('デバイスIDはUUID形式で入力してください')
      return
    }

    onSubmit({ deviceId, date })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="deviceId" className="block text-sm font-medium text-gray-700">
            デバイスID
          </label>
          <input
            type="text"
            id="deviceId"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            placeholder="d067d407-cf73-4174-a9c1-d91fb60d64d0"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            disabled={loading}
            required
          />
        </div>
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
            日付
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            disabled={loading}
            required
          />
        </div>
      </div>
      <p className="text-sm text-gray-500">
        プロンプトを元にChatGPTで心理スコアを分析し、結果をデータベースに保存します
      </p>

      <Button type="submit" loading={loading}>
        🤖 スコアリング開始
      </Button>
    </form>
  )
}

export default ScorerForm