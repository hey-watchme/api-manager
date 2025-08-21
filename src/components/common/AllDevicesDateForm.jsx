import { useState } from 'react'
import Button from './Button'

export default function AllDevicesDateForm({ 
  onSubmit, 
  loading, 
  disabled,
  title = '処理開始',
  description = '指定した日付の全デバイスを処理します',
  icon = '🤖'
}) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!date) {
      alert('日付を選択してください')
      return
    }
    
    onSubmit(date)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
          処理対象日付
        </label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={disabled || loading}
          required
        />
        <p className="mt-1 text-xs text-gray-500">
          処理する日付を選択してください
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="text-xs text-blue-800">
          <span className="font-medium">📊 処理内容：</span>
          {description}
        </p>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          loading={loading}
          disabled={disabled}
        >
          {loading ? '🔄 処理中...' : `${icon} ${title}`}
        </Button>
      </div>
    </form>
  )
}