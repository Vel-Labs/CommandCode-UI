import { useState } from 'react'
import type { JSX } from 'react'

type HeadlessRunnerProps = {
  onRun: (prompt: string, maxTurns: number, yolo: boolean) => Promise<void>
  useMock: boolean
}

export function HeadlessRunner({ onRun, useMock }: HeadlessRunnerProps): JSX.Element {
  const [prompt, setPrompt] = useState('Summarize this project and suggest the next safest GUI integration step.')
  const [maxTurns, setMaxTurns] = useState(10)
  const [yolo, setYolo] = useState(false)
  const [running, setRunning] = useState(false)

  const run = async (): Promise<void> => {
    setRunning(true)
    try {
      await onRun(prompt, maxTurns, yolo)
    } finally {
      setRunning(false)
    }
  }

  return (
    <section className="headless-card">
      <div>
        <div className="section-heading">
          Headless run
          <span className={`status-pill ${useMock ? 'status-pill--purple' : ''}`} style={{ marginLeft: '8px', fontSize: '10px', padding: '2px 6px' }}>
            {useMock ? 'Mock' : 'Real CLI'}
          </span>
        </div>
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
    </section>
  )
}
