import { useState } from 'react'
import Button from '../../../components/common/Button'
import FetchPendingFilesButton from '../../../components/common/FetchPendingFilesButton'
import AudioFilesService from '../../../services/AudioFilesService'

export default function WhisperTranscriberForm({ onSubmit, loading, disabled }) {
  const [filePaths, setFilePaths] = useState('')
  const [model, setModel] = useState('base')

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
    
    onSubmit(pathsArray, model)
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
            fetchFunction={() => AudioFilesService.getPendingAudioFiles()}
            disabled={disabled}
            loading={loading}
          />
        </div>
        
        <textarea
          id="filePaths"
          value={filePaths}
          onChange={(e) => setFilePaths(e.target.value)}
          placeholder="例: files/d067d407-cf73-4174-a9c1-d91fb60d64d0/2025-07-21/00-30/audio.wav"
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={disabled || loading}
        />
        <p className="mt-1 text-xs text-gray-500">
          複数のファイルパスを改行で区切って入力できます。不要なパスは削除できます。
        </p>
        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-xs text-yellow-800">
            <span className="font-medium">⚠️ 重要：</span>
            OpenAI Whisper処理は約2-3秒/分程度かかります。タイムアウトエラーが表示されても、
            実際の処理は成功している場合がほとんどです。処理状況はデータベースで確認してください。
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
          モデル
        </label>
        <select
          id="model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={disabled || loading}
        >
          <option value="base">base（標準）</option>
          <option value="small" disabled>small（軽量）- 本番環境では使用不可</option>
          <option value="medium" disabled>medium（中程度）- 本番環境では使用不可</option>
          <option value="large" disabled>large（高精度）- 本番環境では使用不可</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          本番環境（t4g.small, 2GB RAM）ではbaseモデルのみ使用可能です。
        </p>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          loading={loading}
          disabled={disabled}
        >
          🎤 Whisper Transcriber処理開始
        </Button>
      </div>
    </form>
  )
}