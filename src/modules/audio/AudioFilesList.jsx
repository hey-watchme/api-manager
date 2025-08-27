import React, { useState, useEffect } from 'react'
import AudioFilesService from '../../services/AudioFilesService'
import AudioFileRow from './AudioFileRow'
import Loading from '../../components/common/Loading'

const AudioFilesList = ({ filters, onPlayAudio }) => {
  const [audioFiles, setAudioFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  
  const PAGE_SIZE = 50

  // ファイル一覧を取得
  const fetchAudioFiles = async (page = 1, isLoadMore = false) => {
    try {
      setLoading(true)
      setError(null)

      const params = {
        ...filters,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE
      }

      const response = await AudioFilesService.getAudioFilesList(params)
      
      if (response && response.files && Array.isArray(response.files)) {
        if (isLoadMore) {
          setAudioFiles(prev => [...prev, ...response.files])
        } else {
          setAudioFiles(response.files)
        }
        
        setTotalCount(response.total_count || response.files.length)
        setHasMore(response.files.length === PAGE_SIZE)
        setCurrentPage(page)
      } else {
        // レスポンスが無効な場合は空配列を設定
        setAudioFiles([])
        setTotalCount(0)
        setHasMore(false)
      }
    } catch (error) {
      console.error('音声ファイル一覧の取得に失敗:', error)
      setError('音声ファイル一覧の取得に失敗しました')
      setAudioFiles([])
    } finally {
      setLoading(false)
    }
  }

  // フィルター変更時にデータを再取得
  useEffect(() => {
    fetchAudioFiles(1, false)
  }, [filters])

  // もっと読み込む
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchAudioFiles(currentPage + 1, true)
    }
  }

  // エラー時の再試行
  const handleRetry = () => {
    fetchAudioFiles(1, false)
  }

  if (loading && audioFiles.length === 0) {
    return <Loading message="音声ファイルを読み込み中..." />
  }

  if (error && audioFiles.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">❌ エラーが発生しました</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            🔄 再試行
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* ヘッダー */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            🎵 音声ファイル一覧
          </h3>
          <div className="text-sm text-gray-500">
            {totalCount > 0 ? `${totalCount}件中 ${audioFiles.length}件表示` : '0件'}
          </div>
        </div>
      </div>

      {/* テーブル */}
      {audioFiles.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  device_id
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  file_path
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  file_size_bytes
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  local_date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  time_block
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  result
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {audioFiles.map((audioFile, index) => (
                <AudioFileRow
                  key={`${audioFile.file_path}-${index}`}
                  audioFile={audioFile}
                  onPlayAudio={onPlayAudio}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center text-gray-500">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-lg">音声ファイルが見つかりませんでした</p>
          <p className="text-sm">フィルター条件を変更してお試しください</p>
        </div>
      )}

      {/* もっと読み込むボタン */}
      {audioFiles.length > 0 && hasMore && (
        <div className="px-6 py-4 border-t border-gray-200 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                読み込み中...
              </>
            ) : (
              <>
                📖 もっと読み込む
              </>
            )}
          </button>
        </div>
      )}

      {/* 読み込み中の表示（追加読み込み時） */}
      {loading && audioFiles.length > 0 && (
        <div className="px-6 py-4 text-center text-gray-500">
          <span className="animate-spin mr-2">⏳</span>
          追加データを読み込み中...
        </div>
      )}
    </div>
  )
}

export default AudioFilesList