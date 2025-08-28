import EmotionFeaturesModule from '../modules/emotion/features/EmotionFeaturesModule'
import EmotionAggregatorModule from '../modules/emotion/aggregator/EmotionAggregatorModule'

export default function EmotionPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">😊 感情グラフ</h2>
        <p className="text-gray-600">音声から感情特徴量を抽出し、時系列の感情変化パターンを分析します</p>
      </div>
      
      {/* Emotion Features モジュール */}
      <EmotionFeaturesModule />
      
      {/* Emotion Aggregator モジュール */}
      <div className="mt-8">
        <EmotionAggregatorModule />
      </div>
    </div>
  )
}