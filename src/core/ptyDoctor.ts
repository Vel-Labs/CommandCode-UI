export type PtyDoctorResult = {
  healthy: boolean
  shell: string
  output: string
  error: string
  exitCode: number | null
  signal: number | string | null
  available: boolean
}

export function ptyDoctor(): PtyDoctorResult {
  const result: PtyDoctorResult = {
    healthy: false,
    shell: '',
    output: '',
    error: '',
    exitCode: null,
    signal: null,
    available: false
  }

  try {
    require.resolve('node-pty')
  } catch {
    result.error = 'node-pty not installed. Run: npm rebuild node-pty'
    return result
  }

  try {
    const { spawn } = require('node-pty') as typeof import('node-pty')
    result.available = true

    let shell: string
    let args: string[]
    if (process.platform === 'win32') {
      shell = process.env.COMSPEC || 'cmd.exe'
      args = ['/c', 'echo ok']
    } else {
      shell = process.env.SHELL || '/bin/zsh'
      args = ['-lc', 'echo ok']
    }
    result.shell = shell

    try {
      const pty = spawn(shell, args, {
        name: 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd: process.cwd(),
        env: process.env as Record<string, string>
      })

      let output = ''

      pty.onData((data: string) => {
        output += data
      })

      pty.onExit(({ exitCode, signal }) => {
        result.exitCode = exitCode
        result.signal = signal !== undefined ? signal : null
        result.output = output.trim()
        result.healthy = exitCode === 0
      })

      return result
    } catch (err) {
      result.error = err instanceof Error ? err.message : 'Failed to spawn PTY'
      return result
    }
  } catch (err) {
    result.error = err instanceof Error ? err.message : 'Failed to load node-pty'
    return result
  }
}

export async function ptyDoctorAsync(): Promise<PtyDoctorResult> {
  return new Promise((resolve) => {
    try {
      require.resolve('node-pty')
    } catch {
      resolve({ healthy: false, shell: '', output: '', error: 'node-pty not installed. Run: npm rebuild node-pty', exitCode: null, signal: null, available: false })
      return
    }

    try {
      const { spawn } = require('node-pty') as typeof import('node-pty')

      let shell: string
      let args: string[]
      if (process.platform === 'win32') {
        shell = process.env.COMSPEC || 'cmd.exe'
        args = ['/c', 'echo ok']
      } else {
        shell = process.env.SHELL || '/bin/zsh'
        args = ['-lc', 'echo ok']
      }

      try {
        const pty = spawn(shell, args, {
          name: 'xterm-256color',
          cols: 80,
          rows: 24,
          cwd: process.cwd(),
          env: process.env as Record<string, string>
        })

        let output = ''
        const timeout = setTimeout(() => {
          try { pty.kill() } catch { /* ignore */ }
          resolve({ healthy: false, shell, output: output.trim(), error: 'PTY spawn timed out after 10s', exitCode: null, signal: 15 /* SIGTERM */, available: true })
        }, 10_000)

        pty.onData((data: string) => {
          output += data
        })

        pty.onExit(({ exitCode, signal }) => {
          clearTimeout(timeout)
          resolve({ healthy: exitCode === 0, shell, output: output.trim(), error: '', exitCode, signal: signal ?? null, available: true })
        })
      } catch (err) {
        resolve({ healthy: false, shell, output: '', error: err instanceof Error ? err.message : 'Failed to spawn PTY', exitCode: null, signal: null, available: true })
      }
    } catch (err) {
      resolve({ healthy: false, shell: '', output: '', error: err instanceof Error ? err.message : 'Failed to load node-pty', exitCode: null, signal: null, available: false })
    }
  })
}
