import AllDevicesDateForm from '../../../components/common/AllDevicesDateForm'

function ScorerForm({ onSubmit, loading, disabled }) {
  const handleSubmit = (date) => {
    onSubmit(date)
  }

  return (
    <AllDevicesDateForm
      onSubmit={handleSubmit}
      loading={loading}
      disabled={disabled}
      title="スコアリング開始"
      description="プロンプトを元にChatGPTで心理スコアを分析し、結果をデータベースに保存します。指定した日付の全デバイスが処理対象となります。"
      icon="🤖"
    />
  )
}

export default ScorerForm