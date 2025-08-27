import React from 'react'
import AudioPlayer from './AudioPlayer'

const AudioFileRow = ({ audioFile, onPlayAudio }) => {
  // ファイルサイズをMBに変換
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  // 日時をフォーマット
  const formatDateTime = (localDate, timeBlock) => {
    if (!localDate) return 'Unknown'
    
    if (timeBlock) {
      // time_blockを時刻に変換（例: 14:30）
      const hours = Math.floor(timeBlock / 2)
      const minutes = (timeBlock % 2) * 30
      return `${localDate} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    }
    
    return localDate
  }

  // デバイスIDを完全表示（改行対応）
  const formatDeviceId = (deviceId) => {
    if (!deviceId) return 'Unknown'
    return deviceId
  }

  // ステータスの色を取得
  const getStatusColor = (status) => {
    const statusColors = {
      'completed': 'text-green-600',
      'processing': 'text-yellow-600', 
      'failed': 'text-red-600',
      'pending': 'text-gray-500',
      'error': 'text-red-600'
    }
    
    return statusColors[status] || 'text-gray-400'
  }

  // 3つの処理ステータスを統合して表示
  const renderProcessingStatus = () => {
    const statuses = [
      { name: 'transcriptions', status: audioFile.transcriptions_status },
      { name: 'behavior_features', status: audioFile.behavior_features_status },
      { name: 'emotion_features', status: audioFile.emotion_features_status }
    ]

    return (
      <div className="flex flex-col space-y-1">
        {statuses.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <span className="text-xs text-gray-600 w-20">{item.name}:</span>
            <span className={`text-xs font-medium ${getStatusColor(item.status)}`}>
              {item.status || 'unknown'}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <tr className="hover:bg-gray-50">
      {/* デバイスID */}
      <td className="px-4 py-3 text-sm">
        <div className="font-mono text-xs text-gray-900 break-all">
          {formatDeviceId(audioFile.device_id)}
        </div>
        {audioFile.device_name && (
          <div className="text-xs text-gray-500 mt-1">
            {audioFile.device_name}
          </div>
        )}
      </td>

      {/* ファイルパス */}
      <td className="px-4 py-3 text-sm">
        <div className="font-mono text-xs text-gray-900 break-all max-w-xs">
          {audioFile.file_path || 'Unknown'}
        </div>
      </td>

      {/* ファイルサイズ */}
      <td className="px-4 py-3 text-sm text-gray-900">
        {formatFileSize(audioFile.file_size_bytes)}
      </td>

      {/* ローカル日付 */}
      <td className="px-4 py-3 text-sm text-gray-900">
        <div className="font-medium">
          {audioFile.local_date || 'Unknown'}
        </div>
        {audioFile.created_at && (
          <div className="text-xs text-gray-500">
            作成: {new Date(audioFile.created_at).toLocaleString('ja-JP')}
          </div>
        )}
      </td>

      {/* タイムブロック */}
      <td className="px-4 py-3 text-sm text-gray-900">
        <div className="font-medium">
          {audioFile.time_block || 'Unknown'}
        </div>
      </td>

      {/* 処理ステータス */}
      <td className="px-4 py-3">
        {renderProcessingStatus()}
      </td>

      {/* Result (Transcription + Events) */}
      <td className="px-4 py-3 text-sm">
        <div className="font-mono text-xs text-gray-900 break-all max-w-xs">
          {/* Transcription */}
          <div className="mb-3">
            <div className="font-semibold text-blue-600 mb-1">TRANSCRIPTION:</div>
            {audioFile.transcription ? (
              <div className="max-h-20 overflow-y-auto bg-gray-50 p-2 rounded">
                {audioFile.transcription}
              </div>
            ) : (
              <span className="text-gray-400 italic">EMPTY</span>
            )}
          </div>
          
          {/* Events */}
          <div className="mb-3">
            <div className="font-semibold text-green-600 mb-1">EVENTS:</div>
            {audioFile.events ? (
              <div className="max-h-20 overflow-y-auto bg-gray-50 p-2 rounded">
                {JSON.stringify(audioFile.events, null, 2)}
              </div>
            ) : (
              <span className="text-gray-400 italic">EMPTY</span>
            )}
          </div>

          {/* Features Timeline */}
          <div>
            <div className="font-semibold text-purple-600 mb-1">FEATURES TIMELINE:</div>
            {audioFile.featuresTimeline ? (
              <div className="max-h-20 overflow-y-auto bg-gray-50 p-2 rounded">
                {JSON.stringify(audioFile.featuresTimeline, null, 2)}
              </div>
            ) : (
              <span className="text-gray-400 italic">EMPTY</span>
            )}
          </div>
        </div>
      </td>

      {/* アクション */}
      <td className="px-4 py-3">
        <AudioPlayer 
          filePath={audioFile.file_path}
          onPlay={onPlayAudio}
        />
      </td>
    </tr>
  )
}

export default AudioFileRow