import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { ErrorBoundary } from '~src/app/components/ErrorBoundary'

// Mock reportError
vi.mock('~src/utils/errors/reportError', () => ({
  reportError: vi.fn().mockResolvedValue('ERR-TEST12'),
}))

// Component that throws an error
function ThrowingComponent({ error }: { error: Error }): never {
  throw error
}

// Component that renders normally
function NormalComponent() {
  return <div>Normal content</div>
}

describe('ErrorBoundary', () => {
  // claude-hooks-ignore-logging-violation
  const originalError = console.error
  beforeEach(() => {
    // claude-hooks-ignore-logging-violation
    console.error = vi.fn()
  })
  afterEach(() => {
    // claude-hooks-ignore-logging-violation
    console.error = originalError
  })

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <NormalComponent />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Normal content')).toBeInTheDocument()
  })

  it('renders ErrorFallback when an error occurs', () => {
    const testError = new Error('Test error message')

    render(
      <ErrorBoundary>
        <ThrowingComponent error={testError} />
      </ErrorBoundary>,
    )

    expect(screen.getByText('SOMETHING WENT WRONG')).toBeInTheDocument()
    expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Refresh Page/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Go Home/ })).toBeInTheDocument()
  })

  it('displays error code when reportError returns one', async () => {
    const testError = new Error('Test error message')

    render(
      <ErrorBoundary>
        <ThrowingComponent error={testError} />
      </ErrorBoundary>,
    )

    await waitFor(() => {
      expect(screen.getByText('ERROR CODE: ERR-TEST12')).toBeInTheDocument()
    })
  })

  it('renders custom fallback when provided', () => {
    const testError = new Error('Test error message')
    const customFallback = vi.fn(
      ({ error, errorCode }: { error: Error; errorCode?: string }) => (
        <div>
          Custom error: {error.message}
          {errorCode && <span>Code: {errorCode}</span>}
        </div>
      ),
    )

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowingComponent error={testError} />
      </ErrorBoundary>,
    )

    expect(
      screen.getByText(/Custom error: Test error message/),
    ).toBeInTheDocument()
  })

  it('shows error details in dev mode', () => {
    // Tests run in DEV mode by default, so error details should be visible
    const testError = new Error('Test error message')
    testError.name = 'TestError'

    render(
      <ErrorBoundary>
        <ThrowingComponent error={testError} />
      </ErrorBoundary>,
    )

    // New UI shows error name and message separately
    expect(screen.getByText('TestError')).toBeInTheDocument()
    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })
})
