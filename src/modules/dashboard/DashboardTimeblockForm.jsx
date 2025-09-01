import { useState, useEffect } from 'react'
import Button from '../../components/common/Button'
import { supabase } from '../../services/supabase'

// タイムブロックの生成（00-00から23-30まで）
const generateTimeBlocks = () => {
  const blocks = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const h = hour.toString().padStart(2, '0')
      const m = minute.toString().padStart(2, '0')
      blocks.push(`${h}-${m}`)
    }
  }
  return blocks
}

const ALL_TIME_BLOCKS = generateTimeBlocks()

function DashboardTimeblockForm({ onSubmit, loading, disabled }) {
  const [deviceId, setDeviceId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedBlocks, setSelectedBlocks] = useState([])
  const [devices, setDevices] = useState([])
  const [loadingDevices, setLoadingDevices] = useState(true)
  const [selectAll, setSelectAll] = useState(false)

  useEffect(() => {
    fetchDevices()
  }, [])

  const fetchDevices = async () => {
    try {
      setLoadingDevices(true)
      const { data, error } = await supabase
        .from('devices')
        .select('device_id')
        .order('device_id')

      if (error) throw error

      setDevices(data || [])
      
      // デフォルトデバイスを設定（最もよく使われているデバイスID）
      if (data && data.length > 0) {
        // 9f7d6e27...があればそれを優先、なければ最初のものを使用
        const preferredDevice = data.find(d => d.device_id === '9f7d6e27-98c3-4c19-bdfb-f7fda58b9a93')
        setDeviceId(preferredDevice ? preferredDevice.device_id : data[0].device_id)
      }
    } catch (error) {
      console.error('Error fetching devices:', error)
      // エラー時はデフォルトデバイスIDを使用
      setDeviceId('9f7d6e27-98c3-4c19-bdfb-f7fda58b9a93')
    } finally {
      setLoadingDevices(false)
    }
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedBlocks([])
    } else {
      setSelectedBlocks([...ALL_TIME_BLOCKS])
    }
    setSelectAll(!selectAll)
  }

  const handleBlockToggle = (block) => {
    if (selectedBlocks.includes(block)) {
      setSelectedBlocks(selectedBlocks.filter(b => b !== block))
      setSelectAll(false)
    } else {
      const newBlocks = [...selectedBlocks, block]
      setSelectedBlocks(newBlocks)
      setSelectAll(newBlocks.length === ALL_TIME_BLOCKS.length)
    }
  }

  const handleSelectRange = (start, end) => {
    const startIdx = ALL_TIME_BLOCKS.indexOf(start)
    const endIdx = ALL_TIME_BLOCKS.indexOf(end)
    
    if (startIdx !== -1 && endIdx !== -1) {
      const minIdx = Math.min(startIdx, endIdx)
      const maxIdx = Math.max(startIdx, endIdx)
      const rangeBlocks = ALL_TIME_BLOCKS.slice(minIdx, maxIdx + 1)
      
      // 既存の選択と結合（重複を除く）
      const newBlocks = [...new Set([...selectedBlocks, ...rangeBlocks])]
      setSelectedBlocks(newBlocks)
      setSelectAll(newBlocks.length === ALL_TIME_BLOCKS.length)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (selectedBlocks.length === 0) {
      alert('少なくとも1つのタイムブロックを選択してください')
      return
    }
    onSubmit({ deviceId, date, timeBlocks: selectedBlocks })
  }

  // 時間帯ごとのクイック選択
  const quickSelections = [
    { label: '早朝 (5:00-9:00)', blocks: ALL_TIME_BLOCKS.filter(b => {
      const hour = parseInt(b.split('-')[0])
      return hour >= 5 && hour < 9
    })},
    { label: '午前 (9:00-12:00)', blocks: ALL_TIME_BLOCKS.filter(b => {
      const hour = parseInt(b.split('-')[0])
      return hour >= 9 && hour < 12
    })},
    { label: '午後 (12:00-17:00)', blocks: ALL_TIME_BLOCKS.filter(b => {
      const hour = parseInt(b.split('-')[0])
      return hour >= 12 && hour < 17
    })},
    { label: '夕方 (17:00-20:00)', blocks: ALL_TIME_BLOCKS.filter(b => {
      const hour = parseInt(b.split('-')[0])
      return hour >= 17 && hour < 20
    })},
    { label: '夜 (20:00-24:00)', blocks: ALL_TIME_BLOCKS.filter(b => {
      const hour = parseInt(b.split('-')[0])
      return hour >= 20 && hour < 24
    })},
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* デバイスID選択 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          📱 デバイスID
        </label>
        {loadingDevices ? (
          <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
            読み込み中...
          </div>
        ) : (
          <select
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={disabled || loading}
            required
          >
            {devices.length > 0 ? (
              devices.map(device => (
                <option key={device.device_id} value={device.device_id}>
                  {device.device_id}
                </option>
              ))
            ) : (
              <option value={deviceId}>{deviceId}</option>
            )}
          </select>
        )}
      </div>

      {/* 日付選択 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          📅 処理対象日付
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={disabled || loading}
          required
        />
      </div>

      {/* タイムブロック選択 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ⏰ タイムブロック選択 ({selectedBlocks.length}/48選択中)
        </label>
        
        {/* クイック選択ボタン */}
        <div className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            className={`px-3 py-1 text-xs rounded-md ${
              selectAll 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {selectAll ? '全解除' : '全選択'}
          </button>
          {quickSelections.map(({ label, blocks }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                const newBlocks = [...new Set([...selectedBlocks, ...blocks])]
                setSelectedBlocks(newBlocks)
                setSelectAll(newBlocks.length === ALL_TIME_BLOCKS.length)
              }}
              className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              {label}
            </button>
          ))}
        </div>

        {/* タイムブロックグリッド */}
        <div className="border border-gray-300 rounded-md p-3 max-h-60 overflow-y-auto">
          <div className="grid grid-cols-8 gap-1">
            {ALL_TIME_BLOCKS.map(block => (
              <button
                key={block}
                type="button"
                onClick={() => handleBlockToggle(block)}
                className={`px-2 py-1 text-xs rounded ${
                  selectedBlocks.includes(block)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } transition-colors`}
                disabled={disabled || loading}
              >
                {block}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          ※ 30分単位でデータを処理します。複数選択可能です。
        </p>
      </div>

      {/* 送信ボタン */}
      <div className="flex justify-end">
        <Button
          type="submit"
          loading={loading}
          disabled={disabled || loading || selectedBlocks.length === 0}
        >
          🚀 プロンプト生成開始
        </Button>
      </div>
    </form>
  )
}

export default DashboardTimeblockForm