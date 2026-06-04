import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import path from 'node:path'
import { checkCommandCode, commandCodeStatus, listModels, runHeadless } from './cli'
import { SessionManager } from './sessions'
import type { HeadlessRunOptions, SessionStartOptions } from '../shared/types'

const sessionManager = new SessionManager()

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 1060,
    minHeight: 720,
    backgroundColor: '#050505',
    title: 'Command Code GUI Starter',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  return win
}

app.whenReady().then(() => {
  app.setAppUserModelId('ai.commandcode.gui.starter')
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('before-quit', () => {
  sessionManager.killAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('cc:choose-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory'],
    title: 'Choose a project for Command Code'
  })

  return {
    canceled: result.canceled,
    path: result.filePaths[0]
  }
})

ipcMain.handle('cc:check', async (_event, commandExecutable?: string) => {
  return checkCommandCode(commandExecutable)
})

ipcMain.handle('cc:status', async (_event, commandExecutable?: string, cwd?: string) => {
  return commandCodeStatus(commandExecutable, cwd)
})

ipcMain.handle('cc:list-models', async (_event, commandExecutable?: string, cwd?: string) => {
  return listModels(commandExecutable, cwd)
})

ipcMain.handle('cc:start-session', (event, options: SessionStartOptions) => {
  return sessionManager.start(event.sender, options)
})

ipcMain.handle('cc:write', (_event, sessionId: string, data: string) => {
  sessionManager.write(sessionId, data)
})

ipcMain.handle('cc:resize', (_event, sessionId: string, cols: number, rows: number) => {
  sessionManager.resize(sessionId, cols, rows)
})

ipcMain.handle('cc:stop', (_event, sessionId: string) => {
  sessionManager.stop(sessionId)
})

ipcMain.handle('cc:force-kill', (_event, sessionId: string) => {
  sessionManager.forceKill(sessionId)
})

ipcMain.handle('cc:kill', (_event, sessionId: string) => {
  sessionManager.stop(sessionId)
})

ipcMain.handle('cc:run-headless', async (_event, options: HeadlessRunOptions) => {
  return runHeadless(options)
})

ipcMain.handle('cc:open-external', async (_event, url: string) => {
  const allowed = new URL(url)
  if (!['https:', 'http:'].includes(allowed.protocol)) {
    throw new Error('Only http(s) links are allowed')
  }
  await shell.openExternal(allowed.toString())
})

ipcMain.handle('cc:reveal-transcript', async (_event, transcriptPath: string) => {
  shell.showItemInFolder(transcriptPath)
})
