import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

const API_PORT = process.env.CCGUI_PORT || '5173'

export default defineConfig({
  root: resolve('src/renderer'),
  plugins: [react()],
  build: {
    outDir: resolve('out/renderer'),
    emptyOutDir: true
  },
  server: {
    port: 5174,
    proxy: {
      '/api/token': {
        target: `http://127.0.0.1:${API_PORT}`,
        changeOrigin: true
      },
      '/api': {
        target: `http://127.0.0.1:${API_PORT}`,
        changeOrigin: true
      },
      '/ws': {
        target: `ws://127.0.0.1:${API_PORT}`,
        ws: true
      },
      '/health': {
        target: `http://127.0.0.1:${API_PORT}`,
        changeOrigin: true
      }
    }
  }
})
