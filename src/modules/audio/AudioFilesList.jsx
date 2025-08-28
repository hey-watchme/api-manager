import React, { useState, useEffect } from 'react'
import AudioFilesService from '../../services/AudioFilesService'
import AudioFileRow from './AudioFileRow'
import Loading from '../../components/common/Loading'
import './AudioFilesList.css'

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

  // フィルター変更時に一覧を再取得
  useEffect(() => {
    fetchAudioFiles(1, false)
  }, [filters])

  // もっと読み込むハンドラー
  const handleLoadMore = () => {
    fetchAudioFiles(currentPage + 1, true)
  }

  // エラー時の再試行
  const handleRetry = () => {
    fetchAudioFiles(1, false)
  }

  if (loading && audioFiles.length === 0) {
    return <Loading text="音声ファイルを読み込み中..." />
  }

  if (error && audioFiles.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <div className="text-red-500 mb-4">
          <span className="text-3xl">❌</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">エラーが発生しました</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={handleRetry}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          再試行
        </button>
      </div>
    )
  }

  if (!loading && audioFiles.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <div className="text-gray-400 mb-4">
          <span className="text-3xl">📭</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">音声ファイルがありません</h3>
        <p className="text-gray-600">指定された条件に一致する音声ファイルが見つかりませんでした</p>
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

      {/* テーブル - Supabase風レイアウト */}
      {audioFiles.length > 0 ? (
        <div className="flex">
          {/* 固定カラム部分 */}
          <div className="flex-shrink-0 border-r border-gray-200">
            <table className="audio-files-table fixed-column-table w-auto">
              <thead>
                <tr className="audio-files-header">
                  <th className="sticky top-0 bg-gray-50 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap border-b border-gray-200">
                    device_id
                  </th>
                  <th className="sticky top-0 bg-gray-50 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap border-b border-gray-200">
                    local_date
                  </th>
                  <th className="sticky top-0 bg-gray-50 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap border-b border-gray-200">
                    time_block
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {audioFiles.map((audioFile, index) => (
                  <tr key={audioFile.id || index} className="audio-files-table-row">
                    <td className="audio-files-table-cell text-sm">
                      <div className="font-mono text-xs text-gray-900 break-all" style={{ maxWidth: '150px' }}>
                        {audioFile.device_id || 'Unknown'}
                      </div>
                    </td>
                    <td className="audio-files-table-cell text-sm text-gray-900">
                      {audioFile.local_date || 'Unknown'}
                    </td>
                    <td className="audio-files-table-cell text-sm text-gray-900">
                      {audioFile.time_block || 'Unknown'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* スクロール可能な部分 */}
          <div className="flex-1 overflow-x-auto">
            <table className="audio-files-table scrollable-column-table w-full">
              <thead>
                <tr className="audio-files-header">
                  <th className="sticky top-0 bg-gray-50 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap border-b border-gray-200">
                    file_path
                  </th>
                  <th className="sticky top-0 bg-gray-50 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap border-b border-gray-200">
                    file_size_bytes
                  </th>
                  <th className="sticky top-0 bg-gray-50 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap border-b border-gray-200">
                    transcriptions_status
                  </th>
                  <th className="sticky top-0 bg-gray-50 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap border-b border-gray-200">
                    behavior_features_status
                  </th>
                  <th className="sticky top-0 bg-gray-50 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap border-b border-gray-200">
                    emotion_features_status
                  </th>
                  <th className="sticky top-0 bg-gray-50 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap border-b border-gray-200">
                    transcription
                  </th>
                  <th className="sticky top-0 bg-gray-50 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap border-b border-gray-200">
                    events
                  </th>
                  <th className="sticky top-0 bg-gray-50 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap border-b border-gray-200">
                    features_timeline
                  </th>
                  <th className="sticky top-0 bg-gray-50 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap border-b border-gray-200" style={{ width: '200px' }}>
                    actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {audioFiles.map((audioFile, index) => (
                  <AudioFileRow 
                    key={audioFile.id || index}
                    audioFile={audioFile}
                    onPlayAudio={onPlayAudio}
                    isScrollableSection={true}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* もっと読み込むボタン */}
      {hasMore && (
        <div className="px-6 py-4 border-t border-gray-200 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? '読み込み中...' : 'もっと読み込む'}
          </button>
          <div className="mt-2 text-sm text-gray-500">
            {totalCount > 0 ? `残り約 ${totalCount - audioFiles.length} 件` : ''}
          </div>
        </div>
      )}
    </div>
  )
}

export default AudioFilesList