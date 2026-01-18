import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// 检查是否存在 HTTPS 证书
const certPath = path.resolve(__dirname, '../../certs/localhost+3.pem')
const keyPath = path.resolve(__dirname, '../../certs/localhost+3-key.pem')

const hasHttps = fs.existsSync(certPath) && fs.existsSync(keyPath)

export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5174,
    https: hasHttps ? {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    } : undefined,
  },
})
