import { describe, it, expect } from 'vitest'
import { buildInteractiveArgs, buildHeadlessArgs, getCommandExecutable, normalizeCwd } from '../src/core/cli'
import { CoreSessionManager, type PtySpawnFn } from '../src/core/sessions'
import { buildPtySubmitChunks } from '../src/shared/ptyInput'
import { looksLikeCliSelectionPrompt, stripAnsi } from '../src/shared/terminalPrompts'
import os from 'node:os'
import { readFileSync } from 'node:fs'
import type { IPty } from 'node-pty'

class FakePty {
  private dataHandler: ((data: string) => void) | undefined
  private exitHandler: ((payload: { exitCode: number; signal?: number | string }) => void) | undefined
  readonly writes: string[] = []

  onData(handler: (data: string) => void): void {
    this.dataHandler = handler
  }

  onExit(handler: (payload: { exitCode: number; signal?: number | string }) => void): void {
    this.exitHandler = handler
  }

  write(data: string): void {
    this.writes.push(data)
  }

  resize(): void {
    // No-op for tests.
  }

  kill(): void {
    this.exitHandler?.({ exitCode: 0 })
  }

  emitData(data: string): void {
    this.dataHandler?.(data)
  }

  emitExit(exitCode = 0): void {
    this.exitHandler?.({ exitCode })
  }
}

describe('getCommandExecutable', () => {
  it('returns "cmd" when no input provided', () => {
    expect(getCommandExecutable()).toBe('cmd')
  })

  it('returns trimmed input when provided', () => {
    expect(getCommandExecutable('  foo  ')).toBe('foo')
  })

  it('respects COMMAND_CODE_BIN env var when no input', () => {
    process.env.COMMAND_CODE_BIN = 'custom-cmd'
    expect(getCommandExecutable()).toBe('custom-cmd')
    delete process.env.COMMAND_CODE_BIN
  })

  it('prefers input over env var', () => {
    process.env.COMMAND_CODE_BIN = 'env-cmd'
    expect(getCommandExecutable('explicit')).toBe('explicit')
    delete process.env.COMMAND_CODE_BIN
  })
})

describe('normalizeCwd', () => {
  it('resolves a valid directory', () => {
    const result = normalizeCwd(os.homedir())
    expect(result).toBe(os.homedir())
  })

  it('throws for a non-existent path', () => {
    expect(() => normalizeCwd('/this/path/does/not/exist/abc123')).toThrow('does not exist')
  })

  it('throws when input is empty', () => {
    expect(() => normalizeCwd('')).toThrow('Project directory is required')
  })
})

describe('buildInteractiveArgs', () => {
  it('returns empty array with no options', () => {
    expect(buildInteractiveArgs({})).toEqual([])
  })

  it('includes initialPrompt verbatim', () => {
    expect(buildInteractiveArgs({ initialPrompt: 'hello' })).toEqual(['hello'])
  })

  it('includes --resume before common options', () => {
    expect(buildInteractiveArgs({ resume: 'Verify roadmap layers', model: 'deepseek' })).toEqual(['--resume', 'Verify roadmap layers', '--model', 'deepseek'])
  })

  it('includes --continue for the last conversation', () => {
    expect(buildInteractiveArgs({ continueLast: true })).toEqual(['--continue'])
  })

  it('prefers --continue over --resume when both are provided', () => {
    expect(buildInteractiveArgs({ continueLast: true, resume: 'older session' })).toEqual(['--continue'])
  })

  it('includes --model when model is provided', () => {
    expect(buildInteractiveArgs({ model: 'claude-sonnet' })).toEqual(['--model', 'claude-sonnet'])
  })

  it('ignores empty model string', () => {
    expect(buildInteractiveArgs({ model: '  ' })).toEqual([])
  })

  it('includes --permission-mode when not standard', () => {
    expect(buildInteractiveArgs({ permissionMode: 'plan' })).toEqual(['--permission-mode', 'plan'])
  })

  it('omits --permission-mode for standard', () => {
    expect(buildInteractiveArgs({ permissionMode: 'standard' })).toEqual([])
  })

  it('omits --permission-mode for undefined', () => {
    expect(buildInteractiveArgs({})).not.toContain('--permission-mode')
  })

  it('includes --trust flag', () => {
    expect(buildInteractiveArgs({ trust: true })).toContain('--trust')
  })

  it('includes --skip-onboarding flag', () => {
    expect(buildInteractiveArgs({ skipOnboarding: true })).toContain('--skip-onboarding')
  })

  it('includes --add-dir for each directory', () => {
    const args = buildInteractiveArgs({ addDirs: ['/foo', '/bar'] })
    expect(args.filter((a) => a === '--add-dir')).toHaveLength(2)
    expect(args).toContain('/foo')
    expect(args).toContain('/bar')
  })

  it('combines all options', () => {
    const args = buildInteractiveArgs({
      initialPrompt: 'hi',
      model: 'claude',
      permissionMode: 'auto-accept',
      trust: true,
      skipOnboarding: true
    })
    expect(args).toEqual(['hi', '--model', 'claude', '--permission-mode', 'auto-accept', '--trust', '--skip-onboarding'])
  })
})

