import React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { ErrorBoundary, WorkspaceErrorFallback } from './components/ErrorBoundary'
import './styles.css'
import '@xterm/xterm/css/xterm.css'

createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary
      fallback={(error, reset) => (
        <WorkspaceErrorFallback title="Command Code shell crashed" error={error} onRetry={reset} />
      )}
    >
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
