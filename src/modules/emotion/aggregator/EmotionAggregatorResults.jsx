import { useState } from 'react'
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react'

export default function EmotionAggregatorResults({ results }) {
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    statistics: false,
    timeline: false
  })

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const formatValue = (value) => {
    if (typeof value === 'number') {
      return value.toFixed(3)
    }
    return value || '-'
  }

  const getEmotionTrend = (value) => {
    if (value > 0.1) return { icon: TrendingUp, color: 'text-green-600' }
    if (value < -0.1) return { icon: TrendingDown, color: 'text-red-600' }
    return { icon: Activity, color: 'text-gray-600' }
  }

  if (!results) return null

  return (
    <div className="space-y-4">
      {/* 処理結果サマリー */}
      <div className={`bg-${results.success ? 'green' : 'red'}-50 border border-${results.success ? 'green' : 'red'}-200 rounded-md p-4`}>
        <p className="text-sm font-medium text-gray-800">
          {results.message || (results.success ? '感情分析が完了しました' : 'エラーが発生しました')}
        </p>
        {results.processing_time && (
          <p className="text-xs text-gray-600 mt-1">
            処理時間: {results.processing_time.toFixed(2)}秒
          </p>
        )}
      </div>

      {/* 分析結果セクション */}
      {results.analysis && (
        <div className="space-y-3">
          {/* サマリーセクション */}
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
                <BarChart3 className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-900">分析サマリー</span>
              </div>
            </button>

            {expandedSections.summary && results.analysis.summary && (
              <div className="px-4 py-3 bg-white border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-600">分析日</p>
                    <p className="text-sm text-gray-900">{results.analysis.date}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600">デバイスID</p>
                    <p className="text-sm text-gray-900 truncate">{results.analysis.device_id}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600">分析期間</p>
                    <p className="text-sm text-gray-900">{results.analysis.summary.total_slots}スロット</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600">データポイント数</p>
                    <p className="text-sm text-gray-900">{results.analysis.summary.total_points || '-'}</p>
                  </div>
                </div>

                {results.analysis.summary.emotion_overview && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-md">
                    <h5 className="text-xs font-medium text-gray-700 mb-2">感情の概要</h5>
                    <p className="text-xs text-gray-600">
                      {results.analysis.summary.emotion_overview}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 統計情報セクション */}
          <div className="border border-gray-200 rounded-md overflow-hidden">
            <button
              onClick={() => toggleSection('statistics')}
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                {expandedSections.statistics ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
                <Activity className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-900">統計情報</span>
              </div>
            </button>

            {expandedSections.statistics && results.analysis.statistics && (
              <div className="px-4 py-3 bg-white border-t border-gray-200">
                <div className="space-y-3">
                  {Object.entries(results.analysis.statistics).map(([key, stats]) => {
                    const trend = getEmotionTrend(stats.trend || 0)
                    const TrendIcon = trend.icon
                    
                    return (
                      <div key={key} className="border-b border-gray-100 pb-2 last:border-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-700">{key}</span>
                          <TrendIcon className={`h-3 w-3 ${trend.color}`} />
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">平均:</span>
                            <span className="ml-1 text-gray-900">{formatValue(stats.mean)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">標準偏差:</span>
                            <span className="ml-1 text-gray-900">{formatValue(stats.std)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">最小:</span>
                            <span className="ml-1 text-gray-900">{formatValue(stats.min)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">最大:</span>
                            <span className="ml-1 text-gray-900">{formatValue(stats.max)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* タイムラインセクション */}
          <div className="border border-gray-200 rounded-md overflow-hidden">
            <button
              onClick={() => toggleSection('timeline')}
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                {expandedSections.timeline ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
                <Activity className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-gray-900">時系列データ</span>
              </div>
            </button>

            {expandedSections.timeline && results.analysis.timeline && (
              <div className="px-4 py-3 bg-white border-t border-gray-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-2 py-1 text-left font-medium text-gray-700">時間</th>
                        <th className="px-2 py-1 text-left font-medium text-gray-700">Loudness</th>
                        <th className="px-2 py-1 text-left font-medium text-gray-700">F0</th>
                        <th className="px-2 py-1 text-left font-medium text-gray-700">Energy</th>
                        <th className="px-2 py-1 text-left font-medium text-gray-700">感情スコア</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {results.analysis.timeline.slice(0, 10).map((point, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-2 py-1 text-gray-900">{point.time_slot}</td>
                          <td className="px-2 py-1 text-gray-600">{formatValue(point.loudness)}</td>
                          <td className="px-2 py-1 text-gray-600">{formatValue(point.f0)}</td>
                          <td className="px-2 py-1 text-gray-600">{formatValue(point.energy)}</td>
                          <td className="px-2 py-1 text-gray-600">{formatValue(point.emotion_score)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {results.analysis.timeline.length > 10 && (
                    <p className="mt-2 text-xs text-gray-500">
                      他 {results.analysis.timeline.length - 10} 件のデータ...
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* エラー情報 */}
      {results.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{results.error}</p>
        </div>
      )}
    </div>
  )
}