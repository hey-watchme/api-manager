import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
// import WhisperTranscriberModule from './modules/psychology/whisper-transcriber/WhisperTranscriberModule' // 2025/09/02 削除済み
import AzureTranscriberModule from './modules/psychology/azure-transcriber/AzureTranscriberModule'
import AggregatorModule from './modules/psychology/aggregator/AggregatorModule'
import ScorerModule from './modules/psychology/scorer/ScorerModule'
import BehaviorFeaturesModule from './modules/behavior/behavior-features/BehaviorFeaturesModule'
import BehaviorAggregatorModule from './modules/behavior/aggregator/BehaviorAggregatorModule'
import EmotionPage from './pages/EmotionPage'
import AudioFilesPage from './pages/AudioFilesPage'
import DashboardPage from './pages/DashboardPage'

// ページコンポーネント
function PsychologyPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">🧠 心理グラフ</h2>
        <p className="text-gray-600">音声データから心理状態を分析・可視化</p>
      </div>
      
      {/* Whisper Transcriber モジュール - 2025/09/02 削除済み */}
      <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 text-gray-600">
        <p className="font-semibold">⚠️ Whisper Transcriber は停止中です</p>
        <p className="text-sm mt-1">Azure Speech Service (下記) をご利用ください</p>
      </div>
      {/* <WhisperTranscriberModule /> */}
      
      {/* Azure Transcriber モジュール */}
      <div className="mt-8">
        <AzureTranscriberModule />
      </div>
      
      {/* Aggregator モジュール */}
      <div className="mt-8">
        <AggregatorModule />
      </div>
      
      {/* Scorer モジュール */}
      <div className="mt-8">
        <ScorerModule />
      </div>
    </div>
  )
}

function BehaviorPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">🏃 行動グラフ</h2>
        <p className="text-gray-600">行動パターンの検出と分析</p>
      </div>
      
      {/* Behavior Features モジュール */}
      <BehaviorFeaturesModule />
      
      {/* Behavior Aggregator モジュール */}
      <div className="mt-8">
        <BehaviorAggregatorModule />
      </div>
    </div>
  )
}

// ナビゲーション用コンポーネント
function Navigation() {
  const location = useLocation()
  
  const navItems = [
    { path: '/audio', label: '🎵 オーディオファイル', disabled: false },
    { path: '/prompt-generation', label: '📝 プロンプト生成', disabled: false },
    { path: '/vibe', label: '🧠 心理グラフ', disabled: false },
    { path: '/behavior', label: '🏃 行動グラフ', disabled: false },
    { path: '/emotion', label: '😊 感情グラフ', disabled: false }
  ]

  return (
    <div className="border-b border-gray-200 mb-8">
      <nav className="-mb-px flex space-x-8">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.disabled ? '#' : item.path}
            className={`
              whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm
              ${location.pathname === item.path
                ? 'border-blue-500 text-blue-600'
                : item.disabled
                ? 'border-transparent text-gray-400 cursor-not-allowed'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
            onClick={(e) => item.disabled && e.preventDefault()}
          >
            {item.label}{item.disabled && '（準備中）'}
          </Link>
        ))}
      </nav>
    </div>
  )
}

// メインアプリコンポーネント
function AppContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="px-6">
          <div className="flex justify-between items-center py-4">
            <Link to="/vibe" className="text-2xl font-bold text-gray-900 hover:text-gray-700">
              WatchMe API Manager
            </Link>
            <span className="text-sm text-gray-500">v1.0.0</span>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="px-6 py-6">
        <Navigation />
        
        <Routes>
          <Route path="/" element={<Navigate to="/audio" replace />} />
          <Route path="/prompt-generation" element={<DashboardPage />} />
          <Route path="/vibe" element={<PsychologyPage />} />
          <Route path="/behavior" element={<BehaviorPage />} />
          <Route path="/emotion" element={<EmotionPage />} />
          <Route path="/audio" element={<AudioFilesPage />} />
          {/* Backward compatibility */}
          <Route path="/dashboard" element={<Navigate to="/prompt-generation" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  const basename = import.meta.env.PROD ? '/manager' : '/'
  
  return (
    <Router basename={basename}>
      <AppContent />
    </Router>
  )
}

export default App