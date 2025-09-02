import { useState } from 'react'
import Card from '../components/common/Card'
import ApiStatusIndicator from '../components/api/ApiStatusIndicator'
import DashboardTimeblockForm from '../modules/dashboard/DashboardTimeblockForm'
import DashboardTimeblockResults from '../modules/dashboard/DashboardTimeblockResults'
import TimeblockAnalysisResults from '../modules/dashboard/TimeblockAnalysisResults'
import dashboardApiClient from '../services/DashboardApiClient'
import timeblockAnalysisClient from '../services/TimeblockAnalysisClient'
import { supabase } from '../services/supabase'

function DashboardPage() {
  const [apiStatus] = useState('online')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(null)
  
  // タイムブロック分析用の状態
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [analysisResults, setAnalysisResults] = useState(null)
  const [analysisError, setAnalysisError] = useState(null)
  const [analysisProgress, setAnalysisProgress] = useState(null)

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

  const handleAnalysisSubmit = async ({ deviceId, date, timeBlocks }) => {
    setAnalysisLoading(true)
    setAnalysisError(null)
    setAnalysisResults(null)
    setAnalysisProgress(null)

    try {
      // まず、選択されたタイムブロックのプロンプトを取得
      const timeblockData = []
      
      for (const timeBlock of timeBlocks) {
        setAnalysisProgress({
          current: timeblockData.length,
          total: timeBlocks.length,
          currentBlock: timeBlock,
          processing: true,
          phase: 'プロンプト取得中'
        })
        
        try {
          // Supabaseのdashboardテーブルから直接プロンプトを取得
          const { data, error } = await supabase
            .from('dashboard')
            .select('prompt')
            .eq('device_id', deviceId)
            .eq('date', date)
            .eq('time_block', timeBlock)
            .single()
          
          if (error) {
            console.error(`Failed to get prompt for ${timeBlock}:`, error)
          } else if (data?.prompt) {
            timeblockData.push({
              timeBlock,
              prompt: data.prompt
            })
          }
        } catch (error) {
          console.error(`Failed to get prompt for ${timeBlock}:`, error)
        }
      }

      if (timeblockData.length === 0) {
        throw new Error('プロンプトを取得できませんでした。先にプロンプト生成を実行してください。')
      }

      // プロンプトを使用してChatGPT分析を実行
      setAnalysisProgress({
        phase: 'ChatGPT分析中'
      })
      
      const response = await timeblockAnalysisClient.analyzeMultipleTimeblocks(
        timeblockData,
        deviceId,
        date,
        (progressInfo) => {
          setAnalysisProgress({
            ...progressInfo,
            phase: 'ChatGPT分析中'
          })
        }
      )
      
      setAnalysisResults(response)
    } catch (error) {
      setAnalysisError(error.message || 'タイムブロック分析に失敗しました')
    } finally {
      setAnalysisLoading(false)
      setAnalysisProgress(null)
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

      {/* タイムブロック分析セクション */}
      <Card className="p-6 mt-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                🤖 タイムブロック単位ChatGPT分析
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                生成されたプロンプトを使用してChatGPTで心理状態を分析し、dashboardテーブルに保存します。
              </p>
            </div>
            <ApiStatusIndicator status={apiStatus} />
          </div>
          
          <div className="bg-gray-50 rounded-md p-3">
            <p className="text-xs text-gray-600">
              <span className="font-medium">APIエンドポイント:</span>{' '}
              <code className="bg-white px-1 py-0.5 rounded">
                POST /analyze-timeblock
              </code>
            </p>
            <p className="text-xs text-gray-600 mt-1">
              <span className="font-medium">処理内容:</span>{' '}
              ChatGPT分析 → vibe_score算出 → analysis_result保存
            </p>
            <p className="text-xs text-gray-600 mt-1">
              <span className="font-medium">保存先:</span>{' '}
              dashboardテーブル（summary, vibe_score, analysis_resultカラム）
            </p>
          </div>
        </div>

        <div className="border-t pt-6">
          <DashboardTimeblockForm
            onSubmit={handleAnalysisSubmit}
            loading={analysisLoading}
            disabled={apiStatus !== 'online'}
          />

          {/* 進捗表示 */}
          {analysisProgress && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-blue-900">
                  {analysisProgress.phase || '処理中'}: {analysisProgress.currentBlock || '...'} 
                  {analysisProgress.total && ` (${analysisProgress.current}/${analysisProgress.total})`}
                </p>
                {analysisProgress.total && (
                  <span className="text-sm text-blue-700">
                    {Math.round((analysisProgress.current / analysisProgress.total) * 100)}%
                  </span>
                )}
              </div>
              {analysisProgress.total && (
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(analysisProgress.current / analysisProgress.total) * 100}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* エラー表示 */}
          {analysisError && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{analysisError}</p>
            </div>
          )}

          {/* 結果表示 */}
          {analysisResults && !analysisLoading && (
            <div className="mt-6">
              <TimeblockAnalysisResults results={analysisResults} />
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default DashboardPage