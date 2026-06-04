import { useState } from 'react'
import type { JSX } from 'react'
import type { HeadlessRunResult, PermissionMode } from '../../../shared/types'

type HeadlessRunnerProps = {
  cwd: string
  commandExecutable: string
  model: string
  permissionMode: PermissionMode
  trust: boolean
  skipOnboarding: boolean
}

export function HeadlessRunner(props: HeadlessRunnerProps): JSX.Element {
  const [prompt, setPrompt] = useState('Summarize this project and suggest the next safest GUI integration step.')
  const [maxTurns, setMaxTurns] = useState(10)
  const [yolo, setYolo] = useState(false)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<HeadlessRunResult | null>(null)

  const run = async (): Promise<void> => {
    setRunning(true)
    setResult(null)
    try {
      const next = await window.commandCode.runHeadless({
        cwd: props.cwd,
        commandExecutable: props.commandExecutable,
        prompt,
        model: props.model || undefined,
        permissionMode: props.permissionMode,
        maxTurns,
        yolo,
        trust: props.trust,
        skipOnboarding: props.skipOnboarding,
        timeoutMs: 10 * 60 * 1000
      })
      setResult(next)
    } finally {
      setRunning(false)
    }
  }

  return (
    <section className="headless-card">
      <div>
        <div className="section-heading">Headless run</div>
        <p className="muted">Runs <code>cmd --print</code> and exits. Good for automation and structured one-shot tasks.</p>
      </div>

      <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} />

      <div className="headless-options">
        <label>
          Max turns
          <input type="number" min={1} max={100} value={maxTurns} onChange={(event) => setMaxTurns(Number(event.target.value))} />
        </label>
        <label className="check-row inline">
          <input type="checkbox" checked={yolo} onChange={(event) => setYolo(event.target.checked)} />
          Allow write tools and shell commands
        </label>
        <button className="primary-button" onClick={run} disabled={running || !prompt.trim()}>{running ? 'Running…' : 'Run headless'}</button>
      </div>

      {result && (
        <div className="headless-result">
          <div className="result-meta">
            exit={String(result.exitCode)} signal={String(result.signal)} duration={result.durationMs}ms timeout={String(result.timedOut)}
          </div>
          <pre>{result.stdout || '(no stdout)'}</pre>
          {result.stderr && <pre className="stderr">{result.stderr}</pre>}
        </div>
      )}
    </section>
  )
}
