import AllDevicesDateForm from '../../../components/common/AllDevicesDateForm'

function AggregatorForm({ onSubmit, loading, disabled }) {
  const handleSubmit = (date) => {
    onSubmit(date)
  }

  return (
    <AllDevicesDateForm
      onSubmit={handleSubmit}
      loading={loading}
      disabled={disabled}
      title="プロンプト生成開始"
      description="指定した日付の全48スロット（30分単位）のTranscriberデータをまとめて1つのプロンプトを生成します。指定した日付の全デバイスが処理対象となります。"
      icon="📝"
    />
  )
}

export default AggregatorForm