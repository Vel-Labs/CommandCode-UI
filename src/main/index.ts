import { app, BrowserWindow, dialog, ipcMain, shell, session } from 'electron'
import path from 'node:path'
import { existsSync, realpathSync, statSync } from 'node:fs'
import os from 'node:os'
import { createAppServer } from '../server/index'
import { isPathUnderRoot, resolveBoundaryPath } from '../shared/pathContainment'

let serverToken = ''
let serverPort = 0
let mainWindow: BrowserWindow | null = null
const knownProjectPaths = new Set<string>()

function realExistingPath(targetPath: string): string {
  const resolved = path.resolve(targetPath)
  try {
    return realpathSync(resolved)
  } catch {
    return resolved
  }
}

function isAllowedTranscriptPath(targetPath: string): boolean {
  const home = os.homedir()
  const allowedRoots = [
    path.join(home, '.commandcode', 'projects'),
    path.join(home, '.commandcode', 'sessions'),
    path.join(home, '.commandcode', 'transcripts'),
    path.join(home, '.commandcode-gui-starter', 'transcripts')
  ]
  return allowedRoots.some((root) => isPathUnderRoot(targetPath, root))
}

function isProjectDirectory(targetPath: string): boolean {
  if (!existsSync(targetPath) || !statSync(targetPath).isDirectory()) return false
  if ([...knownProjectPaths].some((root) => isPathUnderRoot(targetPath, root))) return true
  return ['.git', '.commandcode', 'package.json', 'AGENTS.md', 'COMMANDCODE.md'].some((marker) => existsSync(path.join(targetPath, marker)))
}

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 1060,
    minHeight: 720,
    backgroundColor: '#101010',
    title: 'Command Code',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: process.platform === 'darwin' ? { x: 18, y: 18 } : undefined,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow = win
  return win
}

app.whenReady().then(async () => {
  app.setAppUserModelId('ai.commandcode.gui')
  app.setName('Command Code')
  const window = createWindow()

  // Start the local server, serving static files from the renderer build output
  const staticDir = path.join(__dirname, '../../out/renderer')
  const server = createAppServer(0, '127.0.0.1', { staticDir })
  await server.start()

  serverToken = server.token
  const addr = server.httpServer.address()
  serverPort = typeof addr === 'object' && addr ? addr.port : 0

  // Set the auth cookie on the server origin
  await session.defaultSession.cookies.set({
    url: `http://127.0.0.1:${serverPort}`,
    name: 'ccgui-token',
    value: serverToken,
    path: '/',
    httpOnly: true,
    sameSite: 'strict'
  })

  // Inject token and server port before any JS executes so renderer has them at boot
  window.webContents.executeJavaScript(`
    window.__CCGUI__ = { token: '${serverToken}', port: ${serverPort} }
    // Also set fetch base URL via config injection
    window.__CCGUI_API_BASE__ = 'http://127.0.0.1:${serverPort}'
  `)

  window.loadURL(`http://127.0.0.1:${serverPort}`)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  app.on('before-quit', async () => {
    await server.stop()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// IPC kept only for window management and native dialogs — no session transport

ipcMain.handle('cc:choose-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory'],
    title: 'Choose a project for Command Code'
  })

  if (!result.canceled && result.filePaths[0]) {
    knownProjectPaths.add(realExistingPath(result.filePaths[0]))
  }

  return {
    canceled: result.canceled,
    path: result.filePaths[0]
  }
})

ipcMain.handle('cc:open-external', async (_event, url: string) => {
  const allowed = new URL(url)
  if (!['https:', 'http:'].includes(allowed.protocol)) {
    throw new Error('Only http(s) links are allowed')
  }
  await shell.openExternal(allowed.toString())
})

ipcMain.handle('cc:reveal-transcript', async (_event, transcriptPath: string) => {
  const resolved = resolveBoundaryPath(transcriptPath)
  if (!isAllowedTranscriptPath(resolved) || !existsSync(resolved) || statSync(resolved).isDirectory()) {
    throw new Error('Transcript reveal denied')
  }
  shell.showItemInFolder(resolved)
})

ipcMain.handle('cc:reveal-path', async (_event, targetPath: string) => {
  const resolved = resolveBoundaryPath(targetPath)
  if (!isProjectDirectory(resolved)) {
    throw new Error('Project reveal denied')
  }
  shell.showItemInFolder(resolved)
})

ipcMain.handle('cc:get-server-info', () => {
  return { port: serverPort, token: serverToken }
})