describe('buildHeadlessArgs', () => {
  const baseOptions = {
    cwd: '/tmp',
    commandExecutable: 'cmd',
    prompt: 'what is 2+2'
  }

  it('always starts with --print', () => {
    expect(buildHeadlessArgs(baseOptions)[0]).toBe('--print')
  })

  it('includes prompt after --print', () => {
    const args = buildHeadlessArgs(baseOptions)
    expect(args[1]).toBe('what is 2+2')
  })

  it('includes --max-turns when specified', () => {
    const args = buildHeadlessArgs({ ...baseOptions, maxTurns: 5 })
    expect(args).toContain('--max-turns')
    expect(args).toContain('5')
  })

  it('omits --max-turns when zero (falsy)', () => {
    const args = buildHeadlessArgs({ ...baseOptions, maxTurns: 0 })
    expect(args).not.toContain('--max-turns')
  })

  it('clamps negative maxTurns to 1', () => {
    const args = buildHeadlessArgs({ ...baseOptions, maxTurns: -5 })
    const idx = args.indexOf('--max-turns')
    expect(args[idx! + 1]).toBe('1')
  })

  it('includes --yolo flag when true', () => {
    const args = buildHeadlessArgs({ ...baseOptions, yolo: true })
    expect(args).toContain('--yolo')
  })

  it('uses plan permission-mode when plan is true', () => {
    const args = buildHeadlessArgs({ ...baseOptions, plan: true, permissionMode: 'standard' })
    expect(args).toContain('--permission-mode')
    expect(args).toContain('plan')
  })

  it('includes --trust and --skip-onboarding', () => {
    const args = buildHeadlessArgs({ ...baseOptions, trust: true, skipOnboarding: true })
    expect(args).toContain('--trust')
    expect(args).toContain('--skip-onboarding')
  })
})

describe('buildPtySubmitChunks', () => {
  it('turns composer prompts into keystrokes plus Enter', () => {
    expect(buildPtySubmitChunks('test')).toEqual(['t', 'e', 's', 't', '\r'])
  })

  it('trims outer whitespace before submitting', () => {
    expect(buildPtySubmitChunks('  test  ')).toEqual(['t', 'e', 's', 't', '\r'])
  })

  it('normalizes CRLF prompt content before submitting', () => {
    expect(buildPtySubmitChunks('one\r\ntwo')).toEqual(['o', 'n', 'e', '\n', 't', 'w', 'o', '\r'])
  })

  it('sends only Enter for empty input', () => {
    expect(buildPtySubmitChunks('   ')).toEqual(['\r'])
  })
})

describe('looksLikeCliSelectionPrompt', () => {
  it('detects Command Code shell permission menus', () => {
    const output = [
      'Execute Shell Command',
      '',
      'Command Code needs to execute npx vitest run.',
      '',
      '❯ 1. Yes',
      '  2. Yes, allow all edits during this session [shift+tab]',
      '  3. No, and tell Command Code what to do differently'
    ].join('\n')

    expect(looksLikeCliSelectionPrompt(output)).toBe(true)
  })

  it('handles ANSI-decorated selection output', () => {
    const output = '\x1b[33mExecute Shell Command\x1b[0m\r\nCommand Code needs permission\r\n\x1b[36m❯ 1. Yes\x1b[0m\r\n  2. No'

    expect(stripAnsi(output)).not.toContain('\x1b')
    expect(looksLikeCliSelectionPrompt(output)).toBe(true)
  })

  it('does not treat ordinary numbered output as a menu', () => {
    const output = ['Test plan', '1. Add unit tests', '2. Run build'].join('\n')

    expect(looksLikeCliSelectionPrompt(output)).toBe(false)
  })
})

