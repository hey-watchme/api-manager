import AllDevicesDateForm from '../../../components/common/AllDevicesDateForm'

export default function BehaviorAggregatorForm({ onSubmit, loading, disabled }) {
  const handleSubmit = (date) => {
    onSubmit(date)
  }

  return (
    <AllDevicesDateForm
      onSubmit={handleSubmit}
      loading={loading}
      disabled={disabled}
      title="行動分析開始"
      description="YamNetモデルによる音響イベント検出データを集計し、日常の行動パターンを分析します。指定した日付の全デバイスが処理対象となります。"
      icon="🤖"
    />
  )
}