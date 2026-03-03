'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorFallback } from '~src/app/components/ErrorFallback'
import { reportError } from '~src/utils/errors/reportError'

export type ErrorBoundaryProps = {
  children: ReactNode
  namespaceSlug?: string
  fallback?: (props: { error: Error; errorCode?: string }) => ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
  error: Error | null
  errorCode?: string
}

/**
 * React Error Boundary that catches JavaScript errors in child components.
 *
 * Catches errors during rendering, in lifecycle methods, and in constructors
 * of the whole tree below. Does NOT catch errors in:
 * - Event handlers (use try/catch)
 * - Asynchronous code (e.g., setTimeout, requestAnimationFrame callbacks)
 * - Server-side rendering
 * - Errors thrown in the error boundary itself
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorCode: undefined }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Report error and update state with error code when received
    void reportError(error, {
      errorInfo,
      namespaceSlug: this.props.namespaceSlug,
    }).then((errorCode) => {
      if (errorCode) {
        this.setState({ errorCode })
      }
    })
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          errorCode: this.state.errorCode,
        })
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorCode={this.state.errorCode}
        />
      )
    }

    return this.props.children
  }
}
