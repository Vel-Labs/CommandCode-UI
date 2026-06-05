import type { JSX } from 'react'
import type { HeadlessRunResult } from '../../../shared/types'

type HeadlessHistoryProps = {
  jobs: HeadlessJob[]
  onClear: () => void
}

export type HeadlessJob = {
  id: string
  timestamp: number
  prompt: string
  model?: string
  mock: boolean
  result?: HeadlessRunResult
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString()
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str
  return str.slice(0, max) + '…'
}

export function HeadlessHistory({ jobs, onClear }: HeadlessHistoryProps): JSX.Element {
  if (jobs.length === 0) return <div />

  return (
    <div className="headless-history">
      <div className="section-heading">
        Headless jobs ({jobs.length})
        <button className="ghost-button" onClick={onClear} style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>
          Clear
        </button>
      </div>
      <div className="history-job-list">
        {jobs.map((job) => (
          <div key={job.id} className={`history-job ${job.result ? 'history-job--done' : 'history-job--running'}`}>
            <div className="job-header">
              <span className="job-time">{formatTime(job.timestamp)}</span>
              <span className={`status-pill ${job.mock ? 'status-pill--purple' : ''}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                {job.mock ? 'Mock' : 'Real CLI'}
              </span>
              {job.model && <span className="job-model">{job.model}</span>}
              {job.result && (
                <span className={`job-exit ${job.result.exitCode === 0 ? 'text-green' : 'text-red'}`}>
                  exit={job.result.exitCode ?? 'null'} {job.result.durationMs}ms
                </span>
              )}
            </div>
            <div className="job-prompt">{truncate(job.prompt, 120)}</div>
            {job.result && (
              <div className="job-output">
                {job.result.stdout && <pre className="job-stdout">{truncate(job.result.stdout, 300)}</pre>}
                {job.result.stderr && <pre className="job-stderr">{truncate(job.result.stderr, 200)}</pre>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
