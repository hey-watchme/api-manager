import { useState } from 'react';
import Button from '../common/Button';
import FetchPendingFilesButton from '../common/FetchPendingFilesButton';

export default function ApiForm({
  onSubmit,
  loading,
  disabled,
  fetchFunction,
  submitButtonText,
  infoMessage,
  children,
}) {
  const [filePaths, setFilePaths] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const pathsArray = filePaths
      .split('\n')
      .map((path) => path.trim())
      .filter((path) => path.length > 0);

    if (pathsArray.length === 0) {
      alert('少なくとも1つのファイルパスを入力してください');
      return;
    }
    // フォームの送信処理は、引数としてファイルパスの配列のみを渡す
    onSubmit(pathsArray);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="filePaths" className="block text-sm font-medium text-gray-700">
            ファイルパス
          </label>
          {fetchFunction && (
            <FetchPendingFilesButton
              onFetch={setFilePaths}
              fetchFunction={fetchFunction}
              disabled={disabled}
              loading={loading}
            />
          )}
        </div>
        <textarea
          id="filePaths"
          value={filePaths}
          onChange={(e) => setFilePaths(e.target.value)}
          placeholder="例: files/d067d407-cf73-4174-a9c1-d91fb60d64d0/2025-07-21/00-30/audio.wav"
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={disabled || loading}
        />
        <p className="mt-1 text-xs text-gray-500">
          複数のファイルパスを改行で区切って入力できます。不要なパスは削除できます。
        </p>
        {infoMessage && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-xs text-yellow-800">
              <span className="font-medium">{infoMessage.title}</span>
              {infoMessage.text}
            </p>
          </div>
        )}
      </div>

      {/* API固有の入力項目をここに挿入 */}
      {children}

      <div className="flex justify-end">
        <Button type="submit" loading={loading} disabled={disabled}>
          {submitButtonText}
        </Button>
      </div>
    </form>
  );
}