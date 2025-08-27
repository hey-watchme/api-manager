import React, { useState } from 'react'
import AudioFilesService from '../../services/AudioFilesService'

const AudioPlayer = ({ filePath, onPlay }) => {
  const [audioUrl, setAudioUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handlePlay = async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (onPlay) {
        onPlay(filePath)
      }

      // 署名付きURLを取得
      const response = await AudioFilesService.getPresignedUrl(filePath)
      
      if (response.presigned_url) {
        setAudioUrl(response.presigned_url)
      } else {
        throw new Error('署名付きURLの取得に失敗しました')
      }
    } catch (error) {
      console.error('音声再生エラー:', error)
      setError('音声ファイルの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    try {
      const response = await AudioFilesService.getPresignedUrl(filePath)
      if (response.presigned_url) {
        const link = document.createElement('a')
        link.href = response.presigned_url
        link.download = filePath.split('/').pop()
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error('ダウンロードエラー:', error)
      setError('ダウンロードに失敗しました')
    }
  }

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex space-x-1">
        {loading ? (
          <span className="text-gray-500 text-xs flex items-center">
            <span className="animate-spin mr-1">⏳</span>
            読み込み中...
          </span>
        ) : (
          <>
            <button
              onClick={handlePlay}
              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
              title="再生"
            >
              ▶️
            </button>
            <button
              onClick={handleDownload}
              className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
              title="ダウンロード"
            >
              📥
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="text-red-500 text-xs">
          {error}
        </div>
      )}

      {audioUrl && (
        <div className="mt-1">
          <audio 
            controls 
            src={audioUrl}
            className="h-8"
            style={{ minWidth: '150px', width: '150px' }}
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