import AllDevicesDateForm from '../../../components/common/AllDevicesDateForm'

export default function EmotionAggregatorForm({ onSubmit, loading, disabled }) {
  const handleSubmit = (date) => {
    onSubmit(date)
  }

  return (
    <AllDevicesDateForm
      onSubmit={handleSubmit}
      loading={loading}
      disabled={disabled}
      title="感情分析開始"
      description="OpenSMILE音声特徴量データを集計し、時系列の感情変化パターンを分析します。指定した日付の全デバイスが処理対象となります。"
      icon="📊"
    />
  )
}