import { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'

function TimeblockAnalysisResults({ results }) {
  const [expandedBlocks, setExpandedBlocks] = useState(new Set())

  if (!results || !results.results) {
    return null
  }

  const toggleExpanded = (timeBlock) => {
    const newExpanded = new Set(expandedBlocks)
    if (newExpanded.has(timeBlock)) {
      newExpanded.delete(timeBlock)
    } else {
      newExpanded.add(timeBlock)
    }
    setExpandedBlocks(newExpanded)
  }

  const formatScore = (score) => {
    if (score === null || score === undefined) return 'N/A'
    const numScore = parseFloat(score)
    if (numScore > 0) return `+${numScore}`
    return numScore.toString()
  }

  const getScoreColor = (score) => {
    if (score === null || score === undefined) return 'text-gray-500'
    const numScore = parseFloat(score)
    if (numScore > 20) return 'text-green-600'
    if (numScore > 0) return 'text-green-500'
    if (numScore > -20) return 'text-orange-500'
    return 'text-red-600'
  }

  const getMoodEmoji = (mood) => {
    const moodMap = {
      'happy': '😊',
      'excited': '🎉',
      'calm': '😌',
      'neutral': '😐',
      'anxious': '😰',
      'frustrated': '😤',
      'sad': '😢',
      'tired': '😴',
      'stressed': '😫'
    }
    return moodMap[mood] || '🤔'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          🎯 分析結果
        </h3>
        <div className="text-sm text-gray-600">
          成功: {results.successCount} / 失敗: {results.errorCount}
        </div>
      </div>

      {/* サマリー */}
      {results.successCount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">処理完了</p>
              <p className="text-xs text-blue-700 mt-1">
                {results.totalProcessed}個のタイムブロックを分析しました
              </p>
            </div>
            {results.successCount > 0 && (
              <div className="text-right">
                <p className="text-xs text-blue-700">平均スコア</p>
                <p className="text-lg font-bold text-blue-900">
                  {(() => {
                    const scores = results.results
                      .filter(r => r.status === 'success' && r.analysis_result?.vibe_score !== undefined)
                      .map(r => r.analysis_result.vibe_score)
                    if (scores.length === 0) return 'N/A'
                    const avg = scores.reduce((a, b) => a + b, 0) / scores.length
                    return formatScore(avg.toFixed(1))
                  })()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* エラー表示 */}
      {results.errors && results.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm font-medium text-red-900 mb-2">エラーが発生したタイムブロック:</p>
          {results.errors.map((error, idx) => (
            <div key={idx} className="text-xs text-red-700">
              {error.timeBlock}: {error.error}
            </div>
          ))}
        </div>
      )}

      {/* 各タイムブロックの結果 */}
      <div className="space-y-2">
        {results.results
          .filter(r => r.status === 'success')
          .map((result) => {
            const analysis = result.analysis_result
            const isExpanded = expandedBlocks.has(result.timeBlock)
            
            return (
              <div 
                key={result.timeBlock}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <div 
                  className="flex items-center justify-between p-3 bg-white hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleExpanded(result.timeBlock)}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-900">
                      {result.timeBlock}
                    </span>
                    {analysis && (
                      <>
                        <span className={`text-sm font-bold ${getScoreColor(analysis.vibe_score)}`}>
                          {formatScore(analysis.vibe_score)}
                        </span>
                        {analysis.detected_mood && (
                          <span className="text-lg" title={analysis.detected_mood}>
                            {getMoodEmoji(analysis.detected_mood)}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {result.database_save && (
                      <span className="text-xs text-green-600">DB保存済</span>
                    )}
                    {isExpanded ? (
                      <ChevronUpIcon className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {isExpanded && analysis && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    {/* サマリー */}
                    {analysis.summary && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-700 mb-1">サマリー:</p>
                        <p className="text-sm text-gray-600">{analysis.summary}</p>
                      </div>
                    )}

                    {/* 主要な観察点 */}
                    {analysis.key_observations && analysis.key_observations.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-700 mb-1">主要な観察点:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {analysis.key_observations.map((obs, idx) => (
                            <li key={idx} className="text-sm text-gray-600">{obs}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 検出された活動 */}
                    {analysis.detected_activities && analysis.detected_activities.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-700 mb-1">検出された活動:</p>
                        <div className="flex flex-wrap gap-1">
                          {analysis.detected_activities.map((activity, idx) => (
                            <span 
                              key={idx}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                            >
                              {activity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* スコア詳細 */}
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-xs font-medium text-gray-700">感情スコア:</p>
                        <p className={`text-lg font-bold ${getScoreColor(analysis.vibe_score)}`}>
                          {formatScore(analysis.vibe_score)}
                        </p>
                      </div>
                      {analysis.confidence_score !== undefined && (
                        <div>
                          <p className="text-xs font-medium text-gray-700">信頼度:</p>
                          <p className="text-lg font-bold text-gray-900">
                            {(analysis.confidence_score * 100).toFixed(0)}%
                          </p>
                        </div>
                      )}
                    </div>

                    {/* コンテキストノート */}
                    {analysis.context_notes && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-medium text-gray-700 mb-1">コンテキスト:</p>
                        <p className="text-xs text-gray-500">{analysis.context_notes}</p>
                      </div>
                    )}

                    {/* 処理情報 */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>処理時刻: {new Date(result.processed_at).toLocaleString('ja-JP')}</span>
                        {result.model_used && (
                          <span>モデル: {result.model_used}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
      </div>
    </div>
  )
}

export default TimeblockAnalysisResults