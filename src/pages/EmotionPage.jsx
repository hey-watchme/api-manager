import EmotionFeaturesModule from '../modules/emotion/features/EmotionFeaturesModule'
import EmotionAggregatorModule from '../modules/emotion/aggregator/EmotionAggregatorModule'

export default function EmotionPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">😊 感情グラフ</h1>
        <p className="mt-2 text-lg text-gray-600">
          音声から感情特徴量を抽出し、時系列の感情変化パターンを分析します
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">1. 感情特徴抽出</h2>
          <EmotionFeaturesModule />
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">2. 感情分析</h2>
          <EmotionAggregatorModule />
        </section>
      </div>

      <div className="mt-12 p-6 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">処理フロー</h3>
        <ol className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start">
            <span className="font-semibold mr-2">1.</span>
            <span>感情特徴抽出: 音声ファイルからOpenSMILEで25種類の感情特徴量を1秒ごとに抽出</span>
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2">2.</span>
            <span>感情分析: 抽出された特徴量を集計し、時系列の感情変化パターンを分析</span>
          </li>
        </ol>
      </div>
    </div>
  )
}