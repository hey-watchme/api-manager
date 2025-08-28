import React, { useState } from 'react'
import AudioFilters from './AudioFilters'
import AudioFilesList from './AudioFilesList'

const AudioFilesModule = () => {
  const [filters, setFilters] = useState({})
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null)

  // フィルター変更ハンドラー
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
  }

  // 音声再生ハンドラー
  const handlePlayAudio = (filePath) => {
    setCurrentlyPlaying(filePath)
  }

  return (
    <div className="space-y-6">

      {/* 現在再生中のファイル表示 */}
      {currentlyPlaying && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🎵</span>
            <span className="font-medium text-blue-800">再生中:</span>
            <span className="text-blue-700 truncate">{currentlyPlaying}</span>
          </div>
        </div>
      )}

      {/* フィルターコンポーネント */}
      <AudioFilters onFilterChange={handleFilterChange} />

      {/* ファイル一覧コンポーネント */}
      <AudioFilesList 
        filters={filters}
        onPlayAudio={handlePlayAudio}
      />

    </div>
  )
}

export default AudioFilesModule