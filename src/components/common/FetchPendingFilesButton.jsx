import { useState } from 'react'
import Button from './Button'

export default function FetchPendingFilesButton({ 
  onFetch, 
  fetchFunction,
  onError = null,  // エラーコールバックを追加
  disabled = false,
  loading = false,
  buttonText = '未処理ファイルを取得',
  loadingText = '取得中...'
}) {
  const [fetchingPending, setFetchingPending] = useState(false)

  const handleFetchPendingFiles = async () => {
    setFetchingPending(true)
    
    try {
      const pendingFiles = await fetchFunction()
      
      if (pendingFiles.length === 0) {
        const errorMsg = '未処理のファイルが見つかりませんでした'
        if (onError) {
          onError(errorMsg)
        }
        return
      }
      
      // 取得したファイルパスを改行で結合して親コンポーネントに渡す
      const paths = pendingFiles.map(file => file.file_path).join('\n')
      onFetch(paths)
      
      // 成功時はエラーをクリア
      if (onError) {
        onError(null)
      }
      
      console.log(`${pendingFiles.length}件の未処理ファイルを取得しました`)
    } catch (error) {
      const errorMsg = error.message || '未処理ファイルの取得に失敗しました'
      if (onError) {
        onError(errorMsg)
      }
      console.error('未処理ファイル取得エラー:', error)
    } finally {
      setFetchingPending(false)
    }
  }

  return (
    <Button
      type="button"
      onClick={handleFetchPendingFiles}
      loading={fetchingPending}
      disabled={disabled || loading || fetchingPending}
      className="text-sm py-1 px-3"
    >
      {fetchingPending ? loadingText : buttonText}
    </Button>
  )
}