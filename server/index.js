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

// Vibe Transcriber API プロキシ
app.use('/api/vibe-transcriber', createProxyMiddleware({
  target: `${API_BASE_URL}/vibe-transcriber`,
  changeOrigin: true,
  pathRewrite: {
    '^/api/vibe-transcriber': ''
  },
  timeout: 300000, // 5分のタイムアウト（注意：Whisper処理は70秒～10分と変動的）
  proxyTimeout: 300000, // プロキシタイムアウトも5分（タイムアウトしても実際の処理は継続中の場合が多い）
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Proxy] ${req.method} ${req.path} -> ${API_BASE_URL}/vibe-transcriber${req.path}`)
  },
  onError: (err, req, res) => {
    console.error('[Proxy Error]', err)
    res.status(500).json({ error: 'Proxy error', message: err.message })
  }
}))

// Vibe Aggregator API プロキシ
app.use('/api/vibe-aggregator', createProxyMiddleware({
  target: `${API_BASE_URL}/vibe-aggregator`,
  changeOrigin: true,
  pathRewrite: {
    '^/api/vibe-aggregator': ''
  },
  timeout: 300000,
  proxyTimeout: 300000
}))

// Vibe Scorer API プロキシ
app.use('/api/vibe-scorer', createProxyMiddleware({
  target: `${API_BASE_URL}/vibe-scorer`,
  changeOrigin: true,
  pathRewrite: {
    '^/api/vibe-scorer': ''
  },
  timeout: 300000,
  proxyTimeout: 300000
}))

// 行動グラフ API プロキシ
app.use('/api/behavior-features', createProxyMiddleware({
  target: `${API_BASE_URL}/behavior-features`,
  changeOrigin: true,
  pathRewrite: {
    '^/api/behavior-features': ''
  },
  timeout: 300000,
  proxyTimeout: 300000
}))

app.use('/api/behavior-aggregator', createProxyMiddleware({
  target: `${API_BASE_URL}/behavior-aggregator`,
  changeOrigin: true,
  pathRewrite: {
    '^/api/behavior-aggregator': ''
  },
  timeout: 300000,
  proxyTimeout: 300000
}))

// 感情グラフ API プロキシ
app.use('/api/emotion-features', createProxyMiddleware({
  target: `${API_BASE_URL}/emotion-features`,
  changeOrigin: true,
  pathRewrite: {
    '^/api/emotion-features': ''
  },
  timeout: 300000,
  proxyTimeout: 300000
}))

app.use('/api/emotion-aggregator', createProxyMiddleware({
  target: `${API_BASE_URL}/emotion-aggregator`,
  changeOrigin: true,
  pathRewrite: {
    '^/api/emotion-aggregator': ''
  },
  timeout: 300000,
  proxyTimeout: 300000
}))

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