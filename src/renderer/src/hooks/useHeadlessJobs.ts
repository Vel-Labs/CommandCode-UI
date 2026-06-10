import { useRef, useState } from 'react'
import type { PermissionMode, HeadlessRunResult } from '../../../shared/types'
import type { TransportAPI } from '../../../core/transport'
import type { HeadlessJob } from '../components/HeadlessHistory'
import { notify, playChime } from '../components/ToastSystem'

type UseHeadlessJobsOptions = {
  transport: TransportAPI
  cwd: string
  useMock: boolean
  commandExecutable: string
  model: string
  permissionMode: PermissionMode
  trust: boolean
  skipOnboarding: boolean
  setStatusLine: (value: string) => void
}

export function useHeadlessJobs({
  transport,
  cwd,
  useMock,
  commandExecutable,
  model,
  permissionMode,
  trust,
  skipOnboarding,
  setStatusLine
}: UseHeadlessJobsOptions) {
  const [headlessJobs, setHeadlessJobs] = useState<HeadlessJob[]>([])
  const jobCounter = useRef(1)

  const runHeadless = async (prompt: string, maxTurns: number, yolo: boolean, plan = false): Promise<void> => {
    if (!prompt.trim()) return
    if (!cwd.trim() && !useMock) {
      setStatusLine('Choose a project directory before running headless.')
      return
    }

    const job: HeadlessJob = {
      id: `job-${jobCounter.current++}`,
      timestamp: Date.now(),
      prompt,
      model: model || undefined,
      mock: useMock
    }
    setHeadlessJobs((prev) => [job, ...prev].slice(0, 30))
    setStatusLine('Running headless job...')

    try {
      const result: HeadlessRunResult = await transport.runHeadless({
        cwd: cwd || '.',
        commandExecutable,
        prompt,
        model: model || undefined,
        permissionMode,
        maxTurns,
        yolo,
        plan,
        trust,
        skipOnboarding,
        timeoutMs: 10 * 60 * 1000,
        useMock
      })
      setHeadlessJobs((prev) => prev.map((entry) => entry.id === job.id ? { ...entry, result } : entry))
      notify('Headless job complete', 'headless-complete')
      playChime('headless-complete')
      setStatusLine(`Headless job exited with code=${result.exitCode ?? 'null'}`)
    } catch {
      notify('Headless job failed', 'headless-error')
      playChime('headless-error')
      setStatusLine('Headless job failed.')
      setHeadlessJobs((prev) => prev.map((entry) => entry.id === job.id ? { ...entry, result: {
        command: commandExecutable,
        args: [],
        cwd: cwd || '.',
        exitCode: 1,
        signal: null,
        stdout: '',
        stderr: 'Failed to execute headless job',
        timedOut: false,
        durationMs: 0
      }} : entry))
    }
  }

  return {
    headlessJobs,
    runHeadless,
    clearHeadlessJobs: () => setHeadlessJobs([])
  }
}
