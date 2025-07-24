function ScorerResults({ result }) {
  return (
    <div className="mt-6 space-y-4">
      <h3 className="text-lg font-medium text-gray-900">🧠 心理分析結果</h3>
      
      {/* スコアサマリー */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {result.average_score !== undefined && (
          <div className="text-center p-3 bg-white rounded border">
            <div className="text-2xl font-bold text-blue-600">{result.average_score}</div>
            <div className="text-sm text-gray-600">平均スコア</div>
          </div>
        )}
        {result.positive_time_minutes !== undefined && (
          <div className="text-center p-3 bg-white rounded border">
            <div className="text-2xl font-bold text-green-600">{result.positive_time_minutes}min</div>
            <div className="text-sm text-gray-600">ポジティブ時間</div>
          </div>
        )}
        {result.negative_time_minutes !== undefined && (
          <div className="text-center p-3 bg-white rounded border">
            <div className="text-2xl font-bold text-red-600">{result.negative_time_minutes}min</div>
            <div className="text-sm text-gray-600">ネガティブ時間</div>
          </div>
        )}
        {result.neutral_time_minutes !== undefined && (
          <div className="text-center p-3 bg-white rounded border">
            <div className="text-2xl font-bold text-gray-600">{result.neutral_time_minutes}min</div>
            <div className="text-sm text-gray-600">ニュートラル時間</div>
          </div>
        )}
      </div>

      {/* インサイト */}
      {result.insights && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">💡 インサイト</h4>
          <div className="text-sm text-blue-700 whitespace-pre-wrap">{result.insights}</div>
        </div>
      )}

      {/* 感情変化ポイント */}
      {result.emotion_changes && result.emotion_changes.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-medium text-purple-900 mb-2">📈 感情変化ポイント</h4>
          <div className="text-sm text-purple-700 space-y-2">
            {result.emotion_changes.map((change, index) => (
              <div key={index} className="flex justify-between items-center">
                <span>{change.time}</span>
                <span className="font-medium">{change.emotion}</span>
                <span className="text-xs bg-purple-100 px-2 py-1 rounded">{change.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* その他の結果データ */}
      {result.status && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-3">✅ 処理結果</h4>
          <div className="text-sm text-green-700 space-y-2">
            <div>ステータス: <span className="font-medium">{result.status}</span></div>
            {result.message && <div>メッセージ: <span className="font-medium">{result.message}</span></div>}
            <div>処理時刻: <span className="font-medium">{new Date().toLocaleString('ja-JP')}</span></div>
          </div>
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

export default ScorerResults