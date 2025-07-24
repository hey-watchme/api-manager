import { useState } from 'react'
import ScorerForm from './ScorerForm'
import ScorerResults from './ScorerResults'
import Card from '../../../components/common/Card'
import ApiStatusIndicator from '../../../components/api/ApiStatusIndicator'
import scorerApiClient from '../../../services/ScorerApiClient'

function ScorerModule() {
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data) => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await scorerApiClient.analyzeVibeGraph(data.deviceId, data.date)
      setResult(response)
    } catch (error) {
      setError(error.message || 'スコアリングに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card
      title="🤖 Vibe Scorer（スコアリング）"
      description="心理状態のスコアを算出します"
      statusIndicator={<ApiStatusIndicator apiClient={scorerApiClient} />}
    >
      <ScorerForm onSubmit={handleSubmit} loading={loading} />
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      {result && <ScorerResults result={result} />}
    </Card>
  )
}

export default ScorerModule