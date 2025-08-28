import React from 'react'
import AudioPlayer from './AudioPlayer'
import '../audio/AudioFilesList.css'

const AudioFileRow = ({ audioFile, onPlayAudio, isScrollableSection }) => {
  // ファイルサイズをMBに変換
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
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

  // スクロール可能セクション用のレンダリング
  if (isScrollableSection) {
    return (
      <tr className="hover:bg-gray-50 audio-files-table-row">
        {/* ファイルパス - 省略なし */}
        <td className="audio-files-table-cell px-4 text-sm">
          <div className="font-mono text-xs text-gray-900" style={{ minWidth: '300px' }}>
            {audioFile.file_path || 'Unknown'}
          </div>
        </td>

        {/* ファイルサイズ */}
        <td className="audio-files-table-cell px-4 text-sm text-gray-900">
          {formatFileSize(audioFile.file_size_bytes)}
        </td>

        {/* 処理ステータス - 個別表示 */}
        <td className="audio-files-table-cell px-4 text-sm">
          <span className={`font-medium ${getStatusColor(audioFile.transcriptions_status)}`}>
            {audioFile.transcriptions_status || 'unknown'}
          </span>
        </td>
        <td className="audio-files-table-cell px-4 text-sm">
          <span className={`font-medium ${getStatusColor(audioFile.behavior_features_status)}`}>
            {audioFile.behavior_features_status || 'unknown'}
          </span>
        </td>
        <td className="audio-files-table-cell px-4 text-sm">
          <span className={`font-medium ${getStatusColor(audioFile.emotion_features_status)}`}>
            {audioFile.emotion_features_status || 'unknown'}
          </span>
        </td>

        {/* Transcription - スクロール可能なボックス */}
        <td className="audio-files-table-cell px-4 text-sm">
          <div style={{ minWidth: '200px', maxWidth: '300px' }}>
            {audioFile.transcription ? (
              <div 
                className="font-mono text-xs text-gray-900 bg-gray-50 p-2 rounded border border-gray-200 result-box"
              >
                {audioFile.transcription}
              </div>
            ) : (
              <span className="text-gray-400 italic text-xs">EMPTY</span>
            )}
          </div>
        </td>

        {/* Events - スクロール可能なボックス */}
        <td className="audio-files-table-cell px-4 text-sm">
          <div style={{ minWidth: '200px', maxWidth: '300px' }}>
            {audioFile.events ? (
              <div 
                className="font-mono text-xs text-gray-900 bg-gray-50 p-2 rounded border border-gray-200 result-box"
              >
                {JSON.stringify(audioFile.events, null, 2)}
              </div>
            ) : (
              <span className="text-gray-400 italic text-xs">EMPTY</span>
            )}
          </div>
        </td>

        {/* Features Timeline - スクロール可能なボックス */}
        <td className="audio-files-table-cell px-4 text-sm">
          <div style={{ minWidth: '200px', maxWidth: '300px' }}>
            {audioFile.featuresTimeline ? (
              <div 
                className="font-mono text-xs text-gray-900 bg-gray-50 p-2 rounded border border-gray-200 result-box"
              >
                {JSON.stringify(audioFile.featuresTimeline, null, 2)}
              </div>
            ) : (
              <span className="text-gray-400 italic text-xs">EMPTY</span>
            )}
          </div>
        </td>

        {/* アクション */}
        <td className="audio-files-table-cell px-4" style={{ width: '200px' }}>
          <AudioPlayer 
            filePath={audioFile.file_path}
            enhancedFilePath={audioFile.enhanced_file_path}
            onPlay={onPlayAudio}
          />
        </td>
      </tr>
    )
  }

  // 通常のフル行レンダリング（後方互換性のため残す）
  return (
    <tr className="hover:bg-gray-50">
      {/* デバイスID */}
      <td className="px-4 py-3 text-sm">
        <div className="font-mono text-xs text-gray-900 break-all">
          {audioFile.device_id || 'Unknown'}
        </div>
      </td>

      {/* ローカル日付 */}
      <td className="px-4 py-3 text-sm text-gray-900">
        {audioFile.local_date || 'Unknown'}
      </td>

      {/* タイムブロック */}
      <td className="px-4 py-3 text-sm text-gray-900">
        {audioFile.time_block || 'Unknown'}
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

      {/* 処理ステータス */}
      <td className="px-4 py-3">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-600 w-20">transcriptions:</span>
            <span className={`text-xs font-medium ${getStatusColor(audioFile.transcriptions_status)}`}>
              {audioFile.transcriptions_status || 'unknown'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-600 w-20">behavior:</span>
            <span className={`text-xs font-medium ${getStatusColor(audioFile.behavior_features_status)}`}>
              {audioFile.behavior_features_status || 'unknown'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-600 w-20">emotion:</span>
            <span className={`text-xs font-medium ${getStatusColor(audioFile.emotion_features_status)}`}>
              {audioFile.emotion_features_status || 'unknown'}
            </span>
          </div>
        </div>
      </td>

      {/* Result */}
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
      <td className="px-4 py-3" style={{ width: '200px' }}>
        <AudioPlayer 
          filePath={audioFile.file_path}
          enhancedFilePath={audioFile.enhanced_file_path}
          onPlay={onPlayAudio}
        />
      </td>
    </tr>
  )
}

export default AudioFileRow