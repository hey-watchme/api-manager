import { useState } from 'react'
import Button from '../../../components/common/Button'
import FetchPendingFilesButton from '../../../components/common/FetchPendingFilesButton'
import AudioFilesService from '../../../services/AudioFilesService'

export default function EmotionFeaturesForm({ onSubmit, loading, disabled }) {
  const [filePaths, setFilePaths] = useState('')
  const [featureSet, setFeatureSet] = useState('eGeMAPSv02')
  const [includeRawFeatures, setIncludeRawFeatures] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // ファイルパスを配列に変換（改行で分割し、空白を除去）
    const pathsArray = filePaths
      .split('\n')
      .map(path => path.trim())
      .filter(path => path.length > 0)
    
    if (pathsArray.length === 0) {
      alert('少なくとも1つのファイルパスを入力してください')
      return
    }
    
    onSubmit(pathsArray, featureSet, includeRawFeatures)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="filePaths" className="block text-sm font-medium text-gray-700">
            ファイルパス
          </label>
          <FetchPendingFilesButton
            onFetch={setFilePaths}
            fetchFunction={() => AudioFilesService.getPendingEmotionFiles()}
            disabled={disabled}
            loading={loading}
          />
        </div>
        <textarea
          id="filePaths"
          value={filePaths}
          onChange={(e) => setFilePaths(e.target.value)}
          placeholder="例: files/d067d407-cf73-4174-a9c1-d91fb60d64d0/2025-07-19/14-30/audio.wav"
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={disabled || loading}
        />
        <p className="mt-1 text-xs text-gray-500">
          複数のファイルパスを改行で区切って入力できます。不要なパスは削除できます。
        </p>
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-xs text-blue-800">
            <span className="font-medium">💡 情報：</span>
            OpenSMILEは音声から25種類の感情特徴量を1秒ごとに抽出します。
            処理時間は音声の長さに応じて変動します。
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="featureSet" className="block text-sm font-medium text-gray-700 mb-2">
          特徴量セット
        </label>
        <select
          id="featureSet"
          value={featureSet}
          onChange={(e) => setFeatureSet(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={disabled || loading}
        >
          <option value="eGeMAPSv02">eGeMAPSv02（感情分析用・25特徴量）</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          eGeMAPSv02は感情認識に最適化された特徴量セットです
        </p>
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={includeRawFeatures}
            onChange={(e) => setIncludeRawFeatures(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={disabled || loading}
          />
          <span className="ml-2 text-sm text-gray-700">
            生の特徴量データを含める（デバッグ用）
          </span>
        </label>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          loading={loading}
          disabled={disabled}
        >
          😊 感情特徴抽出開始
        </Button>
      </div>
    </form>
  )
}