import { createAppServer } from '../src/server/index'
import { spawn } from 'node:child_process'
import { resolve } from 'node:path'

async function main() {
  const port = 5173
  const app = createAppServer(port, '127.0.0.1', { staticDir: undefined })

  await app.start()
  console.log(`API server on http://127.0.0.1:${port}`)
  console.log(`Browser URL: ${app.authUrl}\n`)

  // Start Vite dev server in the same process group
  const vite = spawn('npx', ['vite', '--config', 'vite.web.config.ts', '--host', '0.0.0.0'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      CCGUI_PORT: String(port)
    }
  })

  vite.on('exit', (code) => {
    app.stop().then(() => process.exit(code ?? 0))
  })

  const cleanup = () => {
    vite.kill('SIGTERM')
    app.stop().then(() => process.exit(0))
  }

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
}

main()
