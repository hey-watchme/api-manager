import { useState } from 'react'
import { ChevronDown, ChevronRight, Clock, FileAudio, AlertCircle, CheckCircle } from 'lucide-react'

export default function EmotionFeaturesResults({ results }) {
  const [expandedFiles, setExpandedFiles] = useState({})

  const toggleExpand = (index) => {
    setExpandedFiles(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}分${secs}秒`
  }

  const formatFeatureValue = (value) => {
    if (typeof value === 'number') {
      return value.toFixed(3)
    }
    return value
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-center gap-2">
          {results.success ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}
          <p className="text-sm font-medium text-gray-800">
            処理結果: {results.message}
          </p>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div>処理ファイル数: {results.processed_files}</div>
          <div>保存ファイル数: {results.saved_files?.length || 0}</div>
          <div>特徴量セット: {results.feature_set}</div>
          <div>総処理時間: {results.total_processing_time?.toFixed(2)}秒</div>
        </div>
      </div>

      {results.results && results.results.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">処理詳細:</h4>
          
          {results.results.map((result, index) => (
            <div key={index} className="border border-gray-200 rounded-md overflow-hidden">
              <button
                onClick={() => toggleExpand(index)}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {expandedFiles[index] ? (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  )}
                  <FileAudio className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-900">
                    {result.date} {result.slot}
                  </span>
                  {result.error && (
                    <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                      エラー
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {result.duration_seconds ? formatDuration(result.duration_seconds) : '-'}
                  </span>
                  <span>処理時間: {result.processing_time?.toFixed(2)}秒</span>
                </div>
              </button>

              {expandedFiles[index] && (
                <div className="px-4 py-3 bg-white border-t border-gray-200">
                  {result.error ? (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-800">{result.error}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600">
                        <p>ファイル名: {result.filename}</p>
                        <p>タイムラインポイント数: {result.features_timeline?.length || 0}</p>
                      </div>

                      {result.features_timeline && result.features_timeline.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">
                            特徴量サンプル（最初の5秒）:
                          </h5>
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-xs">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="px-2 py-1 text-left font-medium text-gray-700">時刻</th>
                                  <th className="px-2 py-1 text-left font-medium text-gray-700">Loudness</th>
                                  <th className="px-2 py-1 text-left font-medium text-gray-700">F0</th>
                                  <th className="px-2 py-1 text-left font-medium text-gray-700">Alpha Ratio</th>
                                  <th className="px-2 py-1 text-left font-medium text-gray-700">Hammarberg</th>
                                  <th className="px-2 py-1 text-left font-medium text-gray-700">MFCC1</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {result.features_timeline.slice(0, 5).map((point, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-2 py-1 text-gray-900">{point.timestamp}</td>
                                    <td className="px-2 py-1 text-gray-600">
                                      {formatFeatureValue(point.features?.Loudness_sma3)}
                                    </td>
                                    <td className="px-2 py-1 text-gray-600">
                                      {formatFeatureValue(point.features?.F0semitoneFrom27_5Hz_sma3nz)}
                                    </td>
                                    <td className="px-2 py-1 text-gray-600">
                                      {formatFeatureValue(point.features?.alphaRatio_sma3)}
                                    </td>
                                    <td className="px-2 py-1 text-gray-600">
                                      {formatFeatureValue(point.features?.hammarbergIndex_sma3)}
                                    </td>
                                    <td className="px-2 py-1 text-gray-600">
                                      {formatFeatureValue(point.features?.mfcc1_sma3)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {result.features_timeline.length > 5 && (
                            <p className="mt-2 text-xs text-gray-500">
                              他 {result.features_timeline.length - 5} ポイント...
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}