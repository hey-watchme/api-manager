import React, { useState } from 'react'
import AudioFilesService from '../../services/AudioFilesService'

const AudioPlayer = ({ filePath, enhancedFilePath, onPlay }) => {
  const [audioUrl, setAudioUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentType, setCurrentType] = useState(null) // 'raw' or 'enhanced'

  const handlePlay = async (type = 'raw') => {
    try {
      setLoading(true)
      setError(null)
      setCurrentType(type)
      
      const targetPath = type === 'enhanced' ? enhancedFilePath : filePath
      
      if (!targetPath) {
        throw new Error(`${type === 'enhanced' ? 'Enhanced' : 'Raw'} ファイルが存在しません`)
      }
      
      if (onPlay) {
        onPlay(targetPath)
      }

      // 署名付きURLを取得
      const response = await AudioFilesService.getPresignedUrl(targetPath)
      
      if (response.presigned_url) {
        setAudioUrl(response.presigned_url)
      } else {
        throw new Error('署名付きURLの取得に失敗しました')
      }
    } catch (error) {
      console.error('音声再生エラー:', error)
      setError(error.message || '音声ファイルの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    try {
      const targetPath = currentType === 'enhanced' ? enhancedFilePath : filePath
      
      if (!targetPath) {
        return
      }
      
      const response = await AudioFilesService.getPresignedUrl(targetPath)
      if (response.presigned_url) {
        const link = document.createElement('a')
        link.href = response.presigned_url
        const filename = targetPath.split('/').pop()
        link.download = currentType === 'enhanced' ? `enhanced_${filename}` : filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error('ダウンロードエラー:', error)
    }
  }

  return (
    <div className="flex flex-col space-y-2" style={{ width: '200px' }}>
      {/* ボタングループ */}
      <div className="flex gap-2 items-center">
        {loading ? (
          <span className="text-gray-500 text-xs flex items-center">
            <span className="animate-spin mr-1">⏳</span>
            読み込み中...
          </span>
        ) : (
          <div className="flex gap-2">
            {/* RAW再生ボタン */}
            <button
              onClick={() => handlePlay('raw')}
              className="px-3 py-1 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded"
              title="Raw音声を再生"
            >
              ▶️ RAW
            </button>

            {/* ENHANCED再生ボタン（enhancedFilePathが存在する場合のみ表示） */}
            {enhancedFilePath && (
              <button
                onClick={() => handlePlay('enhanced')}
                className="px-3 py-1 text-xs bg-green-600 text-white hover:bg-green-700 rounded"
                title="Enhanced音声を再生"
              >
                ▶️ ENHANCED
              </button>
            )}
          </div>
        )}
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="text-red-500 text-xs">
          {error}
        </div>
      )}

      {/* オーディオプレイヤー */}
      {audioUrl && (
        <div className="mt-1">
          <div className="text-xs text-gray-600 mb-1 flex items-center justify-between">
            <span>{currentType === 'enhanced' ? '🎯 Enhanced' : '📼 Raw'}</span>
            {/* ダウンロードボタン（3点メニュー風） */}
            <button
              onClick={handleDownload}
              className="p-1 hover:bg-gray-100 rounded"
              title="ダウンロード"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </button>
          </div>
          <audio 
            controls 
            src={audioUrl}
            className="h-8"
            style={{ width: '100%' }}
            onError={() => setError('音声ファイルの再生に失敗しました')}
          >
            お使いのブラウザは音声再生に対応していません
          </audio>
        </div>
      )}
    </div>
  )
}

export default AudioPlayer