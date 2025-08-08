import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/manager/' : '/',
  server: {
    host: '0.0.0.0',
    port: 9001,
    proxy: {
      '/api/scheduler': {
        target: 'http://localhost:8015',
        changeOrigin: true
      }
    }
  }
})