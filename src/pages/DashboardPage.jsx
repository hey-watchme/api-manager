import { useState } from 'react'
import Card from '../components/common/Card'
import ApiStatusIndicator from '../components/api/ApiStatusIndicator'
import DashboardTimeblockForm from '../modules/dashboard/DashboardTimeblockForm'
import DashboardTimeblockResults from '../modules/dashboard/DashboardTimeblockResults'
import dashboardApiClient from '../services/DashboardApiClient'

function DashboardPage() {
  const [apiStatus] = useState('online')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(null)

  const handleSubmit = async ({ deviceId, date, timeBlocks }) => {
    setLoading(true)
    setError(null)
    setResults(null)
    setProgress(null)

    try {
      const response = await dashboardApiClient.generateMultipleTimeblocks(
        deviceId,
        date,
        timeBlocks,
        (progressInfo) => {
          setProgress(progressInfo)
        }
      )
      
      setResults(response)
    } catch (error) {
      setError(error.message || 'プロンプト生成に失敗しました')
    } finally {
      setLoading(false)
      setProgress(null)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">📊 ダッシュボード</h2>
        <p className="text-gray-600">タイムブロック単位での高精度プロンプト生成</p>
      </div>

      <Card className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                🧠 タイムブロック単位プロンプト生成
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                30分単位でWhisper + 音響イベントデータを統合し、詳細な心理分析プロンプトを生成します。
              </p>
            </div>
            <ApiStatusIndicator status={apiStatus} />
          </div>
          
          <div className="bg-gray-50 rounded-md p-3">
            <p className="text-xs text-gray-600">
              <span className="font-medium">APIエンドポイント:</span>{' '}
              <code className="bg-white px-1 py-0.5 rounded">
                GET /generate-timeblock-prompt
              </code>
            </p>
            <p className="text-xs text-gray-600 mt-1">
              <span className="font-medium">データソース:</span>{' '}
              vibe_whisper + behavior_yamnet + subjects
            </p>
            <p className="text-xs text-gray-600 mt-1">
              <span className="font-medium">保存先:</span>{' '}
              dashboardテーブル（promptカラム）
            </p>
          </div>
        </div>

        <div className="border-t pt-6">
          <DashboardTimeblockForm
            onSubmit={handleSubmit}
            loading={loading}
            disabled={apiStatus !== 'online'}
          />

          {/* 進捗表示 */}
          {progress && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-blue-900">
                  処理中: {progress.currentBlock || '...'} ({progress.current}/{progress.total})
                </p>
                <span className="text-sm text-blue-700">
                  {Math.round((progress.current / progress.total) * 100)}%
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* エラー表示 */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* 結果表示 */}
          {results && !loading && (
            <div className="mt-6">
              <DashboardTimeblockResults results={results} />
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default DashboardPage