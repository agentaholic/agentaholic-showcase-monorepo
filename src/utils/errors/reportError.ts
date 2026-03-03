import Debug from 'debug'
import type { ErrorInfo } from 'react'

import { apiClient } from '~src/utils/api/apiClient'

const debug = Debug('errors')

export type ReportErrorOptions = {
  errorInfo?: ErrorInfo
  namespaceSlug?: string
}

/**
 * Reports an error to local debug logging and sends it to the backend.
 * Returns the error code from the backend for display to users.
 */
export async function reportError(
  error: Error,
  options?: ReportErrorOptions,
): Promise<string | undefined> {
  const { errorInfo, namespaceSlug = 'main' } = options ?? {}
  const url = typeof window !== 'undefined' ? window.location.href : 'unknown'
  const userAgent =
    typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
  const timestamp = new Date().toISOString()

  // Local debug logging
  debug('Error caught:', error.message)
  debug('Error stack:', error.stack)
  if (errorInfo?.componentStack) {
    debug('Component stack:', errorInfo.componentStack)
  }

  // Send to backend
  try {
    const response = await apiClient.errorReports.report({
      namespaceSlug,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo?.componentStack ?? undefined,
      },
      url,
      userAgent,
      timestamp,
    })

    debug('Error reported with code:', response.errorCode)
    return response.errorCode
  } catch (reportingError) {
    // Don't throw if reporting fails - we don't want to mask the original error
    debug('Error reporting failed:', reportingError)
    return undefined
  }
}
