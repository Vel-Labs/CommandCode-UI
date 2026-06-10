import os from 'node:os'
import { checkCommandCode, commandCodeStatus, getCommandExecutable, listModels } from './cli'
import { ptyDoctorAsync, type PtyDoctorResult } from './ptyDoctor'

export type DoctorCheckStatus = 'pass' | 'fail' | 'warn'

export type DoctorCheck = {
  id: 'node' | 'platform' | 'binary' | 'auth' | 'models' | 'pty' | 'windows'
  label: string
  status: DoctorCheckStatus
  detail: string
  nextStep?: string
}

export type DoctorResult = {
  ok: boolean
  nodeVersion: string
  platform: NodeJS.Platform
  platformRelease: string
  commandExecutable: string
  commandCodeVersion?: string
  modelCount?: number
  pty: PtyDoctorResult
  checks: DoctorCheck[]
  passed: string[]
  failed: string[]
}

export async function runDoctorChecks(options: { commandExecutable?: string; cwd?: string } = {}): Promise<DoctorResult> {
  const checks: DoctorCheck[] = []
  const nodeVersion = process.version
  const nodeMajor = parseInt(nodeVersion.slice(1).split('.')[0]!, 10)
  const platform = os.platform()
  const platformRelease = os.release()
  const commandExecutable = options.commandExecutable || getCommandExecutable()
  const cwd = options.cwd || process.cwd()

  checks.push(nodeMajor >= 20
    ? { id: 'node', label: 'Node.js', status: 'pass', detail: nodeVersion }
    : { id: 'node', label: 'Node.js', status: 'fail', detail: nodeVersion, nextStep: 'Install Node.js 20 or newer.' })

  checks.push({
    id: 'platform',
    label: 'Platform',
    status: platform === 'win32' ? 'warn' : 'pass',
    detail: `${platform} (${platformRelease})`,
    nextStep: platform === 'win32' ? 'Use WSL for the best supported Windows path in this sprint.' : undefined
  })

  const binary = await checkCommandCode(commandExecutable)
  if (binary.ok) {
    checks.push({ id: 'binary', label: 'Command Code binary', status: 'pass', detail: `v${binary.version ?? 'unknown'}` })
  } else {
    checks.push({
      id: 'binary',
      label: 'Command Code binary',
      status: 'fail',
      detail: binary.stderr || binary.error || 'not found',
      nextStep: installCommandForPlatform(platform)
    })
  }

  let modelCount: number | undefined
  if (binary.ok) {
    const status = await commandCodeStatus(commandExecutable, cwd)
    checks.push(status.ok
      ? { id: 'auth', label: 'Authentication', status: 'pass', detail: 'ok' }
      : { id: 'auth', label: 'Authentication', status: 'fail', detail: status.stderr || status.error || 'not authenticated', nextStep: 'Run Command Code login/auth setup in the same environment as ccgui.' })

    const models = await listModels(commandExecutable, cwd).catch(() => undefined)
    modelCount = models?.models.length
    checks.push(models?.ok && models.models.length > 0
      ? { id: 'models', label: 'Model listing', status: 'pass', detail: `${models.models.length} available` }
      : { id: 'models', label: 'Model listing', status: 'fail', detail: 'listing failed', nextStep: 'Check Command Code authentication and model access.' })
  }

  if (platform === 'win32') {
    checks.push({
      id: 'windows',
      label: 'Windows guidance',
      status: 'warn',
      detail: 'Native Windows support is separate from WSL.',
      nextStep: 'Run ccgui from inside WSL and use Linux project paths for the WebGUI path picker.'
    })
  }

  const pty = await ptyDoctorAsync()
  checks.push(pty.available && pty.healthy
    ? { id: 'pty', label: 'PTY health', status: 'pass', detail: pty.shell || 'healthy' }
    : {
        id: 'pty',
        label: 'PTY health',
        status: 'fail',
        detail: pty.error || `exit=${pty.exitCode} signal=${pty.signal}`,
        nextStep: 'Use Demo mode until PTY health passes.'
      })

  const failed = checks.filter((check) => check.status === 'fail').map((check) => check.label)
  return {
    ok: failed.length === 0,
    nodeVersion,
    platform,
    platformRelease,
    commandExecutable,
    commandCodeVersion: binary.version,
    modelCount,
    pty,
    checks,
    passed: checks.filter((check) => check.status === 'pass').map((check) => check.label),
    failed
  }
}

function installCommandForPlatform(platform: NodeJS.Platform): string {
  if (platform === 'win32') return 'Install Command Code inside WSL, then run ccgui from that WSL shell.'
  return 'Install Command Code with the documented package command, then run cmd --version.'
}
