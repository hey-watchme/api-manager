import ApiForm from '../../../components/api/ApiForm';
import AudioFilesService from '../../../services/AudioFilesService';

export default function BehaviorFeaturesForm({ onSubmit, loading, disabled, onError }) {
  const infoMessage = {
    title: 'ℹ️ SED音響イベント検出について：',
    text: '音声データから行動パターン（歩く、話す、音楽など）を検出・分類します。処理時間は音声の長さや複雑さによって変動します。',
  };

  return (
    <ApiForm
      onSubmit={onSubmit}
      loading={loading}
      disabled={disabled}
      fetchFunction={() => AudioFilesService.getPendingBehaviorFiles()}
      submitButtonText="🎯 行動特徴抽出開始"
      infoMessage={infoMessage}
      onError={onError}
    />
  );
}