describe('CoreSessionManager session metadata', () => {
  it('returns the model captured at session start', () => {
    const manager = new CoreSessionManager()
    const result = manager.start({
      cwd: os.homedir(),
      useMock: true,
      model: '  deepseek/deepseek-v4-pro  '
    })

    expect(result.model).toBe('deepseek/deepseek-v4-pro')
    manager.forceKill(result.id)
  })

  it('omits empty model metadata instead of implying a current global model', () => {
    const manager = new CoreSessionManager()
    const result = manager.start({
      cwd: os.homedir(),
      useMock: true,
      model: '   '
    })

    expect(result.model).toBeUndefined()
    manager.forceKill(result.id)
  })

  it('keeps a blocked mock session independent from other live sessions', async () => {
    const manager = new CoreSessionManager()
    const first = manager.start({ cwd: os.homedir(), useMock: true })
    const second = manager.start({ cwd: os.homedir(), useMock: true })
    const third = manager.start({ cwd: os.homedir(), useMock: true })
    const exited: string[] = []
    manager.on('session:exit', (payload) => exited.push(payload.sessionId))

    manager.write(first.id, 'partial input without newline')
    manager.write(second.id, '/exit\r')

    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(exited).toContain(second.id)
    expect(manager.isActive(first.id)).toBe(true)
    expect(manager.isActive(second.id)).toBe(false)
    expect(manager.isActive(third.id)).toBe(true)

    manager.write(first.id, '/help\r')
    await new Promise((resolve) => setTimeout(resolve, 350))

    expect(manager.getReplay(first.id)).toContain('Mock slash commands')
    expect(manager.getReplay(third.id)).toContain('Command Code GUI mock session')

    manager.forceKill(first.id)
    manager.forceKill(third.id)
  })

  it('flushes transcript output asynchronously without blocking session replay', async () => {
    const manager = new CoreSessionManager()
    const result = manager.start({ cwd: os.homedir(), useMock: true })

    expect(manager.getReplay(result.id)).toContain('Command Code GUI mock session')

    await manager.flushTranscriptsForTesting()
    expect(readFileSync(result.transcriptPath, 'utf8')).toContain('Command Code GUI mock session')

    manager.forceKill(result.id)
  })

  it('emits stream telemetry for input, output, and exit state', async () => {
    const manager = new CoreSessionManager()
    const telemetry: Array<{ inputChunks: number; outputChunks: number; exitCode?: number | null }> = []
    const exits: string[] = []
    manager.on('session:telemetry', (_sessionId, snapshot) => {
      telemetry.push({
        inputChunks: snapshot.inputChunks,
        outputChunks: snapshot.outputChunks,
        exitCode: snapshot.exitCode
      })
    })
    manager.on('session:exit', (payload) => exits.push(payload.sessionId))

    const result = manager.start({ cwd: os.homedir(), useMock: true, model: 'deepseek-v4-pro' })
    expect(result.telemetry).toMatchObject({
      command: 'cmd',
      model: 'deepseek-v4-pro',
      inputChunks: 0
    })

    manager.write(result.id, 'hello')
    manager.write(result.id, '/exit\r')

    await manager.flushTranscriptsForTesting()

    expect(exits).toContain(result.id)
    expect(telemetry.some((snapshot) => snapshot.inputChunks >= 1)).toBe(true)
    expect(telemetry.some((snapshot) => snapshot.outputChunks >= 1)).toBe(true)
    expect(telemetry.at(-1)?.exitCode).toBe(0)
  })

  it('routes real PTY output through replay and stream telemetry', async () => {
    const fakePty = new FakePty()
    const ptyFactory: PtySpawnFn = () => fakePty as unknown as IPty
    const manager = new CoreSessionManager(ptyFactory)
    const telemetry: Array<{ outputChunks: number; outputBytes: number; exitCode?: number | null }> = []
    manager.on('session:telemetry', (_sessionId, snapshot) => {
      telemetry.push({
        outputChunks: snapshot.outputChunks,
        outputBytes: snapshot.outputBytes,
        exitCode: snapshot.exitCode
      })
    })

    const result = manager.start({ cwd: os.homedir(), commandExecutable: 'cmd', model: 'deepseek-v4-pro' })
    fakePty.emitData('real output from pty\r\n')

    expect(manager.getReplay(result.id)).toContain('real output from pty')
    fakePty.emitExit(0)

    await manager.flushTranscriptsForTesting()

    expect(readFileSync(result.transcriptPath, 'utf8')).toContain('real output from pty')
    expect(telemetry.some((snapshot) => snapshot.outputChunks >= 1 && snapshot.outputBytes > 0)).toBe(true)
    expect(telemetry.at(-1)?.exitCode).toBe(0)
  })
})
