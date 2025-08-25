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
      {/* ページヘッダー */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center space-x-3">
          <div className="text-3xl">🎵</div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">オーディオファイル管理</h2>
            <p className="text-gray-600 mt-1">
              録音された音声ファイルの一覧表示・再生・ダウンロードが可能です
            </p>
          </div>
        </div>

        {/* 機能説明 */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="text-lg">🔍</span>
            <span>デバイス・日付・ステータスでフィルタリング</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="text-lg">🎵</span>
            <span>ブラウザで直接音声再生</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="text-lg">📥</span>
            <span>音声ファイルのダウンロード</span>
          </div>
        </div>
      </div>

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

      {/* 使用方法のヒント */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h4 className="font-medium text-gray-800 mb-2">💡 使用方法</h4>
        <ul className="space-y-1 text-sm text-gray-600">
          <li>• <strong>フィルター:</strong> デバイスIDや日付範囲を指定してファイルを絞り込めます</li>
          <li>• <strong>再生:</strong> 🎵ボタンで音声を直接再生できます（署名付きURLを自動取得）</li>
          <li>• <strong>ダウンロード:</strong> 📥ボタンでファイルをローカルに保存できます</li>
          <li>• <strong>処理ステータス:</strong> 転写・行動・感情の各処理状況を確認できます</li>
          <li>• <strong>ページング:</strong> 「もっと読み込む」で追加のファイルを表示できます</li>
        </ul>
      </div>

      {/* ステータス説明 */}
      <div className="bg-white p-4 rounded-lg border">
        <h4 className="font-medium text-gray-800 mb-2">📊 ステータス説明</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-green-600 font-medium">completed</span>
            <span>- 処理が正常に完了</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-yellow-600 font-medium">processing</span>
            <span>- 現在処理中</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-red-600 font-medium">failed</span>
            <span>- 処理でエラーが発生</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-500 font-medium">pending</span>
            <span>- 未処理</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-red-600 font-medium">error</span>
            <span>- システムエラー</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AudioFilesModule