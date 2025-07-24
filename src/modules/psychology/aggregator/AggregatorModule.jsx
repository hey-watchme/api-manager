import { useState } from 'react'
import AggregatorForm from './AggregatorForm'
import AggregatorResults from './AggregatorResults'
import Card from '../../../components/common/Card'
import ApiStatusIndicator from '../../../components/api/ApiStatusIndicator'
import aggregatorApiClient from '../../../services/AggregatorApiClient'

function AggregatorModule() {
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data) => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await aggregatorApiClient.generateMoodPrompt(data.deviceId, data.date)
      setResult(response)
    } catch (error) {
      setError(error.message || 'プロンプト生成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card
      title="📝 Vibe Aggregator（プロンプト生成）"
      description="心理分析用のプロンプトを生成します"
      statusIndicator={<ApiStatusIndicator apiClient={aggregatorApiClient} />}
    >
      <AggregatorForm onSubmit={handleSubmit} loading={loading} />
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      {result && <AggregatorResults result={result} />}
    </Card>
  )
}

export default AggregatorModule