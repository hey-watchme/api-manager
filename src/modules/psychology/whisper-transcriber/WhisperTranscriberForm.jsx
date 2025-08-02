import { useState } from 'react';
import ApiForm from '../../../components/api/ApiForm';
import AudioFilesService from '../../../services/AudioFilesService';

export default function WhisperTranscriberForm({ onSubmit, loading, disabled }) {
  const [model, setModel] = useState('base');

  const handleSubmit = (pathsArray) => {
    // 親コンポーネントの onSubmit に、ファイルパスとモデルの両方を渡す
    onSubmit(pathsArray, model);
  };

  const infoMessage = {
    title: '⚠️ 重要：',
    text: 'OpenAI Whisper処理は約2-3秒/分程度かかります。タイムアウトエラーが表示されても、実際の処理は成功している場合がほとんどです。処理状況はデータベースで確認してください。',
  };

  return (
    <ApiForm
      onSubmit={handleSubmit}
      loading={loading}
      disabled={disabled}
      fetchFunction={() => AudioFilesService.getPendingAudioFiles()}
      submitButtonText="🎤 Whisper Transcriber処理開始"
      infoMessage={infoMessage}
    >
      {/* ApiForm の children としてモデル選択のUIを渡す */}
      <div>
        <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
          モデル
        </label>
        <select
          id="model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={disabled || loading}
        >
          <option value="base">base（標準）</option>
          <option value="small" disabled>small（軽量）- 本番環境では使用不可</option>
          <option value="medium" disabled>medium（中程度）- 本番環境では使用不可</option>
          <option value="large" disabled>large（高精度）- 本番環境では使用不可</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          本番環境（t4g.small, 2GB RAM）ではbaseモデルのみ使用可能です。
        </p>
      </div>
    </ApiForm>
  );
}