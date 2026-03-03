export type ErrorReportAggregate = {
  id: string
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
