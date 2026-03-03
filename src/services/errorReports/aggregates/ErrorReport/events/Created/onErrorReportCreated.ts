import { ErrorReportCreatedEvent } from '~src/services/errorReports/aggregates/ErrorReport/events/Created/ErrorReportCreatedEvent'
import { ErrorReportAggregate } from '~src/services/errorReports/aggregates/ErrorReport/types/ErrorReportAggregate'

export const onErrorReportCreated = (
  _aggregate: ErrorReportAggregate | null,
  event: ErrorReportCreatedEvent,
): ErrorReportAggregate | null => {
  return {
    id: event.aggregate.id,
    errorCode: event.data.errorCode,
    error: event.data.error,
    url: event.data.url,
    userAgent: event.data.userAgent,
    timestamp: event.data.timestamp,
    namespaceSlug: event.data.namespaceSlug,
  }
}
