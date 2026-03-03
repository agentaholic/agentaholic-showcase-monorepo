import { api, Header } from 'encore.dev/api'
import log from 'encore.dev/log'
import { events } from '~encore/clients'
import { ErrorReportCreatedEvent } from '~src/services/errorReports/aggregates/ErrorReport/events/Created/ErrorReportCreatedEvent'
import { generateId } from '~src/utils/id/generateId'

interface ReportErrorRequest {
  namespaceSlug?: Header<'X-Namespace-Slug'>

  error: {
    name: string
    message: string
    stack?: string
    componentStack?: string
  }
  url: string
  userAgent: string
  timestamp: string
}

interface ReportErrorResponse {
  errorCode: string
}

/**
 * Generates a short, human-readable error code.
 * Format: ERR-XXXXXX (6 alphanumeric chars from flickrBase58)
 */
function generateErrorCode(): string {
  const id = generateId({ mode: 'random' })
  // Take first 6 chars for readability
  return `ERR-${id.slice(0, 6).toUpperCase()}`
}

export const report = api(
  { expose: true, method: 'POST', path: '/error-reports' },
  async (params: ReportErrorRequest): Promise<ReportErrorResponse> => {
    const { namespaceSlug = 'main', error, url, userAgent, timestamp } = params

    const namespace = { slug: namespaceSlug }
    const errorReport = { id: generateId({ mode: 'random' }) }
    const errorCode = generateErrorCode()

    // Log error for trace browser visibility
    log.error('Frontend error reported', {
      errorCode,
      errorName: error.name,
      errorMessage: error.message,
      url,
      namespaceSlug,
      aggregateId: errorReport.id,
    })

    const event: ErrorReportCreatedEvent = {
      name: 'ErrorReportCreated',
      version: 1,
      id: generateId({ mode: 'random' }),
      aggregate: {
        name: 'ErrorReport',
        id: errorReport.id,
        service: { name: 'errorReports' },
      },
      data: {
        errorCode,
        error,
        url,
        userAgent,
        timestamp,
        namespaceSlug,
      },
    }

    await events.commitTransaction({
      events: [event],
      namespace,
    })

    return {
      errorCode,
    }
  },
)
