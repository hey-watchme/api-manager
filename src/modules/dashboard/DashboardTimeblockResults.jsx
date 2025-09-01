function DashboardTimeblockResults({ results }) {
  if (!results) return null

  const { success, results: blockResults, errors, totalProcessed, successCount, errorCount } = results

  return (
    <div className="space-y-4">
      {/* サマリー */}
      <div className={`p-4 rounded-md ${success ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
        <h4 className="text-sm font-semibold mb-2 text-gray-900">
          処理結果サマリー
        </h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">総処理数:</span>
            <span className="ml-2 font-medium">{totalProcessed}</span>
          </div>
          <div>
            <span className="text-gray-600">成功:</span>
            <span className="ml-2 font-medium text-green-600">{successCount}</span>
          </div>
          <div>
            <span className="text-gray-600">エラー:</span>
            <span className="ml-2 font-medium text-red-600">{errorCount}</span>
          </div>
        </div>
      </div>

      {/* 成功した処理の詳細 */}
      {blockResults && blockResults.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2 text-gray-900">
            ✅ 成功したタイムブロック
          </h4>
          <div className="bg-white border border-gray-200 rounded-md divide-y divide-gray-200">
            {blockResults.map((result) => (
              <div key={result.timeBlock} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-900">
                      {result.timeBlock}
                    </span>
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">
                      成功
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {result.prompt_length && `プロンプト長: ${result.prompt_length.toLocaleString()}文字`}
                  </div>
                </div>
                
                {/* データ状態の表示 */}
                <div className="mt-2 flex gap-3 text-xs">
                  <span className={`px-2 py-0.5 rounded ${
                    result.has_transcription 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {result.has_transcription ? '📝 発話あり' : '🔇 発話なし'}
                  </span>
                  <span className={`px-2 py-0.5 rounded ${
                    result.has_sed_data 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {result.has_sed_data 
                      ? `🎵 音響イベント: ${result.sed_events_count}件` 
                      : '🔇 音響イベントなし'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* エラーの詳細 */}
      {errors && errors.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2 text-red-900">
            ❌ エラーが発生したタイムブロック
          </h4>
          <div className="bg-red-50 border border-red-200 rounded-md divide-y divide-red-200">
            {errors.map((error) => (
              <div key={error.timeBlock} className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {error.timeBlock}
                  </span>
                  <span className="text-xs text-red-600">
                    エラー
                  </span>
                </div>
                <p className="text-xs text-red-600 mt-1">
                  {error.error}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 完了メッセージ */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-800">
          💡 プロンプトはdashboardテーブルのpromptカラムに保存されました。
          ChatGPTによる分析実行後、結果が同テーブルに格納されます。
        </p>
      </div>
    </div>
  )
}

export default DashboardTimeblockResults