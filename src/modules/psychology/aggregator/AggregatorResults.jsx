function AggregatorResults({ result }) {
  return (
    <div className="mt-6 space-y-4">
      <h3 className="text-lg font-medium text-gray-900">生成結果</h3>
      
      {result.prompt && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">生成されたプロンプト</h4>
          <div className="bg-gray-50 p-4 rounded-md">
            <pre className="whitespace-pre-wrap text-sm text-gray-800">{result.prompt}</pre>
          </div>
        </div>
      )}

      {result.metadata && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">メタデータ</h4>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
            {Object.entries(result.metadata).map(([key, value]) => (
              <div key={key} className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">{key}</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {result.supabase_path && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">保存先</h4>
          <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md font-mono">
            {result.supabase_path}
          </p>
        </div>
      )}
    </div>
  )
}

export default AggregatorResults