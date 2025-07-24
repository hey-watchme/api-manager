import { useState } from 'react'
import { ChevronDown, ChevronRight, CheckCircle, AlertCircle, Clock, BarChart3, Activity } from 'lucide-react'

export default function BehaviorAggregatorResults({ results, loading }) {
  const [expandedSections, setExpandedSections] = useState({
    status: true,
    summary: false,
    timeBlocks: false
  })

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle, color: 'text-green-600' }
      case 'failed':
        return { icon: AlertCircle, color: 'text-red-600' }
      case 'started':
        return { icon: Clock, color: 'text-blue-600' }
      default:
        return { icon: Activity, color: 'text-gray-600' }
    }
  }

  if (!results) return null

  const statusInfo = getStatusIcon(results.status)
  const StatusIcon = statusInfo.icon

  return (
    <div className="space-y-4">
      {/* タスクステータス */}
      <div className="border border-gray-200 rounded-md overflow-hidden">
        <button
          onClick={() => toggleSection('status')}
          className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            {expandedSections.status ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
            <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
            <span className="text-sm font-medium text-gray-900">タスクステータス</span>
          </div>
          <span className={`text-sm ${statusInfo.color}`}>
            {results.status === 'started' && loading ? '処理中...' : results.status}
          </span>
        </button>

        {expandedSections.status && (
          <div className="px-4 py-3 bg-white border-t border-gray-200">
            <div className="space-y-2">
              {results.task_id && (
                <div className="flex justify-between">
                  <span className="text-xs font-medium text-gray-600">タスクID:</span>
                  <span className="text-xs text-gray-900 font-mono">{results.task_id}</span>
                </div>
              )}
              {results.message && (
                <div className="flex justify-between">
                  <span className="text-xs font-medium text-gray-600">メッセージ:</span>
                  <span className="text-xs text-gray-900">{results.message}</span>
                </div>
              )}
              {results.progress !== undefined && (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600">進捗:</span>
                    <span className="text-xs text-gray-900">{results.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${results.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 分析結果 */}
      {results.status === 'completed' && results.result && (
        <>
          {/* サマリーランキング */}
          <div className="border border-gray-200 rounded-md overflow-hidden">
            <button
              onClick={() => toggleSection('summary')}
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                {expandedSections.summary ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
                <BarChart3 className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-900">行動パターン分析結果</span>
              </div>
            </button>

            {expandedSections.summary && (
              <div className="px-4 py-3 bg-white border-t border-gray-200">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                  <p className="text-xs text-blue-800">
                    <span className="font-medium">分析完了:</span> {results.result.device_id} の {results.result.date} のデータ
                  </p>
                </div>
                
                <p className="text-sm text-gray-600">
                  {results.result.message}
                </p>
                
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-xs text-gray-700">
                    <span className="font-medium">📊 詳細データについて:</span>
                    <br />
                    分析結果の詳細（音響イベントランキング、時間帯別分布など）は
                    Supabaseの behavior_summary テーブルに保存されています。
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 時間帯別分析（プレースホルダー） */}
          <div className="border border-gray-200 rounded-md overflow-hidden">
            <button
              onClick={() => toggleSection('timeBlocks')}
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                {expandedSections.timeBlocks ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
                <Activity className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-gray-900">時間帯別行動分布</span>
              </div>
            </button>

            {expandedSections.timeBlocks && (
              <div className="px-4 py-3 bg-white border-t border-gray-200">
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">
                    時間帯別の詳細な行動分布データは
                    <br />
                    Supabaseデータベースで確認できます
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    behavior_summary テーブルの time_blocks カラムに
                    <br />
                    48スロット分の音響イベント分布が保存されています
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* エラー情報 */}
      {results.status === 'failed' && results.message && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">エラーが発生しました</p>
              <p className="text-sm text-red-700 mt-1">{results.message}</p>
              {results.error && (
                <p className="text-xs text-red-600 mt-2 font-mono">{results.error}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}