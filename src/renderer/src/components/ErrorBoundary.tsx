import { Component, type ErrorInfo, type ReactNode } from 'react'
import type { JSX } from 'react'

type ErrorBoundaryProps = {
  children: ReactNode
  fallback: (error: Error, reset: () => void) => ReactNode
  resetKey?: string
  onError?: (error: Error, info: ErrorInfo) => void
}

type ErrorBoundaryState = {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info)
  }

  override componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  reset = (): void => {
    this.setState({ error: null })
  }

  override render(): ReactNode {
    if (this.state.error) return this.props.fallback(this.state.error, this.reset)
    return this.props.children
  }
}

export function WorkspaceErrorFallback({
  title,
  error,
  onRetry,
  actions
}: {
  title: string
  error: Error
  onRetry: () => void
  actions?: ReactNode
}): JSX.Element {
  return (
    <section className="workspace-error" role="alert">
      <div>
        <span>Render fallback</span>
        <strong>{title}</strong>
        <code>{error.message}</code>
      </div>
      <div className="workspace-error-actions">
        {actions}
        <button className="ghost-button native-ghost" onClick={onRetry}>Retry view</button>
      </div>
    </section>
  )
}
