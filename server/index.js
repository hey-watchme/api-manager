import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createProxyMiddleware } from 'http-proxy-middleware'
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
    target: 'vibe-transcriber',
    description: 'Vibe Transcriber API プロキシ',
    specialTimeout: 300000, // Whisper処理は70秒～10分と変動的
    enableLogging: true // 詳細ログを有効化
  },
  {
    path: '/api/vibe-aggregator',
    target: 'vibe-aggregator',
    description: 'Vibe Aggregator API プロキシ'
  },
  {
    path: '/api/vibe-scorer',
    target: 'vibe-scorer',
    description: 'Vibe Scorer API プロキシ'
  },
  {
    path: '/api/behavior-features',
    target: 'behavior-features',
    description: '行動特徴抽出 API プロキシ'
  },
  {
    path: '/api/behavior-aggregator',
    target: 'behavior-aggregator',
    description: '行動分析 API プロキシ'
  },
  {
    path: '/api/emotion-features',
    target: 'emotion-features',
    description: '感情特徴抽出 API プロキシ'
  },
  {
    path: '/api/emotion-aggregator',
    target: 'emotion-aggregator',
    description: '感情分析 API プロキシ'
  }
]

// 共通プロキシ設定を生成する関数
function createApiProxy(service) {
  const config = {
    target: `${API_BASE_URL}/${service.target}`,
    changeOrigin: true,
    pathRewrite: {
      [`^${service.path}`]: ''
    },
    timeout: service.specialTimeout || 300000,
    proxyTimeout: service.specialTimeout || 300000,
    onProxyReq: (proxyReq, req, res) => {
      const timestamp = new Date().toISOString()
      const logMessage = `[${timestamp}] [Proxy] ${req.method} ${req.path} -> ${API_BASE_URL}/${service.target}${req.path}`
      console.log(logMessage)
      
      // 詳細ログが有効な場合は追加情報を出力
      if (service.enableLogging) {
        console.log(`[${timestamp}] [Proxy Detail] User-Agent: ${req.headers['user-agent'] || 'N/A'}`)
        console.log(`[${timestamp}] [Proxy Detail] Content-Type: ${req.headers['content-type'] || 'N/A'}`)
      }
    },
    onError: (err, req, res) => {
      const timestamp = new Date().toISOString()
      const errorInfo = {
        timestamp,
        service: service.target,
        method: req.method,
        path: req.path,
        error: err.message,
        code: err.code || 'UNKNOWN'
      }
      
      console.error(`[${timestamp}] [Proxy Error] ${service.description}:`, errorInfo)
      
      // クライアントには詳細なエラー情報を返す
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Proxy error',
          message: err.message,
          service: service.target,
          timestamp
        })
      }
    }
  }
  
  return config
}

// プロキシの動的設定
apiServices.forEach(service => {
  console.log(`Setting up ${service.description}: ${service.path} -> ${API_BASE_URL}/${service.target}`)
  app.use(service.path, createProxyMiddleware(createApiProxy(service)))
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