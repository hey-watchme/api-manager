export default function TranscriberResults({ results }) {
  if (!results) return null

  const { status, summary, processed_files, error_files, execution_time_seconds, message } = results
  const isSuccess = status === 'success'

  return (
    <div className="space-y-4">
      {/* 成功/失敗のメイン表示 */}
      <div className={`rounded-lg p-4 ${isSuccess ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <div className="flex items-center">
          <div className={`text-2xl mr-3 ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
            {isSuccess ? '✅' : '❌'}
          </div>
          <div>
            <h4 className={`font-medium ${isSuccess ? 'text-green-900' : 'text-red-900'}`}>
              {isSuccess ? '処理完了' : '処理失敗'}
            </h4>
            <p className={`text-sm ${isSuccess ? 'text-green-800' : 'text-red-800'}`}>
              {message || (isSuccess ? '正常に処理されました' : 'エラーが発生しました')}
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        {/* サマリー情報 */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">総ファイル数:</span>
            <span className="ml-2 font-medium text-gray-900">
              {summary?.total_files || 0}
            </span>
          </div>
          <div>
            <span className="text-gray-600">処理済み:</span>
            <span className="ml-2 font-medium text-gray-900">
              {summary?.pending_processed || 0}
            </span>
          </div>
          <div>
            <span className="text-gray-600">処理時間:</span>
            <span className="ml-2 font-medium text-gray-900">
              {execution_time_seconds ? `${execution_time_seconds}秒` : '-'}
            </span>
          </div>
        </div>

        {/* 成功ファイルの詳細 */}
        {processed_files && processed_files.length > 0 && (
          <div>
            <h5 className="text-sm font-medium text-green-700 mb-2">
              ✅ 成功ファイル ({processed_files.length}件)
            </h5>
            <div className="space-y-1">
              {processed_files.map((file, index) => (
                <div key={index} className="text-xs text-gray-600 font-mono bg-white p-2 rounded">
                  {file}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 失敗ファイルの詳細 */}
        {error_files && error_files.length > 0 && (
          <div>
            <h5 className="text-sm font-medium text-red-700 mb-2">
              ❌ 失敗ファイル ({error_files.length}件)
            </h5>
            <div className="space-y-1">
              {error_files.map((file, index) => (
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