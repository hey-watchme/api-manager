import AudioFilesModule from '../modules/audio/AudioFilesModule'

export default function AudioFilesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🎵 オーディオファイル</h1>
        <p className="mt-2 text-lg text-gray-600">
          録音された音声ファイルの一覧表示・再生・ダウンロード・処理状況の確認が可能です
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <AudioFilesModule />
        </section>
      </div>

      <div className="mt-12 p-6 bg-green-50 rounded-lg">
        <h3 className="text-lg font-semibold text-green-900 mb-3">オーディオファイル機能</h3>
        <ol className="space-y-2 text-sm text-green-800">
          <li className="flex items-start">
            <span className="font-semibold mr-2">1.</span>
            <span>ファイル一覧: デバイス別・日付別に録音された音声ファイルを表示</span>
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2">2.</span>
            <span>フィルタリング: デバイスID、日付範囲、処理ステータスで絞り込み可能</span>
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2">3.</span>
            <span>音声再生: ブラウザで直接再生（署名付きURLを自動取得）</span>
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2">4.</span>
            <span>ダウンロード: 音声ファイルをローカルに保存</span>
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2">5.</span>
            <span>処理状況: 転写・行動・感情の各処理ステータスを確認</span>
          </li>
        </ol>
      </div>

      <div className="mt-6 p-6 bg-yellow-50 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-900 mb-3">注意事項</h3>
        <ul className="space-y-2 text-sm text-yellow-800">
          <li className="flex items-start">
            <span className="font-semibold mr-2">•</span>
            <span>音声ファイルは署名付きURLで安全にアクセスされます（1時間有効）</span>
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2">•</span>
            <span>大きなファイルの再生・ダウンロードには時間がかかる場合があります</span>
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2">•</span>
            <span>処理ステータスはリアルタイムに更新されない場合があります</span>
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2">•</span>
            <span>ファイル一覧は100件ずつページングされます</span>
          </li>
        </ul>
      </div>
    </div>
  )
}