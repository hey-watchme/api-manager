import { useState, useEffect } from 'react'
import Card from '../components/common/Card'

function SystemStatusPage() {
  const [sqsStatus, setSqsStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchSQSStatus = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/sqs/status')

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setSqsStatus(data)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err.message || 'SQS status fetch failed')
      console.error('SQS status error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSQSStatus()

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSQSStatus, 30000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (count) => {
    if (count === 0) return 'text-green-600'
    if (count < 10) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusBadge = (count) => {
    if (count === 0) return 'bg-green-100 text-green-800'
    if (count < 10) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">📊 システムステータス</h2>
          <p className="text-gray-600">SQSキューとDLQの状態をリアルタイム監視</p>
        </div>
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              最終更新: {lastUpdated.toLocaleTimeString('ja-JP')}
            </span>
          )}
          <button
            onClick={fetchSQSStatus}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? '更新中...' : '🔄 更新'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">⚠️ {error}</p>
        </div>
      )}

      {loading && !sqsStatus && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {sqsStatus && (
        <div className="grid grid-cols-1 gap-6">
          {/* Main Queues */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📬 メインキュー（FIFO）</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sqsStatus.queues && sqsStatus.queues.map((queue) => (
                <div key={queue.name} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium text-gray-900">{queue.name}</h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(queue.available)}`}>
                      {queue.available === 0 ? '正常' : '注意'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">待機中:</span>
                      <span className={`text-lg font-semibold ${getStatusColor(queue.available)}`}>
                        {queue.available}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">処理中:</span>
                      <span className="text-lg font-semibold text-blue-600">
                        {queue.inflight}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Dead Letter Queues */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">☠️ デッドレターキュー（DLQ）</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sqsStatus.dlqs && sqsStatus.dlqs.map((dlq) => (
                <div key={dlq.name} className={`border rounded-lg p-4 ${dlq.messages > 0 ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium text-gray-900">{dlq.name}</h4>
                    {dlq.messages > 0 && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                        失敗あり
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">失敗メッセージ:</span>
                    <span className={`text-2xl font-bold ${dlq.messages > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {dlq.messages}
                    </span>
                  </div>

                  {dlq.messages > 0 && (
                    <div className="mt-3 pt-3 border-t border-red-200">
                      <p className="text-xs text-red-700">
                        ⚠️ 処理に失敗したメッセージがあります
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Dashboard Summary Queue */}
          {sqsStatus.dashboard_queue && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 ダッシュボードキュー</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Summary Queue</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">待機中:</span>
                      <span className={`text-lg font-semibold ${getStatusColor(sqsStatus.dashboard_queue.summary.available)}`}>
                        {sqsStatus.dashboard_queue.summary.available}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">処理中:</span>
                      <span className="text-lg font-semibold text-blue-600">
                        {sqsStatus.dashboard_queue.summary.inflight}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Analysis Queue</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">待機中:</span>
                      <span className={`text-lg font-semibold ${getStatusColor(sqsStatus.dashboard_queue.analysis.available)}`}>
                        {sqsStatus.dashboard_queue.analysis.available}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">処理中:</span>
                      <span className="text-lg font-semibold text-blue-600">
                        {sqsStatus.dashboard_queue.analysis.inflight}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Information */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">📖 ステータス解説</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <p><strong>待機中 (Available):</strong> キューに待機中のメッセージ数</p>
              <p><strong>処理中 (InFlight):</strong> 現在Lambda Workerが処理中のメッセージ数</p>
              <p><strong>DLQ (Dead Letter Queue):</strong> 3回リトライしても処理できなかったメッセージ</p>
              <p><strong>正常状態:</strong> 待機中=0、処理中=0-3</p>
              <p><strong>異常状態:</strong> DLQにメッセージが蓄積（原因調査が必要）</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default SystemStatusPage
