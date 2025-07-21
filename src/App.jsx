import { useState } from 'react'
import TranscriberModule from './modules/psychology/transcriber/TranscriberModule'

function App() {
  const [activeTab, setActiveTab] = useState('psychology')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">WatchMe API Manager</h1>
            <span className="text-sm text-gray-500">v1.0.0</span>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* タブナビゲーション */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('psychology')}
              className={`
                whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'psychology' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              🧠 心理グラフ
            </button>
            <button
              onClick={() => setActiveTab('behavior')}
              className={`
                whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'behavior' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
              disabled
            >
              🏃 行動グラフ（準備中）
            </button>
            <button
              onClick={() => setActiveTab('emotion')}
              className={`
                whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'emotion' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
              disabled
            >
              😊 感情グラフ（準備中）
            </button>
          </nav>
        </div>

        {/* タブコンテンツ */}
        <div>
          {activeTab === 'psychology' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">🧠 心理グラフ</h2>
                <p className="text-gray-600">音声データから心理状態を分析・可視化</p>
              </div>
              
              {/* Transcriber モジュール */}
              <TranscriberModule />
              
              {/* 他のモジュールは後で追加 */}
              <div className="mt-8 grid gap-6">
                <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <p className="text-gray-500">📝 Aggregator（プロンプト生成）- 準備中</p>
                </div>
                <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <p className="text-gray-500">🤖 Scorer（スコアリング）- 準備中</p>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'behavior' && (
            <div className="text-center py-12">
              <p className="text-gray-500">行動グラフモジュールは準備中です</p>
            </div>
          )}
          
          {activeTab === 'emotion' && (
            <div className="text-center py-12">
              <p className="text-gray-500">感情グラフモジュールは準備中です</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App