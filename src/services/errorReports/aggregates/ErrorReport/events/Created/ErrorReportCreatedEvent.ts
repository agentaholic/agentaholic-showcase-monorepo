export type ErrorReportCreatedEvent = {
  name: 'ErrorReportCreated'
  version: 1
  id: string
  aggregate: {
    name: 'ErrorReport'
    id: string
    service: { name: 'errorReports' }
  }

  data: {
    errorCode: string
    error: {
      name: string
      message: string
      stack?: string
      componentStack?: string
    }
    url: string
    userAgent: string
    timestamp: string
    namespaceSlug?: string
  }
}
