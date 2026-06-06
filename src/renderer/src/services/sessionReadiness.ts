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
