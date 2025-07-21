export default function TranscriberResults({ results }) {
  if (!results) return null

  const { summary, processing_time } = results

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">処理結果</h4>
      
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        {/* サマリー情報 */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">処理ファイル数:</span>
            <span className="ml-2 font-medium text-gray-900">
              {summary.total_processed || 0}
            </span>
          </div>
          <div>
            <span className="text-gray-600">処理時間:</span>
            <span className="ml-2 font-medium text-gray-900">
              {processing_time ? `${processing_time.toFixed(2)}秒` : '-'}
            </span>
          </div>
        </div>

        {/* 成功・失敗の詳細 */}
        {summary.successful && summary.successful.length > 0 && (
          <div>
            <h5 className="text-sm font-medium text-green-700 mb-2">
              ✅ 成功 ({summary.successful.length}件)
            </h5>
            <div className="space-y-1">
              {summary.successful.map((file, index) => (
                <div key={index} className="text-xs text-gray-600 font-mono bg-white p-2 rounded">
                  {file}
                </div>
              ))}
            </div>
          </div>
        )}

        {summary.failed && summary.failed.length > 0 && (
          <div>
            <h5 className="text-sm font-medium text-red-700 mb-2">
              ❌ 失敗 ({summary.failed.length}件)
            </h5>
            <div className="space-y-1">
              {summary.failed.map((file, index) => (
                <div key={index} className="text-xs text-gray-600 font-mono bg-white p-2 rounded">
                  {file}
                </div>
              ))}
            </div>
          </div>
        )}

        {summary.skipped && summary.skipped.length > 0 && (
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">
              ⏭️ スキップ ({summary.skipped.length}件)
            </h5>
            <div className="space-y-1">
              {summary.skipped.map((file, index) => (
                <div key={index} className="text-xs text-gray-600 font-mono bg-white p-2 rounded">
                  {file}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 生データ表示（デバッグ用） */}
      <details className="text-xs">
        <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
          詳細なレスポンスデータを表示
        </summary>
        <pre className="mt-2 p-3 bg-gray-100 rounded overflow-x-auto">
          {JSON.stringify(results, null, 2)}
        </pre>
      </details>
    </div>
  )
}