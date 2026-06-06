export type SessionReadinessStatus =
  | 'idle'
  | 'attaching'
  | 'replaying'
  | 'running'
  | 'waiting-for-input'
  | 'response-ready'
  | 'exited'
  | 'errored'

export type ReadinessNotification = 'response-ready' | 'input-required'

export type SessionReadinessTone = 'default' | 'good' | 'warn' | 'bad' | 'purple'

export type SessionReadinessDisplay = {
  label: string
  tone: SessionReadinessTone
  title: string
}

export type SessionReadinessState = {
  sessionId: string
  status: SessionReadinessStatus
  backgrounded: boolean
  unread: boolean
  responseReady: boolean
  inputRequired: boolean
  errorMessage?: string
}

export type SessionReadinessEvent =
  | { type: 'attach' }
  | { type: 'replay-start' }
  | { type: 'replay-complete' }
  | { type: 'foreground' }
  | { type: 'background' }
  | { type: 'output'; source: 'live' | 'replay' }
  | { type: 'assistant-ready' }
  | { type: 'input-required' }
  | { type: 'user-submit' }
  | { type: 'exit' }
  | { type: 'error'; message?: string }

export type SessionReadinessUpdate = {
  state: SessionReadinessState
  notification?: ReadinessNotification
}

export function initialSessionReadiness(sessionId: string): SessionReadinessState {
  return {
    sessionId,
    status: 'idle',
    backgrounded: false,
    unread: false,
    responseReady: false,
    inputRequired: false
  }
}

export function sessionReadinessDisplay(state: SessionReadinessState): SessionReadinessDisplay {
  switch (state.status) {
    case 'attaching':
      return { label: 'attaching', tone: 'purple', title: 'Attaching to the Command Code session' }
    case 'replaying':
      return { label: 'replaying', tone: 'purple', title: 'Replaying existing session output' }
    case 'waiting-for-input':
      return { label: 'waiting for input', tone: 'warn', title: 'Command Code is waiting for operator input' }
    case 'response-ready':
      return { label: 'response ready', tone: 'good', title: 'Command Code has a response ready' }
    case 'exited':
      return { label: 'completed', tone: 'default', title: 'The session has exited' }
    case 'errored':
      return { label: 'errored', tone: 'bad', title: state.errorMessage || 'The session reported an error' }
    case 'running':
      if (state.unread) return { label: 'unread output', tone: 'purple', title: 'Background session has unread output' }
      return { label: 'running', tone: 'default', title: 'Session is running' }
    case 'idle':
      if (state.unread) return { label: 'unread output', tone: 'purple', title: 'Session has unread output' }
      return { label: 'attached', tone: 'default', title: 'Session is attached' }
  }
}

export function reduceSessionReadiness(
  state: SessionReadinessState,
  event: SessionReadinessEvent
): SessionReadinessUpdate {
  switch (event.type) {
    case 'attach':
      return update(state, {
        status: 'attaching',
        responseReady: false,
        inputRequired: false,
        errorMessage: undefined
      })
    case 'replay-start':
      return update(state, {
        status: 'replaying',
        responseReady: false,
        inputRequired: false
      })
    case 'replay-complete':
      return update(state, {
        status: 'running',
        responseReady: false,
        inputRequired: false
      })
    case 'foreground':
      return update(state, {
        backgrounded: false,
        unread: false
      })
    case 'background':
      return update(state, { backgrounded: true })
    case 'output':
      if (event.source === 'replay') {
        return update(state, { status: state.status === 'idle' ? 'replaying' : state.status })
      }
      return update(state, {
        status: state.status === 'idle' ? 'running' : state.status,
        unread: state.backgrounded ? true : state.unread
      })
    case 'assistant-ready':
      return update(
        state,
        {
          status: 'response-ready',
          unread: state.backgrounded ? true : state.unread,
          responseReady: true,
          inputRequired: false
        },
        state.backgrounded ? 'response-ready' : undefined
      )
    case 'input-required':
      return update(
        state,
        {
          status: 'waiting-for-input',
          unread: state.backgrounded ? true : state.unread,
          responseReady: false,
          inputRequired: true
        },
        state.backgrounded ? 'input-required' : undefined
      )
    case 'user-submit':
      return update(state, {
        status: 'running',
        unread: false,
        responseReady: false,
        inputRequired: false,
        errorMessage: undefined
      })
    case 'exit':
      return update(state, {
        status: 'exited',
        responseReady: false,
        inputRequired: false
      })
    case 'error':
      return update(state, {
        status: 'errored',
        responseReady: false,
        inputRequired: false,
        errorMessage: event.message
      })
  }
}

function update(
  state: SessionReadinessState,
  patch: Partial<SessionReadinessState>,
  notification?: ReadinessNotification
): SessionReadinessUpdate {
  return {
    state: { ...state, ...patch },
    notification
  }
}
