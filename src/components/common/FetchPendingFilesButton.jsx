import { useState } from 'react'
import Button from './Button'

export default function FetchPendingFilesButton({ 
  onFetch, 
  fetchFunction,
  disabled = false,
  loading = false,
  buttonText = '未処理ファイルを取得',
  loadingText = '取得中...'
}) {
  const [fetchingPending, setFetchingPending] = useState(false)
  const [fetchError, setFetchError] = useState(null)

  const handleFetchPendingFiles = async () => {
    setFetchingPending(true)
    setFetchError(null)
    
    try {
      const pendingFiles = await fetchFunction()
      
      if (pendingFiles.length === 0) {
        setFetchError('未処理のファイルが見つかりませんでした')
        return
      }
      
      // 取得したファイルパスを改行で結合して親コンポーネントに渡す
      const paths = pendingFiles.map(file => file.file_path).join('\n')
      onFetch(paths)
      
      console.log(`${pendingFiles.length}件の未処理ファイルを取得しました`)
    } catch (error) {
      setFetchError(error.message || '未処理ファイルの取得に失敗しました')
      console.error('未処理ファイル取得エラー:', error)
    } finally {
      setFetchingPending(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        onClick={handleFetchPendingFiles}
        loading={fetchingPending}
        disabled={disabled || loading || fetchingPending}
        className="text-sm py-1 px-3"
      >
        {fetchingPending ? loadingText : buttonText}
      </Button>
      
      {fetchError && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
          <p className="text-xs text-red-800">{fetchError}</p>
        </div>
      )}
    </>
  )
}