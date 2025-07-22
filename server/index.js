import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import axios from 'axios'

// 環境変数の読み込み
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// ミドルウェア
app.use(cors())
app.use(express.json())

// APIプロキシ設定
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://api.hey-watch.me'

// APIサービス設定
const apiServices = [
  {
    path: '/api/vibe-transcriber',
    target: 'vibe-transcriber/fetch-and-transcribe',
    description: 'Vibe Transcriber API プロキシ',
    specialTimeout: 600000, // Whisper処理は70秒～10分と変動的（フロントエンドと合わせて10分）
    enableLogging: true // 詳細ログを有効化
  },
  {
    path: '/api/vibe-aggregator',
    target: 'vibe-aggregator/generate-mood-prompt-supabase',
    description: 'Vibe Aggregator API プロキシ'
  },
  {
    path: '/api/vibe-scorer',
    target: 'vibe-scorer/analyze-vibegraph-supabase',
    description: 'Vibe Scorer API プロキシ'
  },
  {
    path: '/api/behavior-features',
    target: 'behavior-features/fetch-and-process-paths',
    description: '行動特徴抽出 API プロキシ'
  },
  {
    path: '/api/behavior-aggregator',
    target: 'behavior-aggregator/analysis/sed',
    description: '行動分析 API プロキシ'
  },
  {
    path: '/api/emotion-features',
    target: 'emotion-features/process/emotion-features',
    description: '感情特徴抽出 API プロキシ'
  },
  {
    path: '/api/emotion-aggregator',
    target: 'emotion-aggregator/analyze/opensmile-aggregator',
    description: '感情分析 API プロキシ'
  }
]


// プロキシの動的設定
apiServices.forEach(service => {
  console.log(`Setting up ${service.description}: ${service.path} -> ${API_BASE_URL}/${service.target}`)
  
  // 管理画面の方式に従い、明示的なプロキシを実装
  // POSTリクエスト - /fetch-and-transcribe への転送
  app.post(`${service.path}/fetch-and-transcribe`, async (req, res) => {
    const timestamp = new Date().toISOString()
    const targetUrl = `${API_BASE_URL}/${service.target}`
    
    console.log(`[${timestamp}] [Proxy] ${req.method} ${req.path} -> ${targetUrl}`)
    
    if (service.enableLogging) {
      console.log(`[${timestamp}] [Proxy Detail] Body:`, JSON.stringify(req.body, null, 2))
    }
    
    try {
      const response = await axios.post(targetUrl, req.body, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': req.headers['user-agent'] || 'WatchMe-API-Manager/1.0'
        },
        timeout: service.specialTimeout || 600000,
        validateStatus: null // すべてのステータスコードを許可
      })
      
      console.log(`[${timestamp}] [Proxy Response] Status: ${response.status}`)
      
      if (service.enableLogging && response.data) {
        console.log(`[${timestamp}] [Proxy Response] Data:`, JSON.stringify(response.data, null, 2))
      }
      
      res.status(response.status).json(response.data)
    } catch (error) {
      console.error(`[${timestamp}] [Proxy Error] ${service.description}:`, error.message)
      
      if (error.response) {
        // APIからのエラーレスポンス
        res.status(error.response.status).json({
          error: 'API Error',
          message: error.response.data?.detail || error.message,
          service: service.target,
          timestamp
        })
      } else if (error.code === 'ECONNABORTED') {
        // タイムアウト
        res.status(504).json({
          error: 'Gateway Timeout',
          message: `APIリクエストがタイムアウトしました (${service.specialTimeout || 600000}ms)`,
          service: service.target,
          timestamp
        })
      } else {
        // その他のエラー
        res.status(500).json({
          error: 'Proxy Error',
          message: error.message,
          service: service.target,
          timestamp
        })
      }
    }
  })
  
  // GETリクエスト用（ステータス確認など）
  // ルートパスへのGETリクエスト（フロントエンドのcheckStatus用）
  app.get(`${service.path}/`, async (req, res) => {
    try {
      const baseApiUrl = `${API_BASE_URL}/${service.target.split('/')[0]}/`
      const response = await axios.get(baseApiUrl, {
        timeout: 10000,
        validateStatus: (status) => true // すべてのステータスコードを受け入れる
      })
      
      // Whisper APIは200, 404, 405のいずれかを返すことがある
      if ([200, 404, 405].includes(response.status)) {
        res.status(response.status).json(response.data)
      } else {
        res.status(response.status).json({ message: 'API responded', status: response.status })
      }
    } catch (error) {
      res.status(503).json({ status: 'offline', message: error.message })
    }
  })
})

// 本番環境では静的ファイルを提供
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')))
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'))
  })
}

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// サーバー起動
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
  console.log(`API Base URL: ${API_BASE_URL}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})