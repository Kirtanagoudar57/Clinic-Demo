import { AlertTriangle, Home, RotateCcw } from 'lucide-react'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { clearStoredData } from '../lib/store'

interface State {
  error: Error | null
}

/**
 * Catches render errors so a problem shows a recoverable message instead of a
 * blank white page. The most likely cause in this demo is stale data saved in
 * the browser, so "Reset demo data" is offered as the fix.
 */
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Page crashed:', error, info.componentStack)
  }

  componentDidUpdate(prev: { resetKey?: string }) {
    // Navigating to another page clears the error.
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    return (
      <div className="container-page grid min-h-[60vh] place-items-center py-16">
        <div className="card max-w-lg p-8 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-amber-50 text-amber-600">
            <AlertTriangle className="size-7" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-2xl font-semibold">Something went wrong</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            This page couldn't load. It's usually caused by old demo data saved in this browser. Resetting the demo data
            normally fixes it.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                clearStoredData()
                window.location.reload()
              }}
            >
              <RotateCcw className="size-4" aria-hidden="true" /> Reset demo data & reload
            </button>
            <a href="#/" onClick={() => this.setState({ error: null })} className="btn-secondary">
              <Home className="size-4" aria-hidden="true" /> Go to home page
            </a>
          </div>
          <details className="mt-6 text-left text-xs text-slate-500">
            <summary className="cursor-pointer">Technical details</summary>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3">{error.message}</pre>
          </details>
        </div>
      </div>
    )
  }
}